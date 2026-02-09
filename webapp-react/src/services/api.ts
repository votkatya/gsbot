const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://gsbot18.ru";

// --- Types matching the Timeweb DB response shapes ---

export interface ApiUser {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  coins: number;
  xp: number;
  last_activity_at: string | null;
}

export interface ApiTask {
  id: number;
  day_number: number;
  title: string;
  description: string;
  coins_reward: number;
  verification_type: string; // 'qr' | 'code' | 'self'
  verification_data: { qr_code?: string } | null;
  status: string | null; // 'completed' or null (from LEFT JOIN)
  completed_at: string | null;
}

export interface ApiShopItem {
  id: number;
  name?: string;
  title?: string;
  description: string | null;
  price: number;
  icon?: string;
  color?: string;
  category?: string;
  image_url?: string | null;
  is_active: boolean;
}

export interface ApiLeaderboardEntry {
  telegram_id: number;
  first_name: string;
  coins: number;
  xp: number;
}

export interface CompleteTaskResponse {
  success?: boolean;
  coins?: number;
  reward?: number;
  error?: string;
}

export interface PurchaseResponse {
  success?: boolean;
  coins?: number;
  error?: string;
}

// --- API Functions ---

export async function fetchUser(
  telegramId: number
): Promise<{ user: ApiUser; tasks: ApiTask[] } | null> {
  const res = await fetch(`${API_BASE}/api/user/${telegramId}`);
  const data = await res.json();
  if (data.error) return null;
  return data;
}

export async function completeTask(
  telegramId: number,
  taskDay: number,
  verificationType: string,
  verificationData?: string
): Promise<CompleteTaskResponse> {
  const res = await fetch(`${API_BASE}/api/complete-task`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId,
      taskDay,
      verificationType,
      verificationData,
    }),
  });
  return res.json();
}

export async function fetchShop(): Promise<ApiShopItem[]> {
  const res = await fetch(`${API_BASE}/api/shop`);
  return res.json();
}

export async function purchaseItem(
  telegramId: number,
  itemId: number
): Promise<PurchaseResponse> {
  const res = await fetch(`${API_BASE}/api/purchase`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId, itemId }),
  });
  return res.json();
}

export async function fetchLeaderboard(): Promise<ApiLeaderboardEntry[]> {
  const res = await fetch(`${API_BASE}/api/leaderboard`);
  return res.json();
}
