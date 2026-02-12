# 🎯 План создания админ-панели "Город Спорта"

> Детальное руководство по разработке React админки для управления проектом

**Дата создания:** 13 февраля 2026
**Версия:** 1.0
**Статус:** В разработке

---

## 📋 Содержание

1. [Общая архитектура](#общая-архитектура)
2. [Backend API](#backend-api)
3. [Frontend структура](#frontend-структура)
4. [Компоненты и страницы](#компоненты-и-страницы)
5. [Пошаговая реализация](#пошаговая-реализация)
6. [Деплой](#деплой)

---

## 🏗️ Общая архитектура

### Схема работы:

```
┌─────────────────────────────────────────────────────────┐
│                    ПОЛЬЗОВАТЕЛИ                          │
├──────────────────────┬──────────────────────────────────┤
│  Mini App            │  Админ панель                    │
│  (Telegram)          │  (Браузер)                       │
└──────────┬───────────┴──────────┬───────────────────────┘
           │                      │
           ▼                      ▼
    ┌──────────────────────────────────────┐
    │     Backend API (bot/index.js)       │
    │  ┌────────────┬─────────────────┐    │
    │  │ /api/*     │ /admin/api/*    │    │
    │  │ (Mini App) │ (Админка)       │    │
    │  └────────────┴─────────────────┘    │
    └──────────────────┬───────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │   PostgreSQL     │
            │   gorodsporta    │
            └──────────────────┘
```

### Структура файлов:

```
/var/www/gorodsporta/
├── bot/                           # Backend API
│   ├── index.js                  # Главный файл (добавим admin API)
│   └── package.json
│
├── webapp-react/                  # Mini App (основное приложение)
│   └── ...
│
├── webapp-admin/                  # ✨ НОВАЯ АДМИНКА
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx     # Главная - статистика
│   │   │   ├── Users.tsx         # Список пользователей
│   │   │   ├── Tasks.tsx         # Управление заданиями
│   │   │   ├── Prizes.tsx        # Управление призами
│   │   │   └── Login.tsx         # Авторизация
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Sidebar.tsx   # Боковое меню
│   │   │   │   └── Header.tsx    # Шапка
│   │   │   ├── Stats/
│   │   │   │   └── StatsCard.tsx # Карточка статистики
│   │   │   └── Tables/
│   │   │       ├── UserTable.tsx
│   │   │       ├── TaskTable.tsx
│   │   │       └── PrizeTable.tsx
│   │   ├── services/
│   │   │   └── adminApi.ts       # API клиент
│   │   ├── hooks/
│   │   │   └── useAuth.ts        # Авторизация
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── dist/                      # Билд → deploy-admin/
│
└── deploy-admin/                   # Production админки
    ├── index.html
    └── assets/
```

---

## 🔌 Backend API

### Добавить в `bot/index.js`:

#### 1. Простая авторизация

```javascript
// В начале файла после imports
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "gsadmin2025";

// Middleware для проверки авторизации
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Basic ${Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64')}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}

// Эндпоинт логина
app.post("/admin/api/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const token = Buffer.from(`${username}:${password}`).toString('base64');
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: "Неверный логин или пароль" });
    }
});
```

#### 2. Статистика

```javascript
// Общая статистика
app.get("/admin/api/stats", requireAuth, async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE last_activity_at > NOW() - INTERVAL '7 days') as active_users,
                (SELECT COUNT(*) FROM user_tasks WHERE status = 'completed') as completed_tasks,
                (SELECT COUNT(*) FROM purchases) as total_purchases,
                (SELECT COALESCE(SUM(coins), 0) FROM users) as total_coins,
                (SELECT COALESCE(SUM(xp), 0) FROM users) as total_xp
        `);

        // Статистика по заданиям
        const taskStats = await pool.query(`
            SELECT
                t.day_number,
                t.title,
                COUNT(ut.id) as completed_count
            FROM tasks t
            LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.status = 'completed'
            GROUP BY t.id, t.day_number, t.title
            ORDER BY t.day_number
        `);

        res.json({
            overview: stats.rows[0],
            tasks: taskStats.rows
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
```

#### 3. Управление пользователями

```javascript
// Список всех пользователей
app.get("/admin/api/users", requireAuth, async (req, res) => {
    try {
        const { search, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT
                id,
                telegram_id,
                first_name,
                last_name,
                username,
                coins,
                xp,
                last_activity_at,
                created_at,
                (SELECT COUNT(*) FROM user_tasks WHERE user_id = users.id AND status = 'completed') as completed_tasks_count
            FROM users
        `;

        const params = [];
        if (search) {
            query += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR username ILIKE $1`;
            params.push(`%${search}%`);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const users = await pool.query(query, params);
        const countResult = await pool.query("SELECT COUNT(*) FROM users");

        res.json({
            users: users.rows,
            total: parseInt(countResult.rows[0].count)
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Детали пользователя
app.get("/admin/api/users/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const tasks = await pool.query(`
            SELECT t.*, ut.status, ut.completed_at
            FROM tasks t
            LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.user_id = $1
            ORDER BY t.day_number
        `, [id]);

        const purchases = await pool.query(`
            SELECT p.*, si.title, si.price
            FROM purchases p
            JOIN shop_items si ON si.id = p.item_id
            WHERE p.user_id = $1
            ORDER BY p.created_at DESC
        `, [id]);

        res.json({
            user: user.rows[0],
            tasks: tasks.rows,
            purchases: purchases.rows
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Начислить/списать спортики
app.post("/admin/api/users/:id/coins", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, reason } = req.body; // amount может быть + или -

        await pool.query(
            "UPDATE users SET coins = coins + $1, xp = xp + $1 WHERE id = $2",
            [amount, id]
        );

        const updated = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

        res.json({ success: true, user: updated.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
```

#### 4. Управление заданиями

```javascript
// Список заданий
app.get("/admin/api/tasks", requireAuth, async (req, res) => {
    try {
        const tasks = await pool.query(`
            SELECT
                t.*,
                COUNT(ut.id) as completed_count
            FROM tasks t
            LEFT JOIN user_tasks ut ON ut.task_id = t.id AND ut.status = 'completed'
            GROUP BY t.id
            ORDER BY t.day_number
        `);

        res.json(tasks.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Обновить задание
app.put("/admin/api/tasks/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, coins_reward, verification_type } = req.body;

        await pool.query(
            `UPDATE tasks
             SET title = $1, description = $2, coins_reward = $3, verification_type = $4
             WHERE id = $5`,
            [title, description, coins_reward, verification_type, id]
        );

        const updated = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
        res.json({ success: true, task: updated.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
```

#### 5. Управление призами

```javascript
// Список призов
app.get("/admin/api/prizes", requireAuth, async (req, res) => {
    try {
        const prizes = await pool.query(`
            SELECT
                si.*,
                COUNT(p.id) as purchase_count
            FROM shop_items si
            LEFT JOIN purchases p ON p.item_id = si.id
            GROUP BY si.id
            ORDER BY si.price
        `);

        res.json(prizes.rows);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Обновить приз
app.put("/admin/api/prizes/:id", requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, is_active } = req.body;

        await pool.query(
            `UPDATE shop_items
             SET title = $1, description = $2, price = $3, is_active = $4
             WHERE id = $5`,
            [title, description, price, is_active, id]
        );

        const updated = await pool.query("SELECT * FROM shop_items WHERE id = $1", [id]);
        res.json({ success: true, prize: updated.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Добавить новый приз
app.post("/admin/api/prizes", requireAuth, async (req, res) => {
    try {
        const { title, description, price, icon } = req.body;

        const result = await pool.query(
            `INSERT INTO shop_items (title, description, price, icon, is_active)
             VALUES ($1, $2, $3, $4, true)
             RETURNING *`,
            [title, description, price, icon || 'Gift']
        );

        res.json({ success: true, prize: result.rows[0] });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
```

---

## ⚛️ Frontend структура

### 1. Создание проекта

```bash
# Из корня проекта
cd /Users/user/Downloads/Claude\ GS/

# Создать новый Vite проект
npm create vite@latest webapp-admin -- --template react-ts

cd webapp-admin

# Установить зависимости
npm install

# Установить дополнительные библиотеки
npm install @tanstack/react-query axios react-router-dom
npm install -D @types/react-router-dom

# Установить shadcn/ui (переиспользуем компоненты)
npx shadcn@latest init
npx shadcn@latest add button card input table dialog
```

### 2. Конфигурация

**`vite.config.ts`:**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/admin/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

**`.env`:**

```env
VITE_API_BASE_URL=https://gsbot18.ru
```

### 3. API Service

**`src/services/adminApi.ts`:**

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/admin/api`,
});

// Добавляем токен к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Basic ${token}`;
  }
  return config;
});

export const adminApi = {
  // Авторизация
  login: async (username: string, password: string) => {
    const response = await api.post('/login', { username, password });
    return response.data;
  },

  // Статистика
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },

  // Пользователи
  getUsers: async (params?: { search?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUserCoins: async (id: number, amount: number, reason: string) => {
    const response = await api.post(`/users/${id}/coins`, { amount, reason });
    return response.data;
  },

  // Задания
  getTasks: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },

  updateTask: async (id: number, data: any) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  // Призы
  getPrizes: async () => {
    const response = await api.get('/prizes');
    return response.data;
  },

  updatePrize: async (id: number, data: any) => {
    const response = await api.put(`/prizes/${id}`, data);
    return response.data;
  },

  createPrize: async (data: any) => {
    const response = await api.post('/prizes', data);
    return response.data;
  },
};
```

---

## 🎨 Компоненты и страницы

### 1. Layout с Sidebar

**`src/components/Layout/Sidebar.tsx`:**

```tsx
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Gift,
  LogOut
} from 'lucide-react';

export const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/', icon: LayoutDashboard, label: 'Статистика' },
    { path: '/admin/users', icon: Users, label: 'Пользователи' },
    { path: '/admin/tasks', icon: CheckSquare, label: 'Задания' },
    { path: '/admin/prizes', icon: Gift, label: 'Призы' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login';
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">Город Спорта</h1>
        <p className="text-sm text-muted-foreground">Админ панель</p>
      </div>

      <nav className="flex-1 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg w-full hover:bg-destructive/10 text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Выйти</span>
        </button>
      </div>
    </aside>
  );
};
```

### 2. Dashboard (Главная страница)

**`src/pages/Dashboard.tsx`:**

```tsx
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, Gift, TrendingUp } from 'lucide-react';

export const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: adminApi.getStats,
  });

  if (isLoading) return <div>Загрузка...</div>;

  const statCards = [
    {
      title: 'Всего пользователей',
      value: stats?.overview?.total_users || 0,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Активных за неделю',
      value: stats?.overview?.active_users || 0,
      icon: TrendingUp,
      color: 'text-green-500',
    },
    {
      title: 'Выполнено заданий',
      value: stats?.overview?.completed_tasks || 0,
      icon: CheckSquare,
      color: 'text-purple-500',
    },
    {
      title: 'Куплено призов',
      value: stats?.overview?.total_purchases || 0,
      icon: Gift,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Статистика</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Статистика по заданиям</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.tasks?.map((task: any) => (
              <div key={task.day_number} className="flex items-center justify-between py-2 border-b">
                <div>
                  <span className="font-medium">День {task.day_number}</span>
                  <span className="text-muted-foreground ml-2">{task.title}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Выполнено: <span className="font-bold text-foreground">{task.completed_count}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 3. Страница пользователей

**`src/pages/Users.tsx`:**

```tsx
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '@/services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search } from 'lucide-react';

export const Users = () => {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => adminApi.getUsers({ search, limit: 100 }),
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Пользователи</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Всего: {data?.total || 0}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Загрузка...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Спортики</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Заданий</TableHead>
                  <TableHead>Дата регистрации</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.telegram_id}</TableCell>
                    <TableCell>{user.first_name} {user.last_name}</TableCell>
                    <TableCell>@{user.username || '-'}</TableCell>
                    <TableCell>{user.coins} 🪙</TableCell>
                    <TableCell>{user.xp} XP</TableCell>
                    <TableCell>{user.completed_tasks_count}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
```

### 4. Страница заданий

**`src/pages/Tasks.tsx`:**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { adminApi } from '@/services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

export const Tasks = () => {
  const queryClient = useQueryClient();
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: adminApi.getTasks,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => adminApi.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingTask(null);
      toast.success('Задание обновлено');
    },
  });

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      coins_reward: task.coins_reward,
      verification_type: task.verification_type,
    });
  };

  const handleSave = () => {
    updateMutation.mutate({ id: editingTask.id, data: formData });
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Задания</h1>

      <div className="space-y-4">
        {isLoading ? (
          <div>Загрузка...</div>
        ) : (
          tasks?.map((task: any) => (
            <Card key={task.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>День {task.day_number}: {task.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Выполнено: {task.completed_count} раз
                  </p>
                </div>
                <Button size="sm" onClick={() => handleEdit(task)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">{task.description}</p>
                <div className="flex gap-4 text-sm">
                  <span>Награда: {task.coins_reward} 🪙</span>
                  <span>Тип: {task.verification_type}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Диалог редактирования */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать задание</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Название</label>
              <Input
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Описание</label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Награда (спортики)</label>
              <Input
                type="number"
                value={formData.coins_reward || 0}
                onChange={(e) => setFormData({ ...formData, coins_reward: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
```

### 5. Страница авторизации

**`src/pages/Login.tsx`:**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await adminApi.login(username, password);
      localStorage.setItem('admin_token', result.token);
      navigate('/admin/');
    } catch (error) {
      toast.error('Неверный логин или пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Вход в админку</CardTitle>
          <p className="text-sm text-muted-foreground">Город Спорта</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Логин</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Пароль</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
```

### 6. App.tsx с роутингом

**`src/App.tsx`:**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from '@/components/Layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Users } from '@/pages/Users';
import { Tasks } from '@/pages/Tasks';
import { Prizes } from '@/pages/Prizes';
import { Login } from '@/pages/Login';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('admin_token');
  if (!token) return <Navigate to="/admin/login" />;
  return <>{children}</>;
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex">
    <Sidebar />
    <main className="flex-1 overflow-auto">{children}</main>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/login" element={<Login />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/prizes" element={<Prizes />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/admin/" />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
```

---

## 🚀 Пошаговая реализация

### Шаг 1: Подготовка backend

1. Открыть `bot/index.js`
2. Добавить все API эндпоинты из раздела "Backend API"
3. Добавить переменные окружения в `.env`:
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=gsadmin2025
   ```
4. Перезапустить backend:
   ```bash
   pm2 restart gorodsporta-bot
   ```

### Шаг 2: Создание проекта админки

```bash
cd /Users/user/Downloads/Claude\ GS/

npm create vite@latest webapp-admin -- --template react-ts
cd webapp-admin
npm install
npm install @tanstack/react-query axios react-router-dom sonner
npm install -D @types/react-router-dom

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input table dialog
```

### Шаг 3: Копирование компонентов

Скопировать компоненты из `webapp-react`:
```bash
cp -r ../webapp-react/src/components/ui ./src/components/
cp ../webapp-react/src/lib/utils.ts ./src/lib/
cp ../webapp-react/tailwind.config.ts ./
cp ../webapp-react/components.json ./
```

### Шаг 4: Создание файлов

Создать все файлы из раздела "Компоненты и страницы":
- `src/services/adminApi.ts`
- `src/components/Layout/Sidebar.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Users.tsx`
- `src/pages/Tasks.tsx`
- `src/pages/Prizes.tsx` (аналогично Tasks.tsx)
- `src/pages/Login.tsx`
- `src/App.tsx`

### Шаг 5: Тестирование локально

```bash
npm run dev
```

Открыть http://localhost:5174/admin/

Логин: `admin`
Пароль: `gsadmin2025`

### Шаг 6: Сборка для production

```bash
npm run build
```

---

## 📦 Деплой

### 1. Подготовка

```bash
# Локально
cd webapp-admin
npm run build

# Создать папку для админки
mkdir -p ../deploy-admin

# Скопировать собранные файлы
cp -r dist/* ../deploy-admin/
```

### 2. Обновление Nginx

Добавить в `/etc/nginx/sites-available/gorodsporta`:

```nginx
# Admin panel - static files
location /admin {
    alias /var/www/gorodsporta/deploy-admin;
    index index.html;
    try_files $uri $uri/ /admin/index.html;
}

# Admin API - proxy to backend
location /admin/api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 3. Git workflow

```bash
# Закоммитить админку
git add webapp-admin/ deploy-admin/
git commit -m "feat: добавить React админ-панель"
git push origin main

# На сервере
cd /var/www/gorodsporta
git pull origin main

# Перезапустить backend (если добавили новые API)
pm2 restart gorodsporta-bot

# Перезагрузить nginx
systemctl reload nginx
```

### 4. Проверка

Открыть: https://gsbot18.ru/admin/

---

## 📝 Чеклист реализации

### Backend
- [ ] Добавить API эндпоинты в `bot/index.js`
- [ ] Настроить авторизацию
- [ ] Добавить переменные окружения
- [ ] Протестировать API через Postman/curl
- [ ] Перезапустить PM2

### Frontend
- [ ] Создать проект webapp-admin
- [ ] Установить зависимости
- [ ] Настроить vite.config.ts
- [ ] Создать API service
- [ ] Создать компоненты Layout
- [ ] Создать страницы
- [ ] Настроить роутинг
- [ ] Протестировать локально

### Деплой
- [ ] Собрать production билд
- [ ] Создать папку deploy-admin
- [ ] Обновить Nginx конфигурацию
- [ ] Закоммитить в Git
- [ ] Задеплоить на сервер
- [ ] Протестировать на production

---

## 🎯 Следующие шаги

После базовой реализации можно добавить:

1. **Графики и аналитика**
   - Recharts для графиков
   - График регистраций по дням
   - График выполнения заданий

2. **Активация призов**
   - Страница для сканирования/ввода кодов
   - История активаций

3. **Расширенная статистика**
   - Когорты пользователей
   - Retention
   - Воронка прохождения заданий

4. **Уведомления**
   - Отправка push-уведомлений пользователям
   - Массовые рассылки

5. **Экспорт данных**
   - Выгрузка в CSV/Excel
   - Отчеты

---

## 📞 Полезные ссылки

- **React Router:** https://reactrouter.com/
- **TanStack Query:** https://tanstack.com/query/latest
- **shadcn/ui:** https://ui.shadcn.com/
- **Recharts:** https://recharts.org/

---

**Документ создан для разработки админ-панели "Город Спорта"**
*При вопросах - обращайся к Claude или команде разработки* 💪
