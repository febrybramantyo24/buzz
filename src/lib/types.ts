export interface Profile {
  id: string;
  email: string;
  role: 'user' | 'admin';
  balance?: number;
  created_at: string;
}

export interface Service {
  id: string;
  category: string;
  name: string;
  description?: string;
  price_per_k: number;
  min_order: number;
  max_order: number;
  is_active: boolean;
  icon_url?: string;
  provider_id?: string;
  provider_service_id?: string | null;
  provider_price_per_k?: number;
  average_duration?: string;
  is_recommended?: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  service_id: string;
  category: string;
  service_name: string;
  target_url: string;
  quantity: number;
  price_per_k: number;
  total_price: number;
  status: 'pending' | 'processing' | 'inprogress' | 'success' | 'failed' | 'partial';
  start_count: number;
  payment_status: 'unpaid' | 'paid' | 'expired' | 'refunded';
  payment_method: string;
  created_at: string;
  order_id?: number;
  profiles?: {
    email: string;
  };
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'topup' | 'order_payment' | 'refund';
  status: 'pending' | 'success' | 'failed';
  reference_id?: string;
  payment_method?: string;
  description?: string;
  created_at: string;
  tx_id?: number;
  profiles?: {
    email: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  badge?: string;
  image_url?: string | null;
  is_active: boolean;
  is_pinned?: boolean;
  created_at: string;
}
