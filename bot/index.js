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
            if (taskData && taskData.qr_code && taskData.qr_code !== verificationData) {
                return res.json({ error: "Invalid QR code" });
            }
        }

        // Проверка кода от сотрудника
        if (task.verification_type === "code" && verificationData) {
            const codeResult = await pool.query(
                "SELECT * FROM staff_codes WHERE code = $1 AND (task_day = $2 OR task_day IS NULL) AND used_count < usage_limit",
                [verificationData, taskDay]
            );
            if (codeResult.rows.length === 0) return res.json({ error: "Invalid code" });
            await pool.query("UPDATE staff_codes SET used_count = used_count + 1 WHERE id = $1", [codeResult.rows[0].id]);
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
        const result = await pool.query("SELECT telegram_id, first_name, coins, xp FROM users ORDER BY coins DESC LIMIT 20");
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

app.get("/", (req, res) => res.send("Bot is running"));

app.listen(3000, () => console.log("Server running on port 3000"));
