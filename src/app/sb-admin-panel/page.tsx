'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Service, Order, Announcement, Transaction } from '@/lib/types';
import PremiumThemeToggle from '@/components/PremiumThemeToggle';
import { 
  Zap, 
  LogOut, 
  Settings, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  RefreshCw, 
  Megaphone,
  UserCheck,
  Search,
  Filter,
  Users,
  Award,
  ChevronDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();

  // Admin user status
  const [adminUser, setAdminUser] = useState<any>(null);

  // Lists state
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);

  // Search & Filter state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [searchTermTransactions, setSearchTermTransactions] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Pagination states
  const [ordersPage, setOrdersPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setOrdersPage(1);
  }, [orderSearch, orderStatusFilter]);

  useEffect(() => {
    setTransactionsPage(1);
  }, [searchTermTransactions]);

  // Loading & Submitting status
  const [loading, setLoading] = useState(true);
  const [submittingService, setSubmittingService] = useState(false);
  const [submittingAnn, setSubmittingAnn] = useState(false);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'announcements' | 'transactions'>('orders');

  // Service Form State
  const [serviceCategory, setServiceCategory] = useState('Instagram');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [serviceMin, setServiceMin] = useState<number>(100);
  const [serviceMax, setServiceMax] = useState<number>(10000);
  const [serviceDescription, setServiceDescription] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annBadge, setAnnBadge] = useState('INFO');

  // Order start count updating helper
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderStartCountInput, setOrderStartCountInput] = useState<number>(0);
  const [orderStatusSelect, setOrderStatusSelect] = useState<'pending' | 'processing' | 'inprogress' | 'success' | 'failed'>('pending');

  useEffect(() => {
    async function checkAdminAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/sb-admin-login');
        return;
      }

      // Query profiles role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || profile?.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      
      setAdminUser(session.user);

      await Promise.all([
        fetchAdminData(),
        fetchServices(),
        fetchAnnouncements()
      ]);
      setLoading(false);
    }
    checkAdminAuth();
  }, [router]);

  const fetchAdminData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch admin data from API');

      const data = await response.json();
      
      // 1. Merge and set orders safely
      const localOrders: Order[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('orders_')) {
          try {
            const rawVal = localStorage.getItem(key);
            const list = rawVal ? JSON.parse(rawVal) : [];
            if (Array.isArray(list)) {
              localOrders.push(...list);
            }
          } catch (e) {
            console.warn('Error parsing local orders for key:', key, e);
          }
        }
      }
      const mergedOrders = [...(data.orders || [])];
      localOrders.forEach(localOrder => {
        if (localOrder && !mergedOrders.some(o => o.id === localOrder.id)) {
          mergedOrders.push(localOrder);
        }
      });
      mergedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 2. Merge and set transactions safely
      const localTx: Transaction[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('transactions_')) {
          try {
            const rawVal = localStorage.getItem(key);
            const list = rawVal ? JSON.parse(rawVal) : [];
            if (Array.isArray(list)) {
              localTx.push(...list);
            }
          } catch (e) {
            console.warn('Error parsing local transactions for key:', key, e);
          }
        }
      }
      const mergedTxs = [...(data.transactions || [])];
      localTx.forEach(ltx => {
        if (ltx && !mergedTxs.some(t => t.id === ltx.id)) {
          mergedTxs.push(ltx);
        }
      });
      mergedTxs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 3. Merge and set profiles safely
      const mockProfilesMap: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('orders_') || key.startsWith('transactions_') || key.startsWith('balance_'))) {
          const userId = key.split('_')[1];
          if (userId && !mockProfilesMap[userId]) {
            const balanceVal = localStorage.getItem(`balance_${userId}`);
            mockProfilesMap[userId] = {
              id: userId,
              email: userId === 'admin' ? 'admin@buzzify.com' : `user-${userId.slice(0, 4)}@buzzify.com`,
              role: 'user',
              balance: balanceVal ? Number(balanceVal) : 100000,
              created_at: new Date().toISOString()
            };
          }
        }
      }
      const mergedProfiles = [...(data.profiles || [])];
      Object.values(mockProfilesMap).forEach((mockProf: any) => {
        if (mockProf && !mergedProfiles.some(p => p.id === mockProf.id)) {
          mergedProfiles.push(mockProf);
        }
      });
      setUserProfiles(mergedProfiles);

      // Now map profiles onto transactions and orders safely
      const finalTxs = mergedTxs.map(tx => {
        if (!tx) return tx;
        const profile = mergedProfiles.find(p => p && p.id === tx.user_id);
        return {
          ...tx,
          profiles: profile ? { email: profile.email } : (tx.profiles || undefined)
        };
      }).filter(Boolean);
      setTransactions(finalTxs as Transaction[]);

      const finalOrders = mergedOrders.map(order => {
        if (!order) return order;
        const profile = mergedProfiles.find(p => p && p.id === order.user_id);
        return {
          ...order,
          profiles: profile ? { email: profile.email } : (order.profiles || undefined)
        };
      }).filter(Boolean);
      setOrders(finalOrders as Order[]);

    } catch (err) {
      console.error('API fetch failed, falling back entirely to localStorage simulation:', err);
      
      // Fallback profiles first safely
      const mockProfilesMap: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('orders_') || key.startsWith('transactions_') || key.startsWith('balance_'))) {
          const userId = key.split('_')[1];
          if (userId && !mockProfilesMap[userId]) {
            const balanceVal = localStorage.getItem(`balance_${userId}`);
            mockProfilesMap[userId] = {
              id: userId,
              email: userId === 'admin' ? 'admin@buzzify.com' : `user-${userId.slice(0, 4)}@buzzify.com`,
              role: 'user',
              balance: balanceVal ? Number(balanceVal) : 100000,
              created_at: new Date().toISOString()
            };
          }
        }
      }
      const fallbackProfiles = Object.values(mockProfilesMap);
      setUserProfiles(fallbackProfiles);

      // Fallback orders safely
      const allOrders: Order[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('orders_')) {
          try {
            const rawVal = localStorage.getItem(key);
            const list = rawVal ? JSON.parse(rawVal) : [];
            if (Array.isArray(list)) {
              allOrders.push(...list);
            }
          } catch (e) {
            console.warn('Fallback error parsing orders:', key, e);
          }
        }
      }
      const finalFallbackOrders = allOrders.map(order => {
        if (!order) return order;
        const profile = fallbackProfiles.find(p => p && p.id === order.user_id);
        return {
          ...order,
          profiles: profile ? { email: profile.email } : undefined
        };
      }).filter(Boolean);
      finalFallbackOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(finalFallbackOrders as Order[]);

      // Fallback transactions safely
      const allTx: Transaction[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('transactions_')) {
          try {
            const rawVal = localStorage.getItem(key);
            const list = rawVal ? JSON.parse(rawVal) : [];
            if (Array.isArray(list)) {
              allTx.push(...list);
            }
          } catch (e) {
            console.warn('Fallback error parsing transactions:', key, e);
          }
        }
      }
      const finalFallbackTxs = allTx.map(tx => {
        if (!tx) return tx;
        const profile = fallbackProfiles.find(p => p && p.id === tx.user_id);
        return {
          ...tx,
          profiles: profile ? { email: profile.email } : undefined
        };
      }).filter(Boolean);
      finalFallbackTxs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(finalFallbackTxs as Transaction[]);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error(err);
      // Fallback Mock services
      setServices(getMockServices());
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
      // Mock announcements
      setAnnouncements([
        {
          id: '1',
          title: '🔥 Diskon Kilat YouTube Subscribers!',
          content: 'Dapatkan potongan harga khusus untuk Layanan YouTube Subscribers Permanent hingga akhir pekan ini. Stok terbatas!',
          badge: 'RECOMMENDED',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: '⚡ Update Sistem Pembayaran QRIS',
          content: 'Sekarang pembayaran menggunakan QRIS diproses secara otomatis & real-time. Saldo/status orderan Anda langsung terupdate.',
          badge: 'HOT',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  // Create or Update Service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName.trim() || servicePrice <= 0) return;

    setSubmittingService(true);
    const payload = {
      category: serviceCategory,
      name: serviceName,
      description: serviceDescription,
      price_per_k: servicePrice,
      min_order: serviceMin,
      max_order: serviceMax,
      is_active: true
    };

    try {
      if (editingServiceId) {
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingServiceId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert(payload);
        
        if (error) throw error;
      }

      // Reset Form & Fetch
      setServiceName('');
      setServiceDescription('');
      setServicePrice(0);
      setServiceMin(100);
      setServiceMax(10000);
      setEditingServiceId(null);
      await fetchServices();
    } catch (err) {
      console.warn('Error saving service (using local fallback):', err);
      // LocalStorage Mock updates
      if (editingServiceId) {
        setServices(services.map(s => s.id === editingServiceId ? { ...s, ...payload } : s));
      } else {
        const newMock = {
          id: Math.random().toString(36).substring(2, 9),
          ...payload,
          created_at: new Date().toISOString()
        };
        setServices([newMock, ...services]);
      }
      setServiceName('');
      setServiceDescription('');
      setServicePrice(0);
      setEditingServiceId(null);
    } finally {
      setSubmittingService(false);
    }
  };

  // Edit Service setup
  const startEditService = (service: Service) => {
    setEditingServiceId(service.id);
    setServiceCategory(service.category);
    setServiceName(service.name);
    setServiceDescription(service.description || '');
    setServicePrice(service.price_per_k);
    setServiceMin(service.min_order);
    setServiceMax(service.max_order);
  };

  // Delete Service
  const handleDeleteService = async (id: string) => {
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      await fetchServices();
    } catch (err) {
      console.error('Error deleting service:', err);
      setServices(services.filter(s => s.id !== id));
    }
  };

  // Save Announcement
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setSubmittingAnn(true);
    const payload = {
      title: annTitle,
      content: annContent,
      badge: annBadge,
      is_active: true
    };

    try {
      const { error } = await supabase.from('announcements').insert(payload);
      if (error) throw error;

      setAnnTitle('');
      setAnnContent('');
      await fetchAnnouncements();
    } catch (err) {
      console.error('Error saving announcement:', err);
      const newMockAnn = {
        id: Math.random().toString(36).substring(2, 9),
        ...payload,
        created_at: new Date().toISOString()
      };
      setAnnouncements([newMockAnn, ...announcements]);
      setAnnTitle('');
      setAnnContent('');
    } finally {
      setSubmittingAnn(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnn = async (id: string) => {
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      await fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setAnnouncements(announcements.filter(a => a.id !== id));
    }
  };

  // Open Order Status Editor Drawer
  const openOrderEditor = (order: Order) => {
    setUpdatingOrderId(order.id);
    setOrderStartCountInput(order.start_count || 0);
    setOrderStatusSelect(order.status);
  };

  // Save Order Updates
  const handleSaveOrderUpdate = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: orderStatusSelect,
          start_count: orderStartCountInput,
          payment_status: 'paid' // Admin updates automatically sets paid
        })
        .eq('id', orderId);

      if (error) throw error;
      await fetchAdminData();
    } catch (err) {
      console.warn('Error updating order, executing local storage updates', err);
      
      // LocalStorage update sync
      setOrders(orders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            status: orderStatusSelect,
            start_count: orderStartCountInput,
            payment_status: 'paid'
          };
        }
        return o;
      }));

      // Search all local storage keys to update user's specific store
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('orders_')) {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          const updated = list.map((o: Order) => {
            if (o.id === orderId) {
              return {
                ...o,
                status: orderStatusSelect,
                start_count: orderStartCountInput,
                payment_status: 'paid'
              };
            }
            return o;
          });
          localStorage.setItem(key, JSON.stringify(updated));
        }
      }
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
  };

  function getMockServices(): Service[] {
    return [
      {
        id: '1',
        category: 'Instagram',
        name: 'Instagram Followers Indonesia [Real Aktif]',
        price_per_k: 45000,
        min_order: 100,
        max_order: 10000,
        is_active: true,
        created_at: ''
      },
      {
        id: '2',
        category: 'Instagram',
        name: 'Instagram Likes Indo [Sangat Cepat]',
        price_per_k: 12000,
        min_order: 50,
        max_order: 5000,
        is_active: true,
        created_at: ''
      },
      {
        id: '3',
        category: 'TikTok',
        name: 'TikTok Followers [Real & Permanent]',
        price_per_k: 65000,
        min_order: 100,
        max_order: 20000,
        is_active: true,
        created_at: ''
      }
    ];
  }

  // Filtered Orders for display
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.service_name.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          o.target_url.toLowerCase().includes(orderSearch.toLowerCase()) || 
                          o.id.toLowerCase().includes(orderSearch.toLowerCase());

    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalOrdersPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const filteredTransactions = transactions.filter(t => 
    t.id.toLowerCase().includes(searchTermTransactions.toLowerCase()) || 
    (t.profiles?.email || '').toLowerCase().includes(searchTermTransactions.toLowerCase()) ||
    t.user_id.toLowerCase().includes(searchTermTransactions.toLowerCase())
  );

  const totalTxPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="mt-4 text-slate-400 text-sm">Menyiapkan dashboard Admin...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Buzz<span className="text-indigo-400">ify</span> <span className="text-xs bg-indigo-500 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase ml-1">Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <PremiumThemeToggle />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3.5 py-2 rounded-xl transition-all border border-red-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-slate-900 pb-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Manajemen Order ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'services'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Atur Layanan ({services.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'announcements'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Info & Rekomendasi ({announcements.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('transactions');
              fetchAdminData();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'transactions'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Log Transaksi ({transactions.length})</span>
          </button>
        </div>

        {/* Tab 1: Orders Management */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800/80 p-5 rounded-3xl">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari Order ID, Layanan, atau URL..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 pl-11 pr-4 py-3 rounded-2xl outline-none transition-colors text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['all', 'pending', 'processing', 'inprogress', 'success'].map(status => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      orderStatusFilter === status
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {status === 'all' ? 'Semua' : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl overflow-hidden">
              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center text-slate-400">Belum ada orderan masuk.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-455 font-semibold uppercase tracking-wider">
                          <th className="py-4 px-4">User</th>
                          <th className="py-4 px-4">Order ID & Status</th>
                          <th className="py-4 px-4">Layanan</th>
                          <th className="py-4 px-4">Target URL</th>
                          <th className="py-4 px-4 text-right">Jumlah</th>
                          <th className="py-4 px-4 text-right">Total Harga</th>
                          <th className="py-4 px-4 text-right">Start Count</th>
                          <th className="py-4 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/40">
                        {filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage).map(order => (
                          <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
                            <td className="py-4 px-4 text-slate-300">
                              {order.profiles?.email || 'User/Simulated'}
                            </td>
                            <td className="py-4 px-4">
                              <span className="font-mono text-slate-400 font-bold block">#{order.id.slice(0, 8)}</span>
                              <div className="flex gap-1.5 mt-1.5">
                                {/* Payment Status badge */}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {order.payment_status}
                                </span>
                                {/* Process Status badge */}
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  order.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                  order.status === 'inprogress' ? 'bg-blue-500/10 text-blue-400' :
                                  order.status === 'processing' ? 'bg-purple-500/10 text-purple-400' :
                                  'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-slate-200">
                              {order.service_name}
                              <span className="block text-[10px] text-slate-500 font-light mt-0.5">{order.category}</span>
                            </td>
                            <td className="py-4 px-4 font-mono text-slate-400 max-w-xs truncate">
                              <a href={order.target_url} target="_blank" rel="noreferrer" className="hover:text-indigo-400 hover:underline">
                                {order.target_url}
                              </a>
                            </td>
                            <td className="py-4 px-4 text-right font-medium text-slate-300">{order.quantity.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right font-bold text-indigo-400">{formatPrice(order.total_price)}</td>
                            <td className="py-4 px-4 text-right font-mono text-slate-300">
                              {order.start_count || 0}
                            </td>
                            <td className="py-4 px-4 text-center">
                              {updatingOrderId === order.id ? (
                                <div className="flex flex-col gap-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl w-44 mx-auto text-left">
                                  <div>
                                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Jumlah Awal</label>
                                    <input
                                      type="number"
                                      value={orderStartCountInput}
                                      onChange={(e) => setOrderStartCountInput(parseInt(e.target.value) || 0)}
                                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2 py-1 rounded outline-none text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Status Progres</label>
                                    <select
                                      value={orderStatusSelect}
                                      onChange={(e) => setOrderStatusSelect(e.target.value as any)}
                                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2 py-1 rounded outline-none text-xs"
                                    >
                                      <option value="pending">pending</option>
                                      <option value="processing">processing</option>
                                      <option value="inprogress">inprogress</option>
                                      <option value="success">success</option>
                                      <option value="failed">failed</option>
                                    </select>
                                  </div>
                                  <div className="flex gap-1.5 mt-1">
                                    <button
                                      onClick={() => handleSaveOrderUpdate(order.id)}
                                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded text-[10px] flex items-center justify-center gap-1"
                                    >
                                      <Check className="w-3 h-3" />
                                      Simpan
                                    </button>
                                    <button
                                      onClick={() => setUpdatingOrderId(null)}
                                      className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px]"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => openOrderEditor(order)}
                                  className="inline-flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-500/20 font-bold cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  Atur Progres
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalOrdersPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-850/80 bg-slate-900/10 px-6 py-4">
                      <div className="text-xs text-slate-400">
                        Menampilkan <span className="font-semibold text-slate-350">{((ordersPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold text-slate-350">{Math.min(ordersPage * itemsPerPage, filteredOrders.length)}</span> dari <span className="font-semibold text-slate-350">{filteredOrders.length}</span> orderan
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={ordersPage === 1}
                          onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                          className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 border border-slate-850 text-xs transition-all active:scale-95 disabled:pointer-events-none cursor-pointer"
                        >
                          Sebelumnya
                        </button>
                        <button
                          disabled={ordersPage === totalOrdersPages}
                          onClick={() => setOrdersPage(p => Math.min(totalOrdersPages, p + 1))}
                          className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 border border-slate-850 text-xs transition-all active:scale-95 disabled:pointer-events-none cursor-pointer"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Service Management */}
        {activeTab === 'services' && (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* Service Form */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
              <h3 className="font-bold text-base text-slate-200 mb-6 flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>{editingServiceId ? 'Edit Layanan' : 'Tambah Layanan Baru'}</span>
              </h3>

              <form onSubmit={handleSaveService} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kategori</label>
                  <div className="flex gap-2">
                    <select
                      value={serviceCategory === 'Instagram' || serviceCategory === 'TikTok' || serviceCategory === 'YouTube' || serviceCategory === 'Twitter/X' ? serviceCategory : 'Kustom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'Kustom') {
                          setServiceCategory('');
                        } else {
                          setServiceCategory(val);
                        }
                      }}
                      className="bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs flex-1"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Twitter/X">Twitter/X</option>
                      <option value="Kustom">Kategori Baru (Kustom)...</option>
                    </select>
                  </div>
                  {!(serviceCategory === 'Instagram' || serviceCategory === 'TikTok' || serviceCategory === 'YouTube' || serviceCategory === 'Twitter/X') && (
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama kategori baru..."
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-250 px-4 py-3 rounded-2xl outline-none text-xs mt-2"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Layanan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Followers Indo Real"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deskripsi Layanan</label>
                  <textarea
                    placeholder="Masukkan deskripsi detail layanan (misal: Followers real aktif, proses cepat, garansi 30 hari)..."
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Harga per 1.000 (1K)</label>
                  <input
                    type="number"
                    required
                    value={servicePrice || ''}
                    onChange={(e) => setServicePrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Min Order</label>
                    <input
                      type="number"
                      required
                      value={serviceMin}
                      onChange={(e) => setServiceMin(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Max Order</label>
                    <input
                      type="number"
                      required
                      value={serviceMax}
                      onChange={(e) => setServiceMax(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submittingService}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingServiceId ? 'Perbarui Layanan' : 'Simpan Layanan'}</span>
                  </button>
                  {editingServiceId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingServiceId(null);
                        setServiceName('');
                        setServiceDescription('');
                        setServicePrice(0);
                      }}
                      className="px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl text-xs"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Service Lists */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
              <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider">Daftar Layanan Tersedia</h3>
              <div className="divide-y divide-slate-850">
                {services.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">Belum ada layanan di input.</div>
                ) : (
                  services.map(service => (
                    <div key={service.id} className="py-4 flex justify-between items-center gap-4 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded font-extrabold text-[9px] bg-slate-850 text-slate-300 uppercase tracking-wide">
                            {service.category}
                          </span>
                          <span className="font-bold text-slate-250">{service.name}</span>
                        </div>
                        <div className="text-slate-500 mt-1 font-light flex items-center gap-3">
                          <span>Min: {service.min_order.toLocaleString()}</span>
                          <span>•</span>
                          <span>Max: {service.max_order.toLocaleString()}</span>
                        </div>
                        {service.description && (
                          <div className="text-[11px] text-slate-400 mt-2 bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 max-w-md font-light leading-relaxed whitespace-pre-wrap">
                            <span className="block font-bold text-[9px] text-indigo-400/80 uppercase tracking-wider mb-1">Deskripsi Detail:</span>
                            <div className="text-slate-350">{service.description}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <strong className="text-indigo-400 font-bold">{formatPrice(service.price_per_k)}</strong>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => startEditService(service)}
                            className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Announcements Recommendation management */}
        {activeTab === 'announcements' && (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* Announcement Form */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
              <h3 className="font-bold text-base text-slate-200 mb-6 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" />
                <span>Buat Info Rekomendasi</span>
              </h3>

              <form onSubmit={handleSaveAnnouncement} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tag Badge</label>
                  <select
                    value={annBadge}
                    onChange={(e) => setAnnBadge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                  >
                    <option value="INFO">INFO</option>
                    <option value="HOT">HOT</option>
                    <option value="RECOMMENDED">RECOMMENDED</option>
                    <option value="DISCOUNT">DISCOUNT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Judul Info</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Promo Weekend Followers"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deskripsi / Detail Konten</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Masukkan pesan info detail rekomendasi di sini..."
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAnn}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kirim Informasi</span>
                </button>
              </form>
            </div>

            {/* Announcement lists */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
              <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider">Daftar Info Terkirim</h3>
              <div className="divide-y divide-slate-850">
                {announcements.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">Belum ada info diinput.</div>
                ) : (
                  announcements.map(ann => (
                    <div key={ann.id} className="py-4 flex justify-between items-start gap-4">
                      <div className="text-xs">
                        <div className="flex items-center gap-2">
                          {ann.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                              {ann.badge}
                            </span>
                          )}
                          <span className="font-bold text-slate-200">{ann.title}</span>
                        </div>
                        <p className="text-slate-400 mt-1 font-light leading-relaxed">{ann.content}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteAnn(ann.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Transactions & Balances Logs */}
        {activeTab === 'transactions' && (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* User Balances List */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md flex flex-col max-h-[640px]">
              <h3 className="font-bold text-base text-slate-200 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Saldo Akun User</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4 font-light">
                Daftar lengkap saldo tersimpan user terdaftar di sistem.
              </p>

              {/* User search box */}
              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-550" />
                <input
                  type="text"
                  placeholder="Cari email user..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-855 focus:border-indigo-500 text-slate-200 pl-10 pr-4 py-2 rounded-xl outline-none transition-colors text-xs"
                />
              </div>

              {/* Scrollable list */}
              <div className="divide-y divide-slate-850 overflow-y-auto pr-1 flex-1 max-h-[480px]">
                {userProfiles.filter(prof => 
                  (prof.email || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                  prof.id.toLowerCase().includes(userSearchTerm.toLowerCase())
                ).length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">Tidak ada user ditemukan.</div>
                ) : (
                  userProfiles
                    .filter(prof => 
                      (prof.email || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      prof.id.toLowerCase().includes(userSearchTerm.toLowerCase())
                    )
                    .map(prof => (
                      <div key={prof.id} className="py-3.5 flex justify-between items-center gap-2 text-xs">
                        <div className="truncate">
                          <span className="font-bold text-slate-250 block truncate">{prof.email}</span>
                          <span className="text-[10px] text-slate-550 font-mono block mt-0.5">#{prof.id.slice(0, 8)}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-indigo-400 block">{formatPrice(prof.balance || 0)}</span>
                          <span className="text-[9px] text-slate-500 uppercase tracking-wider block mt-0.5">{prof.role}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Transaction Logs Table */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-400" />
                  <span>Log Transaksi Sistem</span>
                </h3>
                
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                  <input
                    type="text"
                    placeholder="Cari user email or ID..."
                    value={searchTermTransactions}
                    onChange={(e) => setSearchTermTransactions(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 pl-10 pr-4 py-2 rounded-xl outline-none transition-colors text-xs"
                  />
                </div>
              </div>

              {/* Transactions list */}
              {filteredTransactions.length === 0 ? (
                <div className="py-16 text-center text-slate-550 text-xs">Tidak ada riwayat transaksi ditemukan.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-450 font-semibold uppercase tracking-wider">
                          <th className="py-3 px-3">User</th>
                          <th className="py-3 px-3">Tipe</th>
                          <th className="py-3 px-3">Jumlah</th>
                          <th className="py-3 px-3">Metode</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3">Tanggal & Waktu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/30">
                        {filteredTransactions
                          .slice((transactionsPage - 1) * itemsPerPage, transactionsPage * itemsPerPage)
                          .map(tx => (
                            <tr key={tx.id} className="hover:bg-slate-900/20 transition-colors">
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-250 block max-w-[150px] truncate">{tx.profiles?.email || 'User/Simulated'}</span>
                                <span className="text-[9px] text-slate-550 font-mono block mt-0.5">#{tx.id.slice(0, 8)}</span>
                              </td>
                              <td className="py-3 px-3">
                                {tx.type === 'topup' ? (
                                  <span className="text-emerald-400 flex items-center gap-1 font-medium">
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Topup
                                  </span>
                                ) : tx.type === 'refund' ? (
                                  <span className="text-blue-400 flex items-center gap-1 font-medium">
                                    <ArrowUpRight className="w-3.5 h-3.5" /> Refund
                                  </span>
                                ) : (
                                  <span className="text-slate-350 flex items-center gap-1 font-medium">
                                    <ArrowDownRight className="w-3.5 h-3.5" /> Order
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-bold">
                                <span className={tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                  {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-455 uppercase">{tx.payment_method || '-'}</td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider inline-block ${
                                  tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  tx.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {tx.status}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-500">
                                {new Date(tx.created_at).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalTxPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-850/80 bg-slate-900/10 px-6 py-4">
                      <div className="text-xs text-slate-400">
                        Menampilkan <span className="font-semibold text-slate-350">{((transactionsPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold text-slate-350">{Math.min(transactionsPage * itemsPerPage, filteredTransactions.length)}</span> dari <span className="font-semibold text-slate-350">{filteredTransactions.length}</span> transaksi
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={transactionsPage === 1}
                          onClick={() => setTransactionsPage(p => Math.max(1, p - 1))}
                          className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 border border-slate-850 text-xs transition-all active:scale-95 disabled:pointer-events-none cursor-pointer"
                        >
                          Sebelumnya
                        </button>
                        <button
                          disabled={transactionsPage === totalTxPages}
                          onClick={() => setTransactionsPage(p => Math.min(totalTxPages, p + 1))}
                          className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 border border-slate-850 text-xs transition-all active:scale-95 disabled:pointer-events-none cursor-pointer"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
