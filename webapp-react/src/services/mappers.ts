import type { ApiTask, ApiShopItem, ApiLeaderboardEntry } from "./api";

// --- Task UI metadata lookup (by day_number) ---
// Maps day_number to UI-only fields that are NOT in the Timeweb DB

interface TaskUIMetadata {
  stage: number;
  subtitle: string;
  zone: string;
  iconName: string;
}

const TASK_UI: Record<number, TaskUIMetadata> = {
  // Блок 1: Разминка
  1: { stage: 1, subtitle: "Познакомимся?", zone: "Профиль", iconName: "User" },
  2: { stage: 1, subtitle: "Будь в курсе!", zone: "Онлайн", iconName: "Smartphone" },
  3: { stage: 1, subtitle: "Давай дружить!", zone: "Соцсети", iconName: "Send" },
  // Блок 2: Охота в клубе
  4: { stage: 2, subtitle: "Пройди Таниту", zone: "Тренажерный зал", iconName: "Dumbbell" },
  5: { stage: 2, subtitle: "Вводная тренировка", zone: "Тренажерный зал", iconName: "Activity" },
  6: { stage: 2, subtitle: "Полежать в джакузи", zone: "SPA", iconName: "Sun" },
  7: { stage: 2, subtitle: "Посети коммерческий класс", zone: "Групповые", iconName: "Users" },
  8: { stage: 2, subtitle: "Вводная тренировка в бассейне", zone: "Бассейн", iconName: "Waves" },
  9: { stage: 2, subtitle: "Посети мероприятие", zone: "Клуб", iconName: "Star" },
  10: { stage: 2, subtitle: "Посети коммерческий класс", zone: "Групповые", iconName: "Users" },
  // Блок 3: Заминка
  11: { stage: 3, subtitle: "Поделись впечатлением!", zone: "Онлайн", iconName: "MessageSquare" },
  12: { stage: 3, subtitle: "Расскажи о нас!", zone: "Онлайн", iconName: "Send" },
  13: { stage: 3, subtitle: "Подарить купон другу", zone: "Рефералка", iconName: "Users" },
  14: { stage: 3, subtitle: "Пройди тест", zone: "Онлайн", iconName: "Trophy" },
};

const DEFAULT_TASK_UI: TaskUIMetadata = {
  stage: 1,
  subtitle: "",
  zone: "Клуб",
  iconName: "Star",
};

// --- The Task interface matching existing React components ---
export interface Task {
  id: number;
  dayNumber: number;
  stage: number;
  title: string;
  subtitle: string;
  description: string;
  reward: number; // XP
  rewardCoins: number;
  zone: string;
  completed: boolean;
  locked: boolean;
  iconName: string;
  verificationType: string;
  verificationData: { qr_code?: string } | null;
}

export function mapApiTasks(apiTasks: ApiTask[]): Task[] {
  // Count stage 1+2 completions for lock logic
  const completedStage12Count = apiTasks.filter((t) => {
    const ui = TASK_UI[t.day_number] || DEFAULT_TASK_UI;
    return t.status === "completed" && (ui.stage === 1 || ui.stage === 2);
  }).length;

  return apiTasks.map((apiTask) => {
    const ui = TASK_UI[apiTask.day_number] || DEFAULT_TASK_UI;
    const isCompleted = apiTask.status === "completed";

    // Stage 3 tasks locked until at least 6 stage 1+2 tasks are done
    let isLocked = false;
    if (ui.stage === 3 && !isCompleted) {
      isLocked = completedStage12Count < 6;
    }

    return {
      id: apiTask.day_number,
      dayNumber: apiTask.day_number,
      stage: ui.stage,
      title: apiTask.title,
      subtitle: ui.subtitle,
      description: apiTask.description || "",
      reward: apiTask.coins_reward,
      rewardCoins: apiTask.coins_reward,
      zone: ui.zone,
      completed: isCompleted,
      locked: isLocked,
      iconName: ui.iconName,
      verificationType: apiTask.verification_type,
      verificationData: apiTask.verification_data,
    };
  });
}

// --- Shop items ---

export interface ShopItemView {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: string;
  iconName: string;
  imageUrl: string | null;
}

const SHOP_ICON_FALLBACK: Record<string, string> = {
  коктейль: "Coffee",
  протеин: "Coffee",
  тренировка: "Dumbbell",
  массаж: "Sun",
  сумка: "ShoppingBag",
  солярий: "Sun",
  бутылочк: "Droplet",
  бутылк: "Droplet",
  футболка: "Shirt",
  визит: "Ticket",
  занятие: "Dumbbell",
  абонемент: "Ticket",
};

function guessIconFromTitle(title: string): string {
  const lower = title.toLowerCase();
  for (const [keyword, icon] of Object.entries(SHOP_ICON_FALLBACK)) {
    if (lower.includes(keyword)) return icon;
  }
  return "ShoppingBag";
}

export function mapApiShopItem(item: ApiShopItem): ShopItemView {
  const title = item.title || item.name || "Товар";
  return {
    id: String(item.id),
    title,
    description: item.description || "",
    price: item.price,
    stock: "99", // Timeweb schema has no stock field
    iconName: guessIconFromTitle(title),
    imageUrl: item.image_url || null,
  };
}

// --- Leaderboard ---

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  streak: number;
  reward?: number;
  medal?: "gold" | "silver" | "bronze";
  isMe?: boolean;
}

export function mapLeaderboard(
  entries: ApiLeaderboardEntry[],
  currentTelegramId: number
): LeaderboardEntry[] {
  return entries.map((entry, index) => {
    const rank = index + 1;
    return {
      rank,
      name: entry.first_name || "Аноним",
      points: entry.coins,
      streak: 0, // Timeweb DB has no streak field
      medal:
        rank === 1
          ? ("gold" as const)
          : rank === 2
            ? ("silver" as const)
            : rank === 3
              ? ("bronze" as const)
              : undefined,
      isMe: entry.telegram_id === currentTelegramId,
    };
  });
}
