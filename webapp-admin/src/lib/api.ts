const API_BASE = 'https://gsbot18.ru';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('admin_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('admin_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('admin_token');
  }

  private async request(url: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/admin/';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(password: string) {
    const data = await this.request('/admin/api/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (data.success) {
      this.setToken(data.token);
    }
    return data;
  }

  // Stats
  async getStats() {
    return this.request('/admin/api/stats');
  }

  async getChartStats() {
    return this.request('/admin/api/stats/charts');
  }

  // Users
  async getUsers() {
    return this.request('/admin/api/users');
  }

  async getUser(id: string) {
    return this.request(`/admin/api/users/${id}`);
  }

  async updateUser(id: number, data: { coins?: number; xp?: number; reason?: string }) {
    return this.request(`/admin/api/users/${id}/update`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserTasks(userId: string) {
    return this.request(`/admin/api/users/${userId}/tasks`);
  }

  async getUserPurchases(userId: string) {
    return this.request(`/admin/api/users/${userId}/purchases`);
  }

  async deleteUser(userId: string) {
    return this.request(`/admin/api/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Tasks
  async getTasks() {
    return this.request('/admin/api/tasks');
  }

  async updateTask(id: number, data: any) {
    return this.request(`/admin/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Prizes
  async getPrizes() {
    return this.request('/admin/api/prizes');
  }

  async updatePrize(id: number, data: any) {
    return this.request(`/admin/api/prizes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Purchases
  async getPurchases() {
    return this.request('/admin/api/purchases');
  }

  // Referrals
  async getReferrals() {
    return this.request('/admin/api/referrals');
  }
}

export const api = new ApiClient();
