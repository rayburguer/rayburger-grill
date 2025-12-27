export interface Product {
  id: number;
  name: string;
  description?: string; // NEW: Appetizing description
  basePrice_usd: number;
  image: string;
  category: string;
  isAvailable?: boolean; // NEW: Inventory tracking (default: true)
  stockQuantity?: number; // NEW: Quantitative inventory tracking
  rating?: number; // NEW: 1-5 stars
  ratingCount?: number; // NEW: Number of reviews
  customizableOptions?: {
    id: string;
    name: string;
    price_usd: number;
    defaultIncluded: boolean;
  }[];
  highlight?: string; // NEW: e.g. "NEW", "TOP"
  isUploading?: boolean; // NEW: For UI state during image upload
}

export interface Suggestion {
  id: string;
  phone: string;
  name?: string;
  content: string; // The "burguer ideal" description
  timestamp: number;
}

export interface CartItem extends Product {
  cartItemId: string;
  quantity: number;
  selectedOptions: { [optionId: string]: boolean };
  finalPrice_usd: number;
}

export interface Order {
  orderId: string;
  timestamp: number;
  totalUsd: number;
  items: {
    name: string;
    quantity: number;
    price_usd: number;
    selectedOptions?: { [optionId: string]: boolean };
  }[];
  pointsEarned: number;
  referrerPointsEarned?: number;
  level2ReferrerPointsEarned?: number;
  status: 'pending' | 'received' | 'preparing' | 'shipped' | 'payment_confirmed' | 'delivered' | 'rejected' | 'approved';
  deliveryMethod: 'delivery' | 'pickup';
  deliveryFee: number;
  customerName?: string; // For Guest/Persistence
  customerPhone?: string; // Mandatory for contact
  processedBy?: string; // NEW: Staff member who created the order (POS)
}

export interface User {
  email: string;
  name: string;
  lastName?: string; // NEW: Last name for full identification in raffles
  phone: string;
  passwordHash: string;
  referralCode: string;
  referredByCode?: string;
  points: number;
  cashbackBalance_usd?: number;
  loyaltyTier: string;
  lastPointsUpdate?: number; // For expiration tracking
  role: 'admin' | 'customer';
  nextPurchaseMultiplier?: number; // NEW: Retention Marketing (e.g. 2x points)
  birthDate?: string; // NEW: Optional birthday (YYYY-MM-DD) for age analytics and birthday promos
  registrationDate?: number; // Timestamp of registration
  registeredVia?: 'web' | 'pos'; // Track registration source
  orders: Order[];
  // Anti-Fraud: Track referral activity
  referralStats?: {
    totalReferred: number;
    referredThisMonth: number;
    referredToday: number;
    lastReferralDate?: string; // YYYY-MM-DD format
  };
  // Rewards: Track unlocked milestones
  unlockedRewards?: number[]; // Array of milestone points unlocked
  redeemedRewards?: {
    milestonePoints: number;
    redeemedAt: number;
    orderId: string;
  }[];
  // Roulette
  lastSpinDate?: number; // Timestamp of last spin
}

export interface Survey {
  id: string;
  orderId: string;
  userId?: string; // Optional if guest
  timestamp: number;
  ratings: {
    foodQuality: number; // 1-10
    service: number;     // 1-10
    price: number;       // 1-10
    deliveryTime: number;// 1-10
  };
  comments: string;
}
