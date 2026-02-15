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

// Auction interfaces
export interface Auction {
  id: number;
  title: string;
  description: string;
  minimum_bid: number;
  current_highest_bid: number | null;
  highest_bidder: string | null;
  starts_at: string;
  ends_at: string;
  status: 'upcoming' | 'active' | 'ended' | 'cancelled';
  created_by: number;
  created_at: string;
  updated_at: string;
  bid_count: number;
  images?: string[];
  image_files?: Array<{ image?: string | null }>;
}

// Error response interface for single auction constraint
export interface AuctionError {
  error: string;
  active_auction?: {
    id: number;
    title: string;
    ends_at: string;
  };
}

export interface AuctionBid {
  id: number;
  auction: number;
  user: number;
  user_username: string;
  amount: number;
  created_at: string;
  remaining_coins?: number;
  extension_applied?: boolean;
  extension_minutes?: number;
  new_ends_at?: string | null;
  extension_message?: string | null;
}

export interface AuctionWinner {
  id: number;
  auction: number;
  user: number;
  user_username: string;
  winning_bid: number;
  coins_deducted: number;
  created_at: string;
}

export interface AuctionLeaderboard {
  auction_id: number;
  current_highest_bid: number | null;
  current_highest_bidder: string | null;
  total_bids: number;
  top_bidders: Array<{
    user__username: string;
    total_bids: number;
    highest_bid: number;
  }>;
}

export interface UserAuctionHistory {
  bids: AuctionBid[];
  wins: AuctionWinner[];
  total_bids: number;
  total_wins: number;
}

class ApiService {
  private baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  private normalizeMediaPath(path: string): string {
    if (path.startsWith('/media/')) return path;
    if (path.startsWith('/auction_images/')) return `/media${path}`;
    if (path.startsWith('auction_images/')) return `/media/${path}`;
    return path;
  }

  private getApiOrigin(): string {
    try {
      const parsed = new URL(this.baseURL, window.location.origin);
      if (window.location.protocol === 'https:' && parsed.protocol === 'http:') {
        parsed.protocol = 'https:';
      }
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return window.location.origin;
    }
  }

  private normalizeAbsoluteUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (window.location.protocol === 'https:' && parsed.protocol === 'http:') {
        parsed.protocol = 'https:';
      }
      return parsed.toString();
    } catch {
      return url;
    }
  }

  private resolveAssetUrl(urlValue: unknown): string {
    if (typeof urlValue !== 'string') return '';

    const url = urlValue.trim();
    if (!url) return '';

    const origin = this.getApiOrigin();

    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('blob:') ||
      url.startsWith('data:')
    ) {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
          const parsed = new URL(url);
          const normalizedPath = this.normalizeMediaPath(parsed.pathname);
          if (normalizedPath.startsWith('/media/')) {
            return `${origin}${normalizedPath}${parsed.search}${parsed.hash}`;
          }
        } catch {
          // fall through to default absolute URL normalization
        }
      }
      return this.normalizeAbsoluteUrl(url);
    }

    const normalizedPath = this.normalizeMediaPath(url.startsWith('/') ? url : `/${url}`);
    return `${origin}${normalizedPath}`;
  }

  private normalizeAuction(auction: any): Auction {
    if (!auction || typeof auction !== 'object') return auction;

    const normalizedImagesFromImagesField = Array.isArray(auction.images)
      ? auction.images
          .map((image: unknown) => this.resolveAssetUrl(image))
          .filter((image: string) => Boolean(image))
      : [];

    const normalizedImagesFromImageFiles = Array.isArray(auction.image_files)
      ? auction.image_files
          .map((item: any) => this.resolveAssetUrl(item?.image))
          .filter((image: string) => Boolean(image))
      : [];

    const normalizedImages = normalizedImagesFromImagesField.length > 0
      ? normalizedImagesFromImagesField
      : normalizedImagesFromImageFiles;

    return {
      ...auction,
      images: normalizedImages,
    };
  }

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
    const isFormData = options.body instanceof FormData;

    const defaultOptions: RequestInit = {
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
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
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
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

  // Auction endpoints
  async getAuctions(): Promise<{ count: number; results: Auction[] }> {
    const data = await this.request('/bounties/auctions/');

    if (Array.isArray(data)) {
      return {
        count: data.length,
        results: data.map((auction) => this.normalizeAuction(auction)),
      };
    }

    if (Array.isArray(data?.results)) {
      return {
        ...data,
        results: data.results.map((auction: Auction) => this.normalizeAuction(auction)),
      };
    }

    return data;
  }

  async getAuction(id: number): Promise<Auction> {
    const data = await this.request(`/bounties/auctions/${id}/`);
    return this.normalizeAuction(data);
  }

  async createAuction(data: Partial<Auction> | FormData): Promise<Auction> {
    const createdAuction = await this.request('/bounties/auctions/create/', {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });

    return this.normalizeAuction(createdAuction);
  }

  async deleteAuction(id: number): Promise<{ message: string }> {
    return this.request(`/bounties/auctions/${id}/delete/`, {
      method: 'DELETE'
    });
  }

  async updateAuctionStatus(id: number, data: { status: 'upcoming' | 'active' | 'ended' | 'cancelled' }): Promise<Auction> {
    return this.request(`/bounties/auctions/${id}/status/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async endAuction(id: number): Promise<AuctionWinner> {
    return this.request(`/bounties/auctions/${id}/end/`, {
      method: 'POST'
    });
  }

  async placeBid(auctionId: number, amount: number): Promise<AuctionBid> {
    return this.request(`/bounties/auctions/${auctionId}/bid/`, {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }

  async getAuctionLeaderboard(auctionId: number): Promise<AuctionLeaderboard> {
    return this.request(`/bounties/auctions/${auctionId}/leaderboard/`);
  }

  async getUserAuctionHistory(): Promise<UserAuctionHistory> {
    return this.request('/bounties/auctions/user/history/');
  }
}

export const apiService = new ApiService();
