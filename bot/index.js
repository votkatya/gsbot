const { Bot, webhookCallback } = require("grammy");
const express = require("express");
const { Pool } = require("pg");

const BOT_TOKEN = "8091797199:AAHAhjl7ooj4ajYdoxZwl-B4AtRlrj_WZqI";
const WEBAPP_URL = "https://gsbot18.ru";

const pool = new Pool({
    user: "gsadmin",
    password: "GorodSporta2025!",
    host: "localhost",
    port: 5432,
    database: "gorodsporta"
});

const bot = new Bot(BOT_TOKEN);

// Установить Menu Button для Web App
bot.api.setChatMenuButton({
    menu_button: {
        type: "web_app",
        text: "Открыть игру",
        web_app: { url: WEBAPP_URL }
    }
}).catch(err => console.error("Failed to set menu button:", err));

bot.command("start", async (ctx) => {
    const tgUser = ctx.from;
    const param = ctx.match || "";

    console.log("📱 /start command from:", tgUser.id, tgUser.first_name);

    // Создаём пользователя в базе (без phone и membership - их заполним при регистрации)
    try {
        const result = await pool.query(
            `INSERT INTO users (telegram_id, first_name, last_name, username, coins, xp, last_activity_at, created_at)
             VALUES ($1, $2, $3, $4, 0, 0, now(), now())
             ON CONFLICT (telegram_id) DO UPDATE SET
             first_name = $2, last_name = $3, username = $4, last_activity_at = now()
             RETURNING *`,
            [tgUser.id, tgUser.first_name, tgUser.last_name || "", tgUser.username || ""]
        );
        console.log("✅ User created/updated:", result.rows[0].telegram_id);
    } catch (err) {
        console.error("❌ Failed to create/update user:", err.message);
    }

    // Сообщения отправляются через сторонний сервис
    // if (param.startsWith("qr_")) {
    //     await ctx.reply("QR-код найден! Открой приложение:", {
    //         reply_markup: {
    //             inline_keyboard: [[
    //                 { text: "Получить награду", web_app: { url: WEBAPP_URL + "?tgWebAppStartParam=" + param } }
    //             ]]
    //         }
    //     });
    // } else {
    //     await ctx.reply("Привет, " + tgUser.first_name + "! Добро пожаловать в Город Спорта!", {
    //         reply_markup: {
    //             inline_keyboard: [[
    //                 { text: "Начать", web_app: { url: WEBAPP_URL } }
    //             ]]
    //         }
    //     });
    // }
});

const app = express();

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Простая авторизация для админки с ролями
const ADMIN_PASSWORD = "GorodSporta2025Admin!"; // Полный доступ
const STAFF_PASSWORD = "GorodSporta2025Staff!"; // Только просмотр

// Учетные записи с ролями
const ACCOUNTS = {
    [ADMIN_PASSWORD]: { role: 'admin', name: 'Администратор' },
    [STAFF_PASSWORD]: { role: 'staff', name: 'Сотрудник' }
};

// Middleware для проверки любого админского доступа (админ или сотрудник)
function checkAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    const account = ACCOUNTS[token];
    if (!account) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Сохраняем роль в req для дальнейшей проверки
    req.userRole = account.role;
    req.userName = account.name;
    next();
}

// Middleware для проверки прав администратора (только admin)
function checkAdminRole(req, res, next) {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin rights required' });
    }
    next();
}

// Webhook для бота
app.post("/webhook", webhookCallback(bot, "express"));

