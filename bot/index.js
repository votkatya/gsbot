require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const { Bot, webhookCallback } = require("grammy");
const express = require("express");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const crypto = require("crypto");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://gsbot18.ru";

if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN is not set in environment variables");
    process.exit(1);
}

const pool = new Pool({
    user: process.env.DB_USER || "gsadmin",
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "gorodsporta"
});

const bot = new Bot(BOT_TOKEN);

// Генератор уникального кода выдачи (GS-XXXXXX)
function generateRedemptionCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(6);
    let code = 'GS-';
    for (let i = 0; i < 6; i++) {
        code += chars[bytes[i] % chars.length];
    }
    return code;
}

// Хелпер: найти пользователя по telegram_id или vk_id
async function getUserByPlatformId(telegramId, vkId) {
    if (telegramId) {
        return pool.query("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
    } else if (vkId) {
        return pool.query("SELECT * FROM users WHERE vk_id = $1", [vkId]);
    }
    return { rows: [] };
}

// Папка для хранения скриншотов отзывов
const UPLOADS_DIR = process.env.UPLOADS_DIR || "/var/www/gorodsporta/uploads/reviews";
try {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
} catch (e) {
    console.log("⚠️ Could not create uploads dir (ok in dev):", e.message);
}

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

    console.log("📱 /start command from:", tgUser.id, tgUser.first_name, "param:", param);

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

});



const app = express();

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json({ limit: "20mb" }));

// Раздача загруженных фото как статику
app.use("/uploads", express.static(process.env.UPLOADS_DIR ? path.dirname(process.env.UPLOADS_DIR) : "/var/www/gorodsporta/uploads"));

// Простая авторизация для админки с ролями
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const STAFF_PASSWORD = process.env.STAFF_PASSWORD;

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

