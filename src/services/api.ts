// API service for connecting to backend
import { 
  SECURITY_CONFIG, 
  sanitizeForLogging, 
  handleApiError, 
  validateApiResponse 
} from '../config/security';

export interface Bounty {
  id: number;
  title: string;
  description: string;
  reward: number;
  status: 'available' | 'full' | 'expired';
  claims_left: number;
  max_claims: number;
  expires_at: string | null;
  created_at: string;
  time_left: number | null;
  posted_hours_ago: number;
  claims_count?: number;
}

export interface BountyClaim {
  id: number;
  bounty: number;
  bounty_title: string;
  bounty_reward: number;
  user: number;
  user_username: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submission: string;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
}

class ApiService {
  private baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  constructor() {
    if (!this.baseURL) {
      // Silent failure for production - don't expose configuration errors to users
      if (import.meta.env.DEV) {
        console.warn('API base URL not configured. Using default.');
      }
      this.baseURL = 'http://localhost:8000';
    }
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const jwtToken = localStorage.getItem(SECURITY_CONFIG.TOKEN_STORAGE_KEY);

    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SECURITY_CONFIG.API_TIMEOUT);

      const response = await fetch(url, { ...defaultOptions, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response in development
      if (import.meta.env.DEV && !validateApiResponse(data)) {
        console.warn('API response validation failed');
      }

      return data;
    } catch (error) {
      handleApiError(error, `request to ${endpoint}`);
      throw error;
    }
  }

  // Bounty endpoints
  async getBounties(status?: string): Promise<{ count: number; results: Bounty[] }> {
    const params = status ? `?status=${status}` : '';
    return this.request(`/bounties${params}`);
  }

  async getBounty(id: number): Promise<Bounty> {
    return this.request(`/bounties/${id}/`);
  }

  async createBounty(data: Partial<Bounty>): Promise<Bounty> {
    return this.request('/bounties/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateBounty(id: number, data: Partial<Bounty>): Promise<Bounty> {
    return this.request(`/bounties/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteBounty(id: number): Promise<void> {
    await this.request(`/bounties/${id}/`, {
      method: 'DELETE'
    });
  }

  async claimBounty(bountyId: number): Promise<BountyClaim> {
    return this.request(`/bounties/${bountyId}/claim/`, {
      method: 'POST'
    });
  }

  async submitBounty(bountyId: number, submission: string): Promise<BountyClaim> {
    return this.request(`/bounties/${bountyId}/submit/`, {
      method: 'POST',
      body: JSON.stringify({ submission })
    });
  }

  async getUserClaims(): Promise<{ count: number; results: BountyClaim[] }> {
    return this.request('/bounties/my-claims/');
  }

  async approveBountyClaim(claimId: number): Promise<BountyClaim> {
    return this.request(`/bounties/claims/${claimId}/approve/`, {
      method: 'POST'
    });
  }

  async redeemCode(code: string): Promise<{ message: string; coins: number }> {
    return this.request('/bounties/redeem/', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  }

  async getRedeemCodes(): Promise<{ count: number; results: any[] }> {
    return this.request('/bounties/redeem-codes/');
  }

  async createRedeemCode(data: { code: string; coins: number }): Promise<any> {
    return this.request('/bounties/redeem-codes/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteRedeemCode(id: number): Promise<void> {
    await this.request(`/bounties/redeem-codes/${id}/`, {
      method: 'DELETE'
    });
  }

  async getUserBalance(): Promise<{ balance: number; user: string }> {
    return this.request('/bounties/balance/');
  }


  async adjustUserBalance(userId: number, amount: number, reason: string): Promise<any> {
    return this.request('/bounties/admin/adjust-balance/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, amount, reason })
    });
  }

  async getUserProfile(): Promise<any> {
    return this.request('/bounties/profile/');
  }

  async getUserTransactions(): Promise<any> {
    return this.request('/bounties/transactions/');
  }

  async getBountyClaimsHistory(): Promise<any> {
    return this.request('/bounties/profile/claims/');
  }

  async getRedeemCodesHistory(): Promise<any> {
    return this.request('/bounties/profile/redeem-codes/');
  }

  async getUserStatistics(): Promise<any> {
    return this.request('/bounties/profile/statistics/');
  }

  async getProfile(): Promise<any> {
    return this.request('/bounties/profile/');
  }

  async getAllUsers(): Promise<{ users: any[]; count: number }> {
    return this.request('/bounties/admin/users/');
  }

  async getAllClaims(): Promise<{ count: number; results: BountyClaim[] }> {
    return this.request('/bounties/admin/bounty-claims/');
  }
}

export const apiService = new ApiService();
