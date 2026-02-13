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

bot.command("start", async (ctx) => {
    const tgUser = ctx.from;
    const param = ctx.match || "";

    // Создаем или обновляем пользователя
    await pool.query(
        `INSERT INTO users (telegram_id, first_name, last_name, username)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (telegram_id) DO UPDATE SET
         first_name = $2, last_name = $3, username = $4`,
        [tgUser.id, tgUser.first_name, tgUser.last_name || null, tgUser.username || null]
    );

    if (param.startsWith("qr_")) {
        await ctx.reply("QR-код найден! Открой приложение:", {
            reply_markup: {
                inline_keyboard: [[
                    { text: "Получить награду", web_app: { url: WEBAPP_URL + "?tgWebAppStartParam=" + param } }
                ]]
            }
        });
    } else {
        await ctx.reply("Привет, " + tgUser.first_name + "! Добро пожаловать в Город Спорта!", {
            reply_markup: {
                inline_keyboard: [[
                    { text: "Начать", web_app: { url: WEBAPP_URL } }
                ]]
            }
        });
    }
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

// Простая авторизация для админки
const ADMIN_PASSWORD = "GorodSporta2025Admin!"; // TODO: изменить в продакшене

// Middleware для проверки админского доступа
function checkAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.substring(7);
    if (token !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid credentials' });
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
            if (taskData && taskData.qr_code && taskData.qr_code.toLowerCase() !== verificationData.toLowerCase()) {
                return res.json({ error: "Неверный код. Попробуйте ещё раз." });
            }
        }

        // Проверка кода из приложения (задание 2)
        if (verificationType === "app_code") {
            const validCodes = ["testgs"]; // TODO: заменить на реальные коды
            if (!validCodes.includes(verificationData?.toLowerCase())) {
                return res.json({ error: "Неверный код. Попробуй ещё раз." });
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

// ==================== ADMIN API ENDPOINTS ====================

// Логин для админки
app.post("/admin/api/login", async (req, res) => {
    try {
        const { password } = req.body;
        if (password === ADMIN_PASSWORD) {
            res.json({ success: true, token: ADMIN_PASSWORD });
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

// Список пользователей
app.get("/admin/api/users", checkAdminAuth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id, telegram_id, first_name, last_name, username,
                coins, xp, last_activity_at, created_at,
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
            ORDER BY p.purchased_at DESC
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

// Обновление задания
app.put("/admin/api/tasks/:id", checkAdminAuth, async (req, res) => {
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

// Обновление приза
app.put("/admin/api/prizes/:id", checkAdminAuth, async (req, res) => {
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

app.get("/", (req, res) => res.send("Bot is running"));

app.listen(3000, () => console.log("Server running on port 3000"));
