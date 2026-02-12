// Mock API для локальной разработки
import type { ApiUser, ApiTask, ApiShopItem, ApiLeaderboardEntry, CompleteTaskResponse, PurchaseResponse } from "./api";

// Mock пользователь
const mockUser: ApiUser = {
  id: 1,
  telegram_id: 123456789,
  first_name: "Тестовый",
  last_name: "Пользователь",
  username: "test_user",
  coins: 150,
  xp: 250,
  last_activity_at: new Date().toISOString(),
};

// Mock задачи
const mockTasks: ApiTask[] = [
  {
    id: 1,
    day_number: 1,
    title: "Познакомимся?",
    description: "Заполни анкету, чтобы мы могли лучше узнать тебя",
    coins_reward: 50,
    verification_type: "survey",
    verification_data: null,
    status: null,
    completed_at: null,
  },
  {
    id: 2,
    day_number: 2,
    title: "Будь в курсе",
    description: "Скачай мобильное приложение Город Спорта",
    coins_reward: 50,
    verification_type: "app_code",
    verification_data: { qr_code: "APP2025" },
    status: null,
    completed_at: null,
  },
  {
    id: 3,
    day_number: 3,
    title: "Давай дружить!",
    description: "Подпишись на наши соцсети",
    coins_reward: 30,
    verification_type: "self",
    verification_data: null,
    status: null,
    completed_at: null,
  },
  {
    id: 4,
    day_number: 4,
    title: "Пройди Таниту",
    description: "Сделай анализ состава тела на аппарате Танита",
    coins_reward: 100,
    verification_type: "qr",
    verification_data: { qr_code: "TANITA001" },
    status: null,
    completed_at: null,
  },
  {
    id: 5,
    day_number: 5,
    title: "Вводная тренировка",
    description: "Пройди вводную тренировку с инструктором",
    coins_reward: 100,
    verification_type: "qr",
    verification_data: { qr_code: "TRAIN001" },
    status: null,
    completed_at: null,
  },
];

// Mock магазин
const mockShopItems: ApiShopItem[] = [
  {
    id: 1,
    title: "Протеиновый коктейль",
    description: "Вкусный протеиновый коктейль",
    price: 100,
    icon: "Coffee",
    is_active: true,
  },
  {
    id: 2,
    title: "Персональная тренировка",
    description: "1 час с персональным тренером",
    price: 500,
    icon: "Dumbbell",
    is_active: true,
  },
  {
    id: 3,
    title: "Массаж 30 мин",
    description: "Расслабляющий массаж",
    price: 300,
    icon: "Sun",
    is_active: true,
  },
];

// Mock рейтинг
const mockLeaderboard: ApiLeaderboardEntry[] = [
  { telegram_id: 111111111, first_name: "Алексей", coins: 500, xp: 800 },
  { telegram_id: 222222222, first_name: "Мария", coins: 450, xp: 750 },
  { telegram_id: 123456789, first_name: "Тестовый", coins: 150, xp: 250 },
  { telegram_id: 333333333, first_name: "Иван", coins: 120, xp: 200 },
  { telegram_id: 444444444, first_name: "Елена", coins: 100, xp: 180 },
];

// State для хранения изменений
let userState = { ...mockUser };
let tasksState = [...mockTasks];

export const mockApi = {
  async fetchUser(telegramId: number) {
    await delay(300); // Имитация задержки сети
    return {
      user: userState,
      tasks: tasksState,
    };
  },

  async completeTask(
    telegramId: number,
    taskDay: number,
    verificationType: string,
    verificationData?: string
  ): Promise<CompleteTaskResponse> {
    await delay(300);

    const task = tasksState.find((t) => t.day_number === taskDay);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.status === "completed") {
      return { success: false, error: "Task already completed" };
    }

    // Простая валидация кода
    if (verificationType === "qr" || verificationType === "code") {
      const expectedCode = task.verification_data?.qr_code;
      if (expectedCode && verificationData !== expectedCode) {
        return { success: false, error: "Неверный код" };
      }
    }

    // Обновляем состояние
    task.status = "completed";
    task.completed_at = new Date().toISOString();
    userState.coins += task.coins_reward;
    userState.xp += task.coins_reward;

    return {
      success: true,
      coins: userState.coins,
      reward: task.coins_reward,
    };
  },

  async submitSurvey(
    telegramId: number,
    taskDay: number,
    answers: Record<string, string | string[]>
  ): Promise<CompleteTaskResponse> {
    await delay(300);

    const task = tasksState.find((t) => t.day_number === taskDay);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.status === "completed") {
      return { success: false, error: "Task already completed" };
    }

    // Обновляем состояние
    task.status = "completed";
    task.completed_at = new Date().toISOString();
    userState.coins += task.coins_reward;
    userState.xp += task.coins_reward;

    console.log("Survey answers:", answers);

    return {
      success: true,
      coins: userState.coins,
      reward: task.coins_reward,
    };
  },

  async fetchShop(): Promise<ApiShopItem[]> {
    await delay(300);
    return mockShopItems;
  },

  async purchaseItem(telegramId: number, itemId: number): Promise<PurchaseResponse> {
    await delay(300);

    const item = mockShopItems.find((i) => i.id === itemId);
    if (!item) {
      return { success: false, error: "Item not found" };
    }

    if (userState.coins < item.price) {
      return { success: false, error: "Недостаточно монет" };
    }

    userState.coins -= item.price;

    return {
      success: true,
      coins: userState.coins,
    };
  },

  async fetchLeaderboard(): Promise<ApiLeaderboardEntry[]> {
    await delay(300);
    return mockLeaderboard.sort((a, b) => b.xp - a.xp);
  },
};

// Утилита для задержки
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