// Получить пользователя по VK ID
app.get("/api/user/vk/:vkId", async (req, res) => {
    try {
        const { vkId } = req.params;
        const userResult = await pool.query("SELECT * FROM users WHERE vk_id = $1", [vkId]);
        if (userResult.rows.length === 0) return res.json({ error: "User not found" });

        const user = userResult.rows[0];
        const tasksResult = await pool.query(
            `SELECT t.*, ut.status, ut.completed_at
             FROM tasks t
             LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $1
             ORDER BY t.day_number`, [user.id]
        );

        const reviewResult = await pool.query(
            `SELECT task_id FROM review_submissions WHERE user_id = $1 AND status = 'pending'`,
            [user.id]
        );
        const pendingReviewTaskIds = reviewResult.rows.map(r => r.task_id);

        const tasks = tasksResult.rows.map(t => ({
            ...t,
            reviewPending: pendingReviewTaskIds.includes(t.id)
        }));

        res.json({ user, tasks });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Получить пользователя по Telegram ID
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

        // Получаем pending заявки на отзывы для этого пользователя
        const reviewResult = await pool.query(
            `SELECT task_id FROM review_submissions WHERE user_id = $1 AND status = 'pending'`,
            [user.id]
        );
        const pendingReviewTaskIds = reviewResult.rows.map(r => r.task_id);

        // Добавляем reviewPending к заданиям
        const tasks = tasksResult.rows.map(t => ({
            ...t,
            reviewPending: pendingReviewTaskIds.includes(t.id)
        }));

        res.json({ user, tasks });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/complete-task", async (req, res) => {
    try {
        const { telegramId, vkId, taskDay, verificationType, verificationData } = req.body;

        console.log('📥 Complete task request:', {
            telegramId,
            vkId,
            taskDay,
            verificationType,
            verificationData: verificationData?.substring?.(0, 50) || verificationData
        });

        const userResult = await getUserByPlatformId(telegramId, vkId);
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
            const inputCode = verificationData.toUpperCase().trim();
            let isValid = false;

            console.log('🔍 qr check:', {
                inputCode,
                test_code: taskData?.test_code,
                manual_code: taskData?.manual_code,
                qr_code: taskData?.qr_code
            });

            // 1. Тестовый код
            if (taskData?.test_code && inputCode === taskData.test_code.toUpperCase()) {
                console.log('✅ Test code accepted for QR task:', inputCode);
                isValid = true;
            }
            // 2. Ручной код
            else if (taskData?.manual_code && inputCode === taskData.manual_code.toUpperCase()) {
                console.log('✅ Manual code accepted for QR task:', inputCode);
                isValid = true;
            }
            // 3. QR-код
            else if (taskData?.qr_code && inputCode === taskData.qr_code.toUpperCase()) {
                console.log('✅ QR code accepted:', inputCode);
                isValid = true;
            }

            if (!isValid) {
                console.log('❌ qr validation failed for:', inputCode);
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


        // Проверка кода от сотрудника
        if (task.verification_type === "code" && verificationData) {
            const codeResult = await pool.query(
                "SELECT * FROM staff_codes WHERE LOWER(code) = LOWER($1) AND (task_day = $2 OR task_day IS NULL) AND used_count < usage_limit",
                [verificationData, taskDay]
            );
            if (codeResult.rows.length === 0) return res.json({ error: "Неверный код. Попробуйте ещё раз." });
            await pool.query("UPDATE staff_codes SET used_count = used_count + 1 WHERE id = $1", [codeResult.rows[0].id]);
        }

        // Задания с ручной проверкой скриншота нельзя засчитать через этот эндпоинт
        if (task.verification_type === "review") {
            return res.status(400).json({ error: "Это задание проверяется вручную. Отправьте скриншот боту." });
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
        const { telegramId, vkId, itemId } = req.body;
        console.log(`🛒 Purchase request: telegramId=${telegramId}, vkId=${vkId}, itemId=${itemId}`);
        const userResult = await getUserByPlatformId(telegramId, vkId);
        if (userResult.rows.length === 0) {
            console.log(`❌ Purchase failed: user not found`);
            return res.json({ error: "User not found" });
        }
        const user = userResult.rows[0];

        const itemResult = await pool.query("SELECT * FROM shop_items WHERE id = $1", [itemId]);
        if (itemResult.rows.length === 0) {
            console.log(`❌ Purchase failed: item ${itemId} not found`);
            return res.json({ error: "Item not found" });
        }
        const item = itemResult.rows[0];

        if (user.coins < item.price) {
            console.log(`❌ Purchase failed: not enough coins (has ${user.coins}, needs ${item.price})`);
            return res.json({ error: "Not enough coins" });
        }

        const redemptionCode = generateRedemptionCode();
        await pool.query("UPDATE users SET coins = coins - $1 WHERE id = $2", [item.price, user.id]);
        await pool.query(
            "INSERT INTO purchases (user_id, item_id, price_paid, redemption_code, is_redeemed) VALUES ($1, $2, $3, $4, false)",
            [user.id, item.id, item.price, redemptionCode]
        );

        const updated = await pool.query("SELECT * FROM users WHERE id = $1", [user.id]);
        console.log(`✅ Purchase success: user=${user.id}, item="${item.title}", code=${redemptionCode}`);
        res.json({ success: true, coins: updated.rows[0].coins, redemptionCode });
    } catch (e) {
        console.log(`❌ Purchase error: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

app.get("/api/my-purchases", async (req, res) => {
    try {
        const { telegramId, vkId } = req.query;
        console.log(`📋 My purchases request: telegramId=${telegramId}, vkId=${vkId}`);
        const userResult = await getUserByPlatformId(
            telegramId ? Number(telegramId) : null,
            vkId ? Number(vkId) : null
        );
        if (userResult.rows.length === 0) {
            console.log(`📋 My purchases: user not found`);
            return res.json([]);
        }
        const user = userResult.rows[0];

        const result = await pool.query(`
            SELECT si.title, p.price_paid, p.purchased_at, p.redemption_code, p.is_redeemed
            FROM purchases p
            JOIN shop_items si ON si.id = p.item_id
            WHERE p.user_id = $1
            ORDER BY p.purchased_at DESC
        `, [user.id]);
        console.log(`📋 My purchases: user=${user.id}, found ${result.rows.length} purchases`);
        res.json(result.rows);
    } catch (e) {
        console.log(`📋 My purchases error: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

app.get("/api/leaderboard", async (req, res) => {
    try {
        const result = await pool.query("SELECT telegram_id, vk_id, first_name, coins, xp FROM users ORDER BY xp DESC LIMIT 20");
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Survey endpoint (task 1 - questionnaire)
app.post("/api/survey", async (req, res) => {
    try {
        const { telegramId, vkId, taskDay, answers } = req.body;

        const userResult = await getUserByPlatformId(telegramId, vkId);
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

// Registration endpoint - save user registration data (TG and VK)
app.post("/api/register", async (req, res) => {
    try {
        const { telegramId, vkId, fullName, phone, membership, lastName, username } = req.body;

        console.log("📝 Registration request:", { telegramId, vkId, fullName, phone, membership });

        // Кросс-платформенная привязка: проверяем, есть ли уже аккаунт с таким телефоном
        const existingByPhone = await pool.query("SELECT * FROM users WHERE phone = $1", [phone]);
        if (existingByPhone.rows.length > 0) {
            const existing = existingByPhone.rows[0];

            // Привязываем новую платформу к существующему аккаунту
            if (telegramId && !existing.telegram_id) {
                await pool.query(
                    "UPDATE users SET telegram_id=$1, first_name=$2, last_name=$3, username=$4, membership_type=$5, last_activity_at=now() WHERE id=$6",
                    [telegramId, fullName, lastName || "", username || "", membership, existing.id]
                );
                console.log("🔗 Linked TG to existing VK user:", existing.id);
            } else if (vkId && !existing.vk_id) {
                await pool.query(
                    "UPDATE users SET vk_id=$1, first_name=$2, last_name=$3, username=$4, membership_type=$5, last_activity_at=now() WHERE id=$6",
                    [vkId, fullName, lastName || "", username || "", membership, existing.id]
                );
                console.log("🔗 Linked VK to existing TG user:", existing.id);
            }

            const updated = await pool.query("SELECT * FROM users WHERE id = $1", [existing.id]);
            return res.json({ success: true, user: updated.rows[0] });
        }

        // Новый пользователь — создаём по платформенному ID
        if (telegramId) {
            const result = await pool.query(
                `INSERT INTO users (telegram_id, first_name, last_name, username, phone, membership_type, coins, xp, last_activity_at, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, 0, 0, now(), now())
                 ON CONFLICT (telegram_id) DO UPDATE SET
                 first_name=$2, last_name=$3, username=$4, phone=$5, membership_type=$6, last_activity_at=now()
                 RETURNING *`,
                [telegramId, fullName, lastName || "", username || "", phone, membership]
            );
            console.log("✅ TG registration saved:", result.rows[0].id);
            return res.json({ success: true, user: result.rows[0] });
        }

        if (vkId) {
            const result = await pool.query(
                `INSERT INTO users (vk_id, first_name, last_name, username, phone, membership_type, coins, xp, last_activity_at, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, 0, 0, now(), now())
                 ON CONFLICT (vk_id) DO UPDATE SET
                 first_name=$2, last_name=$3, username=$4, phone=$5, membership_type=$6, last_activity_at=now()
                 RETURNING *`,
                [vkId, fullName, lastName || "", username || "", phone, membership]
            );
            console.log("✅ VK registration saved:", result.rows[0].id);
            return res.json({ success: true, user: result.rows[0] });
        }

        return res.status(400).json({ error: "telegramId или vkId обязателен" });
    } catch (e) {
        console.error("❌ Registration error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Check if phone number exists in DB (for 2-stage registration)
app.post("/api/check-phone", async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.json({ exists: false });

        // Normalize: keep only digits, take last 10 (strip country code)
        const digits = phone.replace(/\D/g, "");
        const normalized = digits.slice(-10);

        if (normalized.length < 10) return res.json({ exists: false });

        // Match any stored format by comparing digits
        const result = await pool.query(
            `SELECT id FROM users WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE $1`,
            [`%${normalized}`]
        );

        console.log(`📱 Check phone: ${phone} → digits ${normalized} → exists: ${result.rows.length > 0}`);
        return res.json({ exists: result.rows.length > 0 });
    } catch (e) {
        console.error("❌ Check phone error:", e);
        res.status(500).json({ exists: false });
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

        // Получаем ВСЕ задания с их статусом для данного пользователя
        const tasksResult = await pool.query(`
            SELECT
                t.id as task_id,
                t.day_number,
                t.title as task_title,
                t.coins_reward,
                t.verification_type,
                ut.id as user_task_id,
                ut.status,
                ut.completed_at,
                ut.verified_by
            FROM tasks t
            LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $1
            ORDER BY t.day_number ASC
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

// Переключить статус задания пользователя (выполнено ↔ не выполнено) — только для админа
app.post("/admin/api/users/:id/toggle-task", checkAdminAuth, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;           // user id
        const { taskId, action } = req.body;  // action: 'complete' | 'uncomplete'

        console.log(`🔄 Admin toggle task: user=${id}, taskId=${taskId}, action=${action}`);

        // Проверяем пользователя
        const userCheck = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (userCheck.rows.length === 0) return res.status(404).json({ error: "User not found" });
        const user = userCheck.rows[0];

        // Проверяем задание
        const taskCheck = await pool.query("SELECT * FROM tasks WHERE id = $1", [taskId]);
        if (taskCheck.rows.length === 0) return res.status(404).json({ error: "Task not found" });
        const task = taskCheck.rows[0];

        if (action === 'complete') {
            // Проверяем, не выполнено ли уже
            const existing = await pool.query(
                "SELECT * FROM user_tasks WHERE user_id = $1 AND task_id = $2 AND status = 'completed'",
                [id, taskId]
            );
            if (existing.rows.length > 0) {
                return res.json({ error: "Задание уже выполнено" });
            }

            // Засчитываем задание
            await pool.query(`
                INSERT INTO user_tasks (user_id, task_id, status, completed_at, verified_by)
                VALUES ($1, $2, 'completed', now(), 'admin')
                ON CONFLICT (user_id, task_id) DO UPDATE SET status = 'completed', completed_at = now(), verified_by = 'admin'
            `, [id, taskId]);

            // Начисляем монеты и XP
            await pool.query(
                "UPDATE users SET coins = coins + $1, xp = xp + $1, last_activity_at = now() WHERE id = $2",
                [task.coins_reward, id]
            );

            console.log(`✅ Task ${taskId} marked complete for user ${id}, +${task.coins_reward} coins`);
            res.json({ success: true, action: 'completed', coins_change: +task.coins_reward });

        } else if (action === 'uncomplete') {
            // Проверяем, было ли задание выполнено
            const existing = await pool.query(
                "SELECT * FROM user_tasks WHERE user_id = $1 AND task_id = $2 AND status = 'completed'",
                [id, taskId]
            );
            if (existing.rows.length === 0) {
                return res.json({ error: "Задание не было выполнено" });
            }

            // Удаляем запись о выполнении
            await pool.query(
                "DELETE FROM user_tasks WHERE user_id = $1 AND task_id = $2",
                [id, taskId]
            );

            // Списываем монеты и XP (не уходим в минус)
            await pool.query(
                "UPDATE users SET coins = GREATEST(0, coins - $1), xp = GREATEST(0, xp - $1), last_activity_at = now() WHERE id = $2",
                [task.coins_reward, id]
            );

            console.log(`↩️ Task ${taskId} unmarked for user ${id}, -${task.coins_reward} coins`);
            res.json({ success: true, action: 'uncompleted', coins_change: -task.coins_reward });

        } else {
            res.status(400).json({ error: "Invalid action. Use 'complete' or 'uncomplete'" });
        }
    } catch (e) {
        console.error("❌ Failed to toggle task:", e.message);
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
                p.id, p.price_paid, p.purchased_at, p.redemption_code, p.is_redeemed, p.redeemed_at,
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

// Выдать приз (пометить покупку как выданную)
app.post("/admin/api/purchases/:id/redeem", checkAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "UPDATE purchases SET is_redeemed = true, redeemed_at = NOW() WHERE id = $1 AND is_redeemed = false RETURNING *",
            [id]
        );
        if (result.rowCount === 0) return res.json({ error: "Already redeemed or not found" });
        res.json({ success: true });
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

// ==================== REVIEW SUBMISSIONS API ====================

// Multer — сохраняем загруженные фото в /uploads/reviews/
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, UPLOADS_DIR),
        filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`)
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new Error("Only images allowed"));
    }
});

// Загрузка скриншота отзыва из мини-приложения (base64 JSON — работает в Telegram Mobile)
app.post("/api/upload-review", async (req, res) => {
    try {
        const { telegramId, vkId, taskId, photo } = req.body;
        if (!photo) return res.status(400).json({ error: "No photo provided" });

        const userResult = await getUserByPlatformId(telegramId, vkId);
        if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
        const user = userResult.rows[0];

        const taskResult = await pool.query("SELECT * FROM tasks WHERE day_number = $1", [taskId]);
        if (taskResult.rows.length === 0) return res.status(404).json({ error: "Task not found" });
        const task = taskResult.rows[0];

        // Проверяем, не подавал ли уже заявку
        const existing = await pool.query(
            "SELECT * FROM review_submissions WHERE user_id = $1 AND task_id = $2 AND status IN ('pending', 'approved') ORDER BY submitted_at DESC LIMIT 1",
            [user.id, task.id]
        );
        if (existing.rows.length > 0) return res.json({ error: "Заявка уже подана" });

        // Декодируем base64 и сохраняем файл
        const matches = photo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches) return res.status(400).json({ error: "Invalid photo format" });

        const mimeType = matches[1];
        const base64Data = matches[2];
        const ext = mimeType.includes("png") ? "png" : mimeType.includes("gif") ? "gif" : mimeType.includes("webp") ? "webp" : "jpg";
        const filename = `${Date.now()}_review.${ext}`;
        const filepath = path.join(UPLOADS_DIR, filename);

        fs.writeFileSync(filepath, Buffer.from(base64Data, "base64"));

        const publicUrl = `/uploads/reviews/${filename}`;

        await pool.query(`
            INSERT INTO review_submissions (user_id, task_id, photo_file_id, photo_url, status)
            VALUES ($1, $2, $3, $4, 'pending')
        `, [user.id, task.id, filename, publicUrl]);

        console.log(`📸 Review screenshot uploaded by telegramId=${telegramId}, task=${taskId}, file=${filename}`);

        res.json({ success: true });
    } catch (e) {
        console.error("❌ Error uploading review:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Список заявок на проверку (для админки)
app.get("/admin/api/reviews", checkAdminAuth, async (req, res) => {
    try {
        const { status } = req.query; // pending | approved | rejected | all
        const statusFilter = status && status !== 'all' ? `WHERE rs.status = '${status}'` : "WHERE rs.status = 'pending'";

        const result = await pool.query(`
            SELECT
                rs.id,
                rs.user_id,
                rs.task_id,
                rs.photo_file_id,
                rs.photo_url,
                rs.status,
                rs.admin_comment,
                rs.submitted_at,
                rs.reviewed_at,
                rs.reviewed_by,
                u.first_name,
                u.last_name,
                u.telegram_id,
                t.title as task_title,
                t.coins_reward,
                t.day_number
            FROM review_submissions rs
            JOIN users u ON u.id = rs.user_id
            JOIN tasks t ON t.id = rs.task_id
            ${statusFilter}
            ORDER BY rs.submitted_at ASC
        `);
        res.json(result.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Одобрить отзыв — только для админа
app.post("/admin/api/reviews/:id/approve", checkAdminAuth, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;

        // Получаем заявку
        const subResult = await pool.query("SELECT * FROM review_submissions WHERE id = $1", [id]);
        if (subResult.rows.length === 0) return res.status(404).json({ error: "Submission not found" });
        const sub = subResult.rows[0];

        if (sub.status !== 'pending') {
            return res.json({ error: "Заявка уже обработана" });
        }

        // Получаем задание для суммы монет
        const taskResult = await pool.query("SELECT * FROM tasks WHERE id = $1", [sub.task_id]);
        if (taskResult.rows.length === 0) return res.status(404).json({ error: "Task not found" });
        const task = taskResult.rows[0];

        // Проверяем, не выполнено ли уже задание
        const existingTask = await pool.query(
            "SELECT * FROM user_tasks WHERE user_id = $1 AND task_id = $2 AND status = 'completed'",
            [sub.user_id, sub.task_id]
        );

        if (existingTask.rows.length === 0) {
            // Засчитываем задание
            await pool.query(`
                INSERT INTO user_tasks (user_id, task_id, status, completed_at, verified_by)
                VALUES ($1, $2, 'completed', now(), 'review')
                ON CONFLICT (user_id, task_id) DO UPDATE SET status = 'completed', completed_at = now()
            `, [sub.user_id, sub.task_id]);

            // Начисляем монеты
            await pool.query(
                "UPDATE users SET coins = coins + $1, xp = xp + $1, last_activity_at = now() WHERE id = $2",
                [task.coins_reward, sub.user_id]
            );

            console.log(`✅ Review approved: user ${sub.user_id} gets ${task.coins_reward} coins for task ${sub.task_id}`);
        }

        // Обновляем статус заявки
        await pool.query(`
            UPDATE review_submissions
            SET status = 'approved', reviewed_at = now(), reviewed_by = $1
            WHERE id = $2
        `, [req.userName || req.userRole, id]);

        // Уведомляем пользователя в Telegram
        try {
            const userResult = await pool.query("SELECT telegram_id FROM users WHERE id = $1", [sub.user_id]);
            if (userResult.rows.length > 0) {
                await bot.api.sendMessage(
                    userResult.rows[0].telegram_id,
                    `🎉 Ваш отзыв одобрен!\n\nНачислено ${task.coins_reward} 🪙 спорткоинов. Спасибо!`
                );
            }
        } catch (e) {
            console.log("⚠️ Could not send Telegram notification:", e.message);
        }

        res.json({ success: true });
    } catch (e) {
        console.error("❌ Failed to approve review:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Отклонить отзыв — только для админа
app.post("/admin/api/reviews/:id/reject", checkAdminAuth, checkAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { comment } = req.body;

        const subResult = await pool.query("SELECT * FROM review_submissions WHERE id = $1", [id]);
        if (subResult.rows.length === 0) return res.status(404).json({ error: "Submission not found" });
        const sub = subResult.rows[0];

        if (sub.status !== 'pending') {
            return res.json({ error: "Заявка уже обработана" });
        }

        await pool.query(`
            UPDATE review_submissions
            SET status = 'rejected', admin_comment = $1, reviewed_at = now(), reviewed_by = $2
            WHERE id = $3
        `, [comment || '', req.userName || req.userRole, id]);

        console.log(`❌ Review rejected: submission ${id}, comment: ${comment}`);

        // Уведомляем пользователя в Telegram
        try {
            const userResult = await pool.query("SELECT telegram_id FROM users WHERE id = $1", [sub.user_id]);
            if (userResult.rows.length > 0) {
                const reason = comment ? `\n\nПричина: ${comment}` : '';
                await bot.api.sendMessage(
                    userResult.rows[0].telegram_id,
                    `❌ Ваш отзыв не принят.${reason}\n\nПожалуйста, пришлите новый скриншот.`
                );
            }
        } catch (e) {
            console.log("⚠️ Could not send Telegram notification:", e.message);
        }

        res.json({ success: true });
    } catch (e) {
        console.error("❌ Failed to reject review:", e.message);
        res.status(500).json({ error: e.message });
    }
});

// Счётчик pending заявок (для бейджа в меню)
app.get("/admin/api/reviews/count", checkAdminAuth, async (req, res) => {
    try {
        const result = await pool.query("SELECT COUNT(*) FROM review_submissions WHERE status = 'pending'");
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get("/", (req, res) => res.send("Bot is running"));

// Webhook endpoint — Telegram отправляет сюда все обновления
app.use("/bot", webhookCallback(bot, "express"));

app.listen(3000, () => console.log("Server running on port 3000"));
