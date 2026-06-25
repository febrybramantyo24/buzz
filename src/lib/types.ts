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
  status: 'pending' | 'processing' | 'inprogress' | 'success' | 'failed';
  start_count: number;
  payment_status: 'unpaid' | 'paid' | 'expired';
  payment_method: string;
  created_at: string;
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
  created_at: string;
  profiles?: {
    email: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  badge?: string;
  is_active: boolean;
  created_at: string;
}
