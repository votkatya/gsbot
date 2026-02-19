import { mockApi } from "./mockApi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://gsbot18.ru";
const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API !== "false";
const API_TIMEOUT = 10000; // 10 seconds timeout

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - server is not responding');
    }
    throw error;
  }
}

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
  reviewPending?: boolean; // true если скриншот отправлен и ждёт проверки
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
  if (USE_MOCK) {
    return mockApi.fetchUser(telegramId);
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/user/${telegramId}`);
    if (!res.ok) {
      console.error(`API error: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    if (data.error) return null;
    return data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
}

export async function completeTask(
  telegramId: number,
  taskDay: number,
  verificationType: string,
  verificationData?: string
): Promise<CompleteTaskResponse> {
  if (USE_MOCK) {
    return mockApi.completeTask(telegramId, taskDay, verificationType, verificationData);
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/complete-task`, {
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
  } catch (error) {
    console.error('Failed to complete task:', error);
    return { error: 'Network error. Please try again.' };
  }
}

export async function fetchShop(): Promise<ApiShopItem[]> {
  if (USE_MOCK) {
    return mockApi.fetchShop();
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/shop`);
    return res.json();
  } catch (error) {
    console.error('Failed to fetch shop:', error);
    return [];
  }
}

export async function purchaseItem(
  telegramId: number,
  itemId: number
): Promise<PurchaseResponse> {
  if (USE_MOCK) {
    return mockApi.purchaseItem(telegramId, itemId);
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId, itemId }),
    });
    return res.json();
  } catch (error) {
    console.error('Failed to purchase item:', error);
    return { error: 'Network error. Please try again.' };
  }
}

export async function fetchLeaderboard(): Promise<ApiLeaderboardEntry[]> {
  if (USE_MOCK) {
    return mockApi.fetchLeaderboard();
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/leaderboard`);
    return res.json();
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return [];
  }
}

export async function submitSurvey(
  telegramId: number,
  taskDay: number,
  answers: Record<string, string | string[]>
): Promise<CompleteTaskResponse> {
  if (USE_MOCK) {
    return mockApi.submitSurvey(telegramId, taskDay, answers);
  }
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/survey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId, taskDay, answers }),
    });
    return res.json();
  } catch (error) {
    console.error('Failed to submit survey:', error);
    return { error: 'Network error. Please try again.' };
  }
}

export async function submitRegistration(
  telegramId: number,
  fullName: string,
  phone: string,
  membership: string,
  lastName?: string,
  username?: string
): Promise<{ success?: boolean; error?: string; user?: ApiUser }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId, fullName, phone, membership, lastName, username }),
    });
    return res.json();
  } catch (error) {
    console.error('Failed to submit registration:', error);
    return { error: 'Network error. Please try again.' };
  }
}
