export interface Product {
  id: number;
  name: string;
  description?: string;
  basePrice_usd: number;
  image: string;
  category: string;
  isAvailable?: boolean;
  stockQuantity?: number;
  rating?: number;
  ratingCount?: number;
  customizableOptions?: {
    id: string;
    name: string;
    price_usd: number;
    defaultIncluded: boolean;
  }[];
  highlight?: string;
  isUploading?: boolean;
}

export interface Suggestion {
  id: string;
  phone: string;
  name?: string;
  content: string;
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
  id?: string; // Legacy/Auth compatibility
  timestamp: number;
  totalUsd: number;
  items: {
    name: string;
    quantity: number;
    price_usd: number;
    selectedOptions?: { [optionId: string]: boolean };
  }[];
  pointsEarned: number;
  rewardsEarned_usd: number;
  referrerRewardsEarned_usd?: number;
  status: 'pending' | 'received' | 'preparing' | 'shipped' | 'payment_confirmed' | 'delivered' | 'rejected' | 'approved';
  deliveryMethod: 'delivery' | 'pickup';
  deliveryFee: number;
  paymentMethod: 'cash' | 'pago_movil' | 'zelle' | 'other' | 'whatsapp_link';
  paymentStatus: 'pending' | 'paid';
  balanceUsed_usd?: number;
  customerName?: string;
  customerPhone?: string;
  processedBy?: string;
  cashierMode?: boolean;
}

export interface User {
  id?: string;
  email: string;
  name: string;
  lastName?: string;
  phone: string;
  passwordHash: string;
  referralCode: string;
  referredByCode?: string;
  walletBalance_usd: number;
  lifetimeSpending_usd: number;
  loyaltyTier: string;
  lastRewardsUpdate?: number;
  lastPointsUpdate?: number;
  lastSpinDate?: number;
  role: 'admin' | 'customer';
  nextPurchaseMultiplier?: number;
  birthDate?: string;
  registrationDate?: number;
  registeredVia?: 'web' | 'pos';
  orders: Order[];
  points: number;
  referralStats?: {
    totalReferred: number;
    referredThisMonth: number;
    referredToday: number;
    lastReferralDate?: string;
  };
  unlockedRewards?: number[];
  redeemedRewards?: number[];
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