// API для Mini App
app.get("/api/user/:telegramId", async (req, res) => {
    try {
        const { telegramId } = req.params;
        const userResult = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
        if (userResult.rows.length === 0) return res.json({ error: "User not found" });

        const user = userResult.rows[0];
        const tasksResult = await pool.query(
            `SELECT t.*, ut.status, ut.completed_at
             FROM tasks t
             LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $1
             ORDER BY t.day_number`, [user.id]
        );

        res.json({ user, tasks: tasksResult.rows });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/complete-task", async (req, res) => {
    try {
        const { telegramId, taskDay, verificationType, verificationData } = req.body;

        console.log('📥 Complete task request:', {
            telegramId,
            taskDay,
            verificationType,
            verificationData: verificationData?.substring?.(0, 50) || verificationData
        });

        const userResult = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
        if (userResult.rows.length === 0) return res.json({ error: "User not found" });
        const user = userResult.rows[0];

        const taskResult = await pool.query("SELECT * FROM tasks WHERE day_number = $1", [taskDay]);
        if (taskResult.rows.length === 0) return res.json({ error: "Task not found" });
        const task = taskResult.rows[0];

        // Проверяем, не выполнено ли уже задание
        const existingTask = await pool.query(
            "SELECT * FROM user_tasks WHERE user_id = $1 AND task_id = $2 AND status = 'completed'",
            [user.id, task.id]
        );
        if (existingTask.rows.length > 0) {
            return res.json({ error: "Task already completed" });
        }

        // Проверка QR кода
        if (task.verification_type === "qr" && verificationData) {
            const taskData = task.verification_data;
            const inputCode = verificationData.toLowerCase().trim();
            let isValid = false;

            // Сначала проверяем тестовый код
            if (taskData?.test_code && inputCode === taskData.test_code.toLowerCase()) {
                console.log('✅ Test code accepted for QR task:', inputCode);
                isValid = true;
            }
            // Проверяем основной QR-код
            else if (taskData?.qr_code && inputCode === taskData.qr_code.toLowerCase()) {
                console.log('✅ QR code accepted:', inputCode);
                isValid = true;
            }

            // Если ни один код не подошёл
            if (!isValid) {
                return res.json({ error: "Неверный код. Попробуйте ещё раз." });
            }
        }

        // Проверка кода из приложения (задание 2 или блок 2 с QR/ручными кодами)
        if (verificationType === "app_code") {
            const inputCode = verificationData?.toUpperCase().trim();
            const taskData = task.verification_data;
            let isValid = false;

            console.log('🔍 app_code check:', {
                inputCode,
                test_code: taskData?.test_code,
                qr_code: taskData?.qr_code,
                manual_code: taskData?.manual_code,
                main_code: taskData?.main_code
            });

            // 1. Проверяем тестовый код
            if (taskData?.test_code && inputCode === taskData.test_code.toUpperCase()) {
                console.log('✅ Test code accepted:', inputCode);
                isValid = true;
            }
            // 2. Проверяем ручной код (manual_code)
            else if (taskData?.manual_code && inputCode === taskData.manual_code.toUpperCase()) {
                console.log('✅ Manual code accepted:', inputCode);
                isValid = true;
            }
            // 3. Проверяем QR-код
            else if (taskData?.qr_code && inputCode === taskData.qr_code.toUpperCase()) {
                console.log('✅ QR code accepted:', inputCode);
                isValid = true;
            }
            // 4. Проверяем main_code (для совместимости)
            else if (taskData?.main_code && inputCode === taskData.main_code.toUpperCase()) {
                console.log('✅ Main code accepted:', inputCode);
                isValid = true;
            }

            // Если ни один код не подошёл - ошибка
            if (!isValid) {
                console.log('❌ app_code validation failed for:', inputCode);
                return res.json({ error: "Неверный код. Попробуй ещё раз." });
            }
        }

        // Проверка QR-кода или ручного кода для блока 2 (дни 3-10)
        if (verificationType === "qr_or_manual" && verificationData) {
            const inputCode = verificationData.toUpperCase().trim();
            const taskData = task.verification_data;
            let isValid = false;

            console.log('🔍 qr_or_manual check:', {
                inputCode,
                inputLength: inputCode.length,
                test_code: taskData?.test_code,
                manual_code: taskData?.manual_code,
                qr_code: taskData?.qr_code
            });

            // 1. Сначала проверяем тестовый код (работает всегда, любая длина)
            if (taskData?.test_code && inputCode === taskData.test_code.toUpperCase()) {
                console.log('✅ Test code accepted for qr_or_manual:', inputCode);
                isValid = true;
            }
            // 2. Проверяем ручной код (любая длина)
            else if (taskData?.manual_code && inputCode === taskData.manual_code.toUpperCase()) {
                console.log('✅ Manual code accepted:', { inputCode, expected: taskData.manual_code.toUpperCase() });
                isValid = true;
            }
            // 3. Проверяем QR-код
            else if (taskData?.qr_code && inputCode === taskData.qr_code.toUpperCase()) {
                console.log('✅ QR code accepted:', { inputCode, expected: taskData.qr_code.toUpperCase() });
                isValid = true;
            }

            // Если ни один код не подошёл - ошибка
            if (!isValid) {
                console.log('❌ Code validation failed for qr_or_manual:', {
                    inputCode,
                    inputLength: inputCode.length,
                    hasTestCode: !!taskData?.test_code,
                    hasQrCode: !!taskData?.qr_code,
                    hasManualCode: !!taskData?.manual_code
                });
                return res.json({ error: "Неверный код. Попробуй ещё раз." });
            }
        }

        // УДАЛЯЕМ дублирующий блок ниже
        if (false && verificationType === "qr_or_manual" && verificationData) {
            // Этот блок больше не нужен, логика выше
            const inputCode = verificationData.toUpperCase().trim();
            const taskData = task.verification_data;

            // Проверяем тестовый код
            if (taskData?.test_code && inputCode === taskData.test_code.toUpperCase()) {
                console.log('✅ Test code accepted for qr_or_manual:', inputCode);
            }
            // Проверяем основной код (main_code)
            else if (taskData?.main_code && inputCode === taskData.main_code.toUpperCase()) {
                console.log('✅ Main code accepted for qr_or_manual:', inputCode);
            }
            else {
                console.log('🔍 QR/Manual code check:', {
                    inputCode,
                    inputLength: inputCode.length,
                    taskData,
                    manualCodeUpper: taskData?.manual_code?.toUpperCase(),
                    qrCodeUpper: taskData?.qr_code?.toUpperCase(),
                    mainCodeUpper: taskData?.main_code?.toUpperCase()
                });

                if (!taskData || (!taskData.qr_code && !taskData.manual_code && !taskData.main_code)) {
                    return res.json({ error: "Задание не настроено" });
                }

                let isValid = false;

                // Если введен короткий код (5 символов) - это ручной код
                if (inputCode.length === 5 && taskData.manual_code) {
                    isValid = (inputCode === taskData.manual_code.toUpperCase());
                    console.log('✅ Manual code check:', { inputCode, expected: taskData.manual_code.toUpperCase(), isValid });
                }
                // Если длинный код - это QR-код
                else if (taskData.qr_code) {
                    isValid = (inputCode === taskData.qr_code.toUpperCase());
                    console.log('✅ QR code check:', { inputCode, expected: taskData.qr_code.toUpperCase(), isValid });
                }

                if (!isValid) {
                    console.log('❌ Code validation failed');
                    return res.json({ error: "Неверный код. Попробуй ещё раз." });
                }
            }
        }

        // Проверка кода от сотрудника
        if (task.verification_type === "code" && verificationData) {
            const codeResult = await pool.query(
                "SELECT * FROM staff_codes WHERE LOWER(code) = LOWER($1) AND (task_day = $2 OR task_day IS NULL) AND used_count < usage_limit",
                [verificationData, taskDay]
            );
            if (codeResult.rows.length === 0) return res.json({ error: "Неверный код. Попробуйте ещё раз." });
            await pool.query("UPDATE staff_codes SET used_count = used_count + 1 WHERE id = $1", [codeResult.rows[0].id]);
        }

        // Обработка реферала (Подарить купон другу)
        if (verificationType === "referral_form" && verificationData) {
            try {
                const data = JSON.parse(verificationData);
                await pool.query(
                    "INSERT INTO referrals (user_id, friend_name, friend_phone) VALUES ($1, $2, $3)",
                    [user.id, data.friendName, data.friendPhone]
                );
            } catch (e) {
                return res.json({ error: "Ошибка сохранения данных" });
            }
        }

        // Обработка квиза (Пройди тест)
        if (verificationType === "quiz" && verificationData) {
            try {
                const data = JSON.parse(verificationData);
                // Сохраняем результат квиза в user_tasks
                // score можно сохранить в JSON поле, если нужно
            } catch (e) {
                return res.json({ error: "Ошибка сохранения результата" });
            }
        }

        // Засчитываем задание
        await pool.query(
            `INSERT INTO user_tasks (user_id, task_id, status, completed_at, verified_by)
             VALUES ($1, $2, 'completed', now(), $3)
             ON CONFLICT (user_id, task_id) DO UPDATE SET status = 'completed', completed_at = now()`,
            [user.id, task.id, verificationType]
        );

        // Начисляем спортики
        await pool.query(
            "UPDATE users SET coins = coins + $1, xp = xp + $1, last_activity_at = now() WHERE id = $2",
            [task.coins_reward, user.id]
        );

        const updatedUser = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);
        res.json({ success: true, coins: updatedUser.rows[0].coins, reward: task.coins_reward });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get("/api/shop", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM shop_items WHERE is_active = true ORDER BY price");
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/purchase", async (req, res) => {
    try {
        const { telegramId, itemId } = req.body;
        const userResult = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
        if (userResult.rows.length === 0) return res.json({ error: "User not found" });
        const user = userResult.rows[0];

        const itemResult = await pool.query("SELECT * FROM shop_items WHERE id = $1", [itemId]);
        if (itemResult.rows.length === 0) return res.json({ error: "Item not found" });
        const item = itemResult.rows[0];

        if (user.coins < item.price) return res.json({ error: "Not enough coins" });

        await pool.query("UPDATE users SET coins = coins - $1 WHERE id = $2", [item.price, user.id]);
        await pool.query("INSERT INTO purchases (user_id, item_id, price_paid) VALUES ($1, $2, $3)", [user.id, item.id, item.price]);

        const updated = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);
        res.json({ success: true, coins: updated.rows[0].coins });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get("/api/leaderboard", async (req, res) => {
    try {
        const result = await pool.query("SELECT telegram_id, first_name, coins, xp FROM users ORDER BY xp DESC LIMIT 20");
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Survey endpoint (task 1 - questionnaire)
app.post("/api/survey", async (req, res) => {
    try {
        const { telegramId, taskDay, answers } = req.body;

        const userResult = await pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
        if (userResult.rows.length === 0) return res.json({ error: "User not found" });
        const user = userResult.rows[0];

        const taskResult = await pool.query("SELECT * FROM tasks WHERE day_number = $1", [taskDay]);
        if (taskResult.rows.length === 0) return res.json({ error: "Task not found" });
        const task = taskResult.rows[0];

        // Check if already completed
        const existing = await pool.query(
            "SELECT * FROM user_tasks WHERE user_id = $1 AND task_id = $2 AND status = 'completed'",
            [user.id, task.id]
        );
        if (existing.rows.length > 0) {
            return res.json({ error: "Task already completed" });
        }

        // Save survey answers as JSON in verification_data
        await pool.query(
            `INSERT INTO user_tasks (user_id, task_id, status, completed_at, verified_by)
             VALUES ($1, $2, 'completed', now(), 'survey')
             ON CONFLICT (user_id, task_id) DO UPDATE SET status = 'completed', completed_at = now()`,
            [user.id, task.id]
        );

        // Save answers to user record (full_name, birth_date, goals, has_kids)
        await pool.query(
            `UPDATE users SET
                survey_data = $1,
                last_activity_at = now()
             WHERE id = $2`,
            [JSON.stringify(answers), user.id]
        );

        // Award coins
        await pool.query(
            "UPDATE users SET coins = coins + $1, xp = xp + $1, last_activity_at = now() WHERE id = $2",
            [task.coins_reward, user.id]
        );

        const updatedUser = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);
        res.json({ success: true, coins: updatedUser.rows[0].coins, reward: task.coins_reward });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Registration endpoint - save user registration data
app.post("/api/register", async (req, res) => {
    try {
        const { telegramId, fullName, phone, membership, lastName, username } = req.body;

        console.log("📝 Registration request:", { telegramId, fullName, phone, membership, lastName, username });

        // Create or update user with registration data
        const result = await pool.query(
            `INSERT INTO users (telegram_id, first_name, last_name, username, phone, membership_type, coins, xp, last_activity_at, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, 0, 0, now(), now())
             ON CONFLICT (telegram_id) DO UPDATE SET
             first_name = $2, last_name = $3, username = $4, phone = $5, membership_type = $6, last_activity_at = now()
             RETURNING *`,
            [telegramId, fullName, lastName || "", username || "", phone, membership]
        );

        console.log("✅ Registration saved:", result.rows[0]);
        res.json({ success: true, user: result.rows[0] });
    } catch (e) {
        console.error("❌ Registration error:", e);
        res.status(500).json({ error: e.message });
    }
});

// ==================== ADMIN API ENDPOINTS ====================

// Логин для админки
app.post("/admin/api/login", async (req, res) => {
    try {
        const { password } = req.body;
        const account = ACCOUNTS[password];
        if (account) {
            res.json({
                success: true,
                token: password,
                role: account.role,
                name: account.name
            });
        } else {
            res.status(401).json({ error: "Invalid password" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Статистика для дашборда
app.get("/admin/api/stats", checkAdminAuth, async (req, res) => {
    try {
        const totalUsers = await pool.query("SELECT COUNT(*) FROM users");
        const activeUsers = await pool.query("SELECT COUNT(*) FROM users WHERE last_activity_at > NOW() - INTERVAL '7 days'");
        const totalTasks = await pool.query("SELECT COUNT(*) FROM tasks");
        const completedTasks = await pool.query("SELECT COUNT(*) FROM user_tasks WHERE status = 'completed'");
        const totalPrizes = await pool.query("SELECT COUNT(*) FROM shop_items WHERE is_active = true");
        const totalPurchases = await pool.query("SELECT COUNT(*) FROM purchases");
        const totalCoinsSpent = await pool.query("SELECT COALESCE(SUM(price_paid), 0) as total FROM purchases");

        res.json({
            users: {
                total: parseInt(totalUsers.rows[0].count),
                active: parseInt(activeUsers.rows[0].count)
            },
            tasks: {
                total: parseInt(totalTasks.rows[0].count),
                completed: parseInt(completedTasks.rows[0].count)
            },
            prizes: {
                total: parseInt(totalPrizes.rows[0].count),
                purchased: parseInt(totalPurchases.rows[0].count),
                coinsSpent: parseInt(totalCoinsSpent.rows[0].total)
            }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Статистика для графиков
app.get("/admin/api/stats/charts", checkAdminAuth, async (req, res) => {
    try {
        // Регистрации по дням (последние 7 дней)
        const registrationsByDay = await pool.query(`
            SELECT
                DATE(created_at) as date,
                COUNT(*) as count
            FROM users
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `);

        // Выполнения заданий по дням (последние 7 дней)
        const taskCompletionsByDay = await pool.query(`
            SELECT
                DATE(completed_at) as date,
                COUNT(*) as count
            FROM user_tasks
            WHERE completed_at > NOW() - INTERVAL '7 days' AND status = 'completed'
            GROUP BY DATE(completed_at)
            ORDER BY date
        `);

        // Топ-5 самых популярных заданий
        const topTasks = await pool.query(`
            SELECT
                t.title,
                t.day_number,
                COUNT(ut.id) as completions
            FROM tasks t
            LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.status = 'completed'
            GROUP BY t.id, t.title, t.day_number
            ORDER BY completions DESC
            LIMIT 5
        `);

        res.json({
            registrationsByDay: registrationsByDay.rows,
            taskCompletionsByDay: taskCompletionsByDay.rows,
            topTasks: topTasks.rows
        });
    } catch (e) {
        console.error("❌ Failed to get chart stats:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Список пользователей
app.get("/admin/api/users", checkAdminAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id, telegram_id, first_name, last_name, username,
                phone, membership_type,
                coins, xp, level, last_activity_at, created_at,
                survey_data,
                (SELECT COUNT(*) FROM user_tasks WHERE user_id = users.id AND status = 'completed') as completed_tasks
            FROM users
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Детали пользователя
app.get("/admin/api/users/:id", checkAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userResult = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const user = userResult.rows[0];

        // Получаем выполненные задания
        const tasksResult = await pool.query(`
            SELECT t.*, ut.status, ut.completed_at, ut.verified_by
            FROM user_tasks ut
            JOIN tasks t ON t.id = ut.task_id
            WHERE ut.user_id = $1
            ORDER BY ut.completed_at DESC
        `, [id]);

        // Получаем покупки
        const purchasesResult = await pool.query(`
            SELECT p.*, si.title, si.price
            FROM purchases p
            JOIN shop_items si ON si.id = p.item_id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `, [id]);

        res.json({
            user,
            tasks: tasksResult.rows,
            purchases: purchasesResult.rows
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Обновить монеты и XP пользователя (для админки) - только для админа
app.post("/admin/api/users/:id/update", checkAdminAuth, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { coins, xp, reason } = req.body;

        console.log(`📝 Admin update user ${id}:`, { coins, xp, reason });

        // Проверяем что пользователь существует
        const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Обновляем монеты и XP
        const updateResult = await pool.query(
            `UPDATE users
             SET coins = coins + $1, xp = xp + $2, last_activity_at = now()
             WHERE id = $3
             RETURNING *`,
            [coins || 0, xp || 0, id]
        );

        console.log(`✅ User ${id} updated:`, {
            newCoins: updateResult.rows[0].coins,
            newXP: updateResult.rows[0].xp
        });

        res.json({ success: true, user: updateResult.rows[0] });
    } catch (e) {
        console.error("❌ Failed to update user:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Удалить пользователя - только для админа
app.delete("/admin/api/users/:id", checkAdminAuth, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`🗑️ Admin ${req.userName || req.userRole} deleting user ${id}`);

        // Проверяем существование пользователя
        const checkUser = await pool.query("SELECT id, telegram_id, first_name FROM users WHERE id = $1", [id]);
        if (checkUser.rows.length === 0) {
            console.log(`❌ User ${id} not found`);
            return res.status(404).json({ error: "User not found" });
        }

        const userData = checkUser.rows[0];
        console.log(`📋 Deleting user: ${userData.first_name} (TG: ${userData.telegram_id})`);

        // Удаляем все связанные данные (каскадное удаление)
        // 1. Удаляем задания пользователя
        const tasksResult = await pool.query("DELETE FROM user_tasks WHERE user_id = $1", [id]);
        console.log(`  ✓ Deleted ${tasksResult.rowCount} user tasks`);

        // 2. Удаляем покупки пользователя
        const purchasesResult = await pool.query("DELETE FROM purchases WHERE user_id = $1", [id]);
        console.log(`  ✓ Deleted ${purchasesResult.rowCount} purchases`);

        // 3. Удаляем рефералов (если есть таблица referrals)
        try {
            const referralsResult = await pool.query("DELETE FROM referrals WHERE user_id = $1", [id]);
            console.log(`  ✓ Deleted ${referralsResult.rowCount} referral records`);
        } catch (e) {
            console.log(`  ⚠️ Error deleting referrals: ${e.message}`);
        }

        // 4. Удаляем самого пользователя
        const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING telegram_id", [id]);

        console.log(`✅ User ${id} (${userData.first_name}, telegram_id: ${result.rows[0].telegram_id}) deleted successfully`);
        res.json({ success: true });
    } catch (e) {
        console.error("❌ Failed to delete user:", e);
        console.error("Error details:", {
            message: e.message,
            code: e.code,
            detail: e.detail,
            constraint: e.constraint
        });
        res.status(500).json({
            error: e.message,
            detail: e.detail || "Database error",
            code: e.code
        });
    }
});

// Задания пользователя
app.get("/admin/api/users/:id/tasks", checkAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT
                ut.*,
                t.title as task_title,
                t.day_number,
                t.coins_reward
            FROM user_tasks ut
            JOIN tasks t ON t.id = ut.task_id
            WHERE ut.user_id = $1 AND ut.status = 'completed'
            ORDER BY ut.completed_at DESC
        `, [id]);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Покупки пользователя
app.get("/admin/api/users/:id/purchases", checkAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT
                p.*,
                si.title as item_title
            FROM purchases p
            JOIN shop_items si ON si.id = p.item_id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `, [id]);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Список заданий
app.get("/admin/api/tasks", checkAdminAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                t.*,
                (SELECT COUNT(*) FROM user_tasks WHERE task_id = t.id AND status = 'completed') as completion_count
            FROM tasks t
            ORDER BY t.day_number
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Обновление задания - только для админа
app.put("/admin/api/tasks/:id", checkAdminAuth, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, coins_reward, verification_type, verification_data } = req.body;

        await pool.query(`
            UPDATE tasks SET
                title = $1,
                description = $2,
                coins_reward = $3,
                verification_type = $4,
                verification_data = $5
            WHERE id = $6
        `, [title, description, coins_reward, verification_type, verification_data, id]);

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Список призов
app.get("/admin/api/prizes", checkAdminAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                si.*,
                (SELECT COUNT(*) FROM purchases WHERE item_id = si.id) as purchase_count
            FROM shop_items si
            ORDER BY si.price
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Обновление приза - только для админа
app.put("/admin/api/prizes/:id", checkAdminAuth, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, icon, is_active } = req.body;

        await pool.query(`
            UPDATE shop_items SET
                title = $1,
                description = $2,
                price = $3,
                icon = $4,
                is_active = $5
            WHERE id = $6
        `, [title, description, price, icon, is_active, id]);

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Список покупок
app.get("/admin/api/purchases", checkAdminAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                p.*,
                u.first_name, u.last_name, u.telegram_id,
                si.title as item_title
            FROM purchases p
            JOIN users u ON u.id = p.user_id
            JOIN shop_items si ON si.id = p.item_id
            ORDER BY p.purchased_at DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin: Get all referrals
app.get("/admin/api/referrals", checkAdminAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                r.*,
                u.first_name, u.last_name, u.telegram_id, u.phone
            FROM referrals r
            JOIN users u ON u.id = r.user_id
            ORDER BY r.created_at DESC
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get("/", (req, res) => res.send("Bot is running"));

app.listen(3000, () => console.log("Server running on port 3000"));
