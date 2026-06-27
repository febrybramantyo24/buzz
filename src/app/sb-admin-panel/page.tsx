'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dbClient as supabase } from '@/lib/db-client';
import { Service, Order, Announcement, Transaction } from '@/lib/types';
import PremiumThemeToggle from '@/components/PremiumThemeToggle';
import { 
  Zap, 
  AlertCircle,
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
  CreditCard,
  ExternalLink,
  Copy,
  Calendar,
  User,
  Tag,
  Hash,
  Star
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
  const [servicesPage, setServicesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const itemsPerPage = 10;
  const servicesPerPage = 5;

  useEffect(() => {
    setOrdersPage(1);
  }, [orderSearch, orderStatusFilter]);

  useEffect(() => {
    setTransactionsPage(1);
  }, [searchTermTransactions]);

  useEffect(() => {
    setUsersPage(1);
  }, [userSearchTerm]);

  // Loading & Submitting status
  const [loading, setLoading] = useState(true);
  const [submittingService, setSubmittingService] = useState(false);
  const [submittingAnn, setSubmittingAnn] = useState(false);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'announcements' | 'transactions' | 'landing'>('orders');

  // Service Form State
  const [serviceCategory, setServiceCategory] = useState('Instagram');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number>(0);
  const [serviceMin, setServiceMin] = useState<number>(100);
  const [serviceMax, setServiceMax] = useState<number>(10000);
  const [serviceDescription, setServiceDescription] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceIcon, setServiceIcon] = useState('');
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});

  // Provider states
  const [providerId, setProviderId] = useState('manual');
  const [providerServiceId, setProviderServiceId] = useState('');
  const [providerPrice, setProviderPrice] = useState<number>(0);
  const [averageDuration, setAverageDuration] = useState('15 Menit');

  const [providerServicesList, setProviderServicesList] = useState<any[]>([]);
  const [loadingProviderServices, setLoadingProviderServices] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [providerSearch, setProviderSearch] = useState('');
  const [providerCategorySearch, setProviderCategorySearch] = useState('');
  const [providerCategoryFilter, setProviderCategoryFilter] = useState('all');
  const [providerBalance, setProviderBalance] = useState<string | null>(null);
  const [medanpediaBalance, setMedanpediaBalance] = useState<string | null>(null);

  // Provider service comparison states
  const [comparisonKeyword, setComparisonKeyword] = useState('');
  const [comparisonResults, setComparisonResults] = useState<{
    buzzerpanel: any[];
    medanpedia: any[];
  } | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  const handleCompareServices = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!comparisonKeyword.trim()) return;
    setLoadingComparison(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch BuzzerPanel services
      const resBp = await fetch('/api/admin/provider-services?provider=buzzerpanel', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const dataBp = await resBp.json();

      // Fetch MedanPedia services
      const resMp = await fetch('/api/admin/provider-services?provider=medanpedia', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      const dataMp = await resMp.json();

      const bpList = (dataBp.services || []).filter((s: any) => 
        s && (
          (s.name || '').toLowerCase().includes(comparisonKeyword.toLowerCase()) ||
          (s.category || '').toLowerCase().includes(comparisonKeyword.toLowerCase())
        )
      ).sort((a: any, b: any) => parseFloat(a.price || 0) - parseFloat(b.price || 0));

      const mpList = (dataMp.services || []).filter((s: any) => 
        s && (
          (s.name || '').toLowerCase().includes(comparisonKeyword.toLowerCase()) ||
          (s.category || '').toLowerCase().includes(comparisonKeyword.toLowerCase())
        )
      ).sort((a: any, b: any) => parseFloat(a.price || 0) - parseFloat(b.price || 0));

      setComparisonResults({
        buzzerpanel: bpList,
        medanpedia: mpList
      });
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setLoadingComparison(false);
    }
  };

  const fetchProviderBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Fetch BuzzerPanel Balance
      const response = await fetch('/api/admin/provider-balance?provider=buzzerpanel', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProviderBalance(data.balance);
      }

      // Fetch MedanPedia Balance
      const responseMp = await fetch('/api/admin/provider-balance?provider=medanpedia', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const dataMp = await responseMp.json();
      if (responseMp.ok) {
        setMedanpediaBalance(dataMp.balance);
      }
    } catch (e) {
      console.error('Error fetching provider balance:', e);
    }
  };

  const fetchProviderServices = async () => {
    setLoadingProviderServices(true);
    setProviderError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(`/api/admin/provider-services?provider=${providerId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setProviderServicesList(data.services || []);
      } else {
        setProviderError(data.error || 'Gagal mengambil layanan');
      }
    } catch (e: any) {
      setProviderError(e.message || 'Terjadi kesalahan');
    } finally {
      setLoadingProviderServices(false);
    }
  };

  // Announcement Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annBadge, setAnnBadge] = useState('INFO');
  const [annImageUrl, setAnnImageUrl] = useState('');

  // Order start count updating helper
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [orderStartCountInput, setOrderStartCountInput] = useState<number>(0);
  const [orderStatusSelect, setOrderStatusSelect] = useState<'pending' | 'processing' | 'inprogress' | 'success' | 'failed' | 'partial'>('pending');
  const [customRefundInput, setCustomRefundInput] = useState<string>('');

  // Landing Page Settings Form State
  const defaultLandingSettings = {
    hero_badge: 'Platform Buzzer Terpercaya & Tercepat di Indonesia',
    hero_title: 'Tingkatkan **Popularitas Medsos** Anda dengan Proses Cepat!',
    hero_subtitle: 'Buzzify menyediakan layanan optimasi media sosial terbaik. Followers, Likes, Views, dan Subscribers berkualitas tinggi dengan harga termurah.',
    hero_cta_text: 'Mulai Order Sekarang',
    hero_cta_sub_text: 'Lihat Layanan',
    stats_orders: '100K+',
    stats_clients: '15K+',
    stats_success: '99.9%',
    stats_speed: '< 5 Menit',
    warning_title_instagram: 'Penting Instagram (Followers):',
    warning_desc_instagram: 'Jika Anda tidak melihat pengikut baru masuk, kemungkinan besar karena akun Anda menyaring atau menahan pengikut untuk ditinjau. Ikuti langkah berikut agar followers langsung masuk otomatis tanpa tersaring ke spam:\n\n1. Buka menu **Pengaturan dan Privasi**.\n2. Pilih **Ikuti dan Undang Teman**.\n3. Nonaktifkan opsi **Tandai untuk Ditinjau (Flag for Review)**.\n4. Jika baru dinonaktifkan, silakan tes pesan dengan jumlah kecil dulu.',
    warning_image_url_instagram: '/instagram_instruction.jpg',
    warning_video_url_instagram: '',
    deposit_bonus_min: '10000',
    deposit_bonus_percent: '11'
  };

  const [landingSettings, setLandingSettings] = useState<Record<string, string>>(defaultLandingSettings);
  const [loadingLandingSettings, setLoadingLandingSettings] = useState(false);
  const [savingLandingSettings, setSavingLandingSettings] = useState(false);
  const [selectedWarningCategory, setSelectedWarningCategory] = useState('instagram');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    message: '',
    onConfirm: () => {}
  });

  const fetchLandingSettings = async () => {
    setLoadingLandingSettings(true);
    try {
      const response = await fetch('/api/site-settings');
      if (response.ok) {
        const loaded = await response.json();
        setLandingSettings(prev => ({ ...prev, ...loaded }));
      }
    } catch (e) {
      console.error('Error loading landing page settings:', e);
    } finally {
      setLoadingLandingSettings(false);
    }
  };

  const handleSaveLandingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingLandingSettings(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Sesi masuk kedaluwarsa. Silakan masuk kembali.');
        return;
      }

      const response = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          settings: landingSettings
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Gagal menyimpan pengaturan');
      }

      alert('Landing page settings updated successfully!');
    } catch (err: any) {
      console.error(err);
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSavingLandingSettings(false);
    }
  };

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
      
      // Now fetch provider balance in background
      fetchProviderBalance();

      // 1. Set orders safely
      const mergedOrders = [...(data.orders || [])];
      mergedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 2. Set transactions safely
      const mergedTxs = [...(data.transactions || [])];
      mergedTxs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 3. Set profiles safely
      const mergedProfiles = [...(data.profiles || [])];
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
      is_active: true,
      icon_url: serviceIcon || undefined,
      provider_id: providerId,
      provider_service_id: providerId === 'manual' ? null : providerServiceId,
      provider_price_per_k: providerId === 'manual' ? 0 : providerPrice,
      average_duration: averageDuration
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
      setServiceIcon('');
      setEditingServiceId(null);
      setProviderId('manual');
      setProviderServiceId('');
      setProviderPrice(0);
      setAverageDuration('15 Menit');
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
      setServiceIcon('');
      setEditingServiceId(null);
    } finally {
      setSubmittingService(false);
    }
  };

  // Edit Service setup
  const startEditService = (service: any) => {
    setEditingServiceId(service.id);
    setServiceCategory(service.category);
    setServiceName(service.name);
    setServiceDescription(service.description || '');
    setServicePrice(service.price_per_k);
    setServiceMin(service.min_order);
    setServiceMax(service.max_order);
    setServiceIcon(service.icon_url || '');
    setProviderId(service.provider_id || 'manual');
    setProviderServiceId(service.provider_service_id || '');
    setProviderPrice(Number(service.provider_price_per_k || 0));
    setAverageDuration(service.average_duration || '15 Menit');
  };

  // Delete Service
  const handleDeleteService = (id: string) => {
    setConfirmModal({
      show: true,
      message: 'Apakah Anda yakin ingin menghapus layanan ini?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('services').delete().eq('id', id);
          if (error) throw error;
          await fetchServices();
        } catch (err) {
          console.error('Error deleting service:', err);
          setServices(services.filter(s => s.id !== id));
        }
      }
    });
  };

  // Toggle Recommend Service
  const handleToggleRecommend = async (service: Service) => {
    const newVal = !service.is_recommended;
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_recommended: newVal })
        .eq('id', service.id);
      
      if (error) throw error;
      await fetchServices();
    } catch (err: any) {
      console.error('Error toggling recommend:', err);
      setServices(services.map(s => s.id === service.id ? { ...s, is_recommended: newVal } : s));
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
      image_url: annImageUrl || null,
      is_active: true
    };

    try {
      const { error } = await supabase.from('announcements').insert(payload);
      if (error) throw error;

      setAnnTitle('');
      setAnnContent('');
      setAnnImageUrl('');
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
      setAnnImageUrl('');
    } finally {
      setSubmittingAnn(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnn = (id: string) => {
    setConfirmModal({
      show: true,
      message: 'Apakah Anda yakin ingin menghapus pengumuman ini?',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('announcements').delete().eq('id', id);
          if (error) throw error;
          await fetchAnnouncements();
        } catch (err) {
          console.error('Error deleting announcement:', err);
          setAnnouncements(announcements.filter(a => a.id !== id));
        }
      }
    });
  };

  // Open Order Status Editor Drawer
  const openOrderEditor = (order: Order) => {
    setUpdatingOrderId(order.id);
    setOrderStartCountInput(order.start_count || 0);
    setOrderStatusSelect(order.status);
    setCustomRefundInput(String(order.total_price));
  };

  // Save Order Updates
  const handleSaveOrderUpdate = async (orderId: string) => {
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    if (orderStatusSelect === 'failed' || orderStatusSelect === 'partial') {
      const refundVal = parseFloat(customRefundInput) || 0;
      const maxRefundable = parseFloat(String(currentOrder.total_price));
      
      if (refundVal < 0) {
        alert('Jumlah refund tidak boleh kurang dari 0!');
        return;
      }
      if (refundVal > maxRefundable) {
        alert(`Jumlah refund tidak boleh melebihi harga total orderan (Max: Rp ${maxRefundable.toLocaleString('id-ID')})!`);
        return;
      }
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          orderId: orderId,
          status: orderStatusSelect,
          startCount: orderStartCountInput,
          refundAmount: (orderStatusSelect === 'failed' || orderStatusSelect === 'partial') ? parseFloat(customRefundInput) : undefined
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update order');
      }

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

  const handleRetryProvider = (orderId: string) => {
    setConfirmModal({
      show: true,
      message: 'Kirim pesanan ini ke provider pusat?',
      onConfirm: async () => {
        setRetryingOrderId(orderId);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            alert('Sesi login telah berakhir. Silakan login kembali.');
            return;
          }

          const res = await fetch('/api/admin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              action: 'retry_provider',
              orderId: orderId
            })
          });

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Gagal mengirim ulang pesanan');
          }

          alert(data.message || 'Berhasil mengirim ulang pesanan ke provider pusat');
          await fetchAdminData();
        } catch (err: any) {
          alert(err.message || 'Terjadi kesalahan');
        } finally {
          setRetryingOrderId(null);
        }
      }
    });
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

  const categoryIconMap = services.reduce((acc, s) => {
    if (s.icon_url && !acc[s.category]) {
      acc[s.category] = s.icon_url;
    }
    return acc;
  }, {} as Record<string, string>);

  // Calculate sales and profits for admin dashboard stats
  const paidOrders = orders.filter(o => o.payment_status === 'paid' && o.status !== 'failed');
  const totalSales = paidOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  
  const totalCost = paidOrders.reduce((sum, o) => {
    const service = services.find(s => s.id === o.service_id);
    const providerPricePerK = service ? Number(service.provider_price_per_k) : 0;
    if (providerPricePerK > 0) {
      return sum + ((providerPricePerK * o.quantity) / 1000);
    }
    return sum + (Number(o.total_price) * 0.7); // fallback 70% cost
  }, 0);

  const totalProfit = totalSales - totalCost;
  const profitMarginPercent = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;

  // Order breakdown counts
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => o.status === 'processing' || o.status === 'inprogress').length;
  const successCount = orders.filter(o => o.status === 'success').length;
  const failedCount = orders.filter(o => o.status === 'failed').length;

  // Best seller service with counts
  const serviceCounts: Record<string, { count: number; category: string }> = {};
  orders.forEach(o => {
    if (!serviceCounts[o.service_name]) {
      serviceCounts[o.service_name] = { count: 0, category: o.category };
    }
    serviceCounts[o.service_name].count += 1;
  });
  const bestSellerEntry = Object.entries(serviceCounts).sort((a, b) => b[1].count - a[1].count)[0];
  const bestSellerName = bestSellerEntry?.[0] || 'Belum ada data';
  const bestSellerCount = bestSellerEntry?.[1].count || 0;
  const bestSellerCategory = bestSellerEntry?.[1].category || '';

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
        <div className="max-w-[95%] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight">
              Buzz<span className="text-indigo-400">ify</span> <span className="text-xs bg-indigo-500 text-white font-extrabold px-1.5 py-0.5 rounded-md uppercase ml-1">Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {providerBalance !== null && (
              <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold px-3 py-2 rounded-xl border border-amber-500/20 text-xs tracking-tight shadow-inner flex items-center gap-1.5" title="Saldo BuzzerPanel">
                <Wallet className="w-3.5 h-3.5" />
                <span>BuzzerPanel: {formatPrice(parseInt(providerBalance))}</span>
              </div>
            )}
            {medanpediaBalance !== null && (
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold px-3 py-2 rounded-xl border border-emerald-500/20 text-xs tracking-tight shadow-inner flex items-center gap-1.5" title="Saldo MedanPedia">
                <Wallet className="w-3.5 h-3.5" />
                <span>MedanPedia: {formatPrice(parseInt(medanpediaBalance))}</span>
              </div>
            )}
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
      <main className="max-w-[95%] xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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
          <button
            onClick={() => {
              setActiveTab('landing');
              fetchLandingSettings();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'landing'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Award className="w-4 h-4 text-purple-400" />
            <span>Landing Page</span>
          </button>
        </div>

        {/* Tab 1: Orders Management */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
              
              {/* Stats Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Card 1: Omset */}
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
                  <div className="min-w-0">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Total Omset (Sales)</span>
                    <span className="text-2xl font-extrabold text-slate-100 tracking-tight block">{formatPrice(totalSales)}</span>
                    <span className="text-[10px] text-indigo-400 font-semibold block mt-1.5 bg-indigo-500/10 px-2 py-0.5 rounded-lg w-fit border border-indigo-500/10">
                      💸 {paidOrders.length} Pesanan Lunas
                    </span>
                  </div>
                  <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20 text-indigo-400 shrink-0 self-start group-hover:scale-110 transition-transform duration-300">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 2: Profit */}
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
                  <div className="min-w-0">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Estimasi Profit Bersih</span>
                    <span className="text-2xl font-extrabold text-emerald-400 tracking-tight block">{formatPrice(totalProfit)}</span>
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-[10px] text-slate-400 font-light block">
                        Margin Keuntungan: <strong className="text-emerald-400">~{profitMarginPercent}%</strong>
                      </span>
                      <span className="text-[9px] text-slate-500 font-light block">
                        Modal Pusat: {formatPrice(totalCost)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400 shrink-0 self-start group-hover:scale-110 transition-transform duration-300">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 3: Orders Count */}
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-purple-500/30 hover:bg-slate-900/60 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
                  <div className="min-w-0">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Total Orderan Masuk</span>
                    <span className="text-2xl font-extrabold text-slate-100 tracking-tight block">{orders.length} Order</span>
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <span className="text-[8px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/10">
                        {successCount} Sukses
                      </span>
                      <span className="text-[8px] bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/10">
                        {pendingCount + processingCount} Proses
                      </span>
                      <span className="text-[8px] bg-red-500/15 text-red-600 dark:text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/10">
                        {failedCount} Gagal
                      </span>
                    </div>
                  </div>
                  <div className="bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20 text-purple-400 shrink-0 self-start group-hover:scale-110 transition-transform duration-300">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                </div>

                {/* Card 4: Best Seller */}
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-amber-500/30 hover:bg-slate-900/60 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
                  <div className="min-w-0 flex-1 pr-3">
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Layanan Terlaris</span>
                    <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 block truncate leading-tight" title={bestSellerName}>
                      {bestSellerName}
                    </span>
                    {bestSellerCount > 0 ? (
                      <span className="text-[10px] text-slate-450 font-light block mt-1.5">
                        Dipesan <strong className="text-amber-600 dark:text-amber-300 font-bold">{bestSellerCount} kali</strong> ({bestSellerCategory})
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-light block mt-1.5">Belum ada orderan</span>
                    )}
                  </div>
                  <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 self-start group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
              </div>
            
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-850 p-6 rounded-3xl backdrop-blur-md">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari Order ID, Layanan, atau URL..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 pl-11 pr-4 py-3 rounded-2xl outline-none transition-all text-sm shadow-inner"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'processing', 'inprogress', 'success', 'partial', 'failed'].map(status => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-4 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                      orderStatusFilter === status
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/30'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-250 border border-slate-900'
                    }`}
                  >
                    {status === 'all' ? 'Semua' : (status === 'failed' ? 'error' : status)}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-slate-900/40 border border-slate-850 rounded-3xl overflow-hidden backdrop-blur-md">
              {filteredOrders.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm font-light">Belum ada orderan masuk.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider bg-slate-950/40">
                          <th className="py-3.5 px-4">
                            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-400" /> User</span>
                          </th>
                          <th className="py-3.5 px-3">
                            <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-indigo-400" /> Order ID</span>
                          </th>
                          <th className="py-3.5 px-3">
                            <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-indigo-400" /> Layanan</span>
                          </th>
                          <th className="py-3.5 px-3">
                            <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5 text-indigo-400" /> Target URL</span>
                          </th>
                          <th className="py-3.5 px-3 text-right">Jumlah</th>
                          <th className="py-3.5 px-3 text-right">Total Harga</th>
                          <th className="py-3.5 px-3 text-right">Start Count</th>
                          <th className="py-3.5 px-3">
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> Tanggal Masuk</span>
                          </th>
                          <th className="py-3.5 px-4 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/40">
                        {filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage).map(order => (
                          <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white shadow-md shrink-0">
                                  {(order.profiles?.email || 'U')[0].toUpperCase()}
                                </div>
                                <span className="font-semibold text-slate-250 tracking-tight text-xs truncate max-w-[120px]" title={order.profiles?.email || 'User/Simulated'}>
                                  {order.profiles?.email || 'User/Simulated'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <span className="font-mono text-slate-350 font-bold bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-lg text-[9px] w-fit flex items-center gap-1">
                                {order.id.slice(0, 8)}
                              </span>
                              <div className="flex gap-1 mt-1.5">
                                {/* Payment Status badge */}
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border ${
                                  order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                  order.payment_status === 'refunded' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                  'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {order.payment_status}
                                </span>
                                {/* Process Status badge */}
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border ${
                                  order.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' :
                                  order.status === 'inprogress' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25' :
                                  order.status === 'processing' ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' :
                                  order.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/25' :
                                  order.status === 'partial' ? 'bg-orange-500/10 text-orange-400 border-orange-500/25' :
                                  'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                }`}>
                                  {order.status === 'failed' ? 'error' : order.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-3 font-semibold text-slate-200">
                              <div className="flex flex-col gap-1 max-w-[160px]">
                                <span className="font-bold text-slate-200 text-xs truncate" title={order.service_name}>{order.service_name}</span>
                                <span className={`px-1.5 py-0.5 rounded-md font-extrabold text-[8px] uppercase tracking-wider border w-fit ${
                                  order.category.toLowerCase() === 'instagram' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                                  order.category.toLowerCase() === 'tiktok' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                  order.category.toLowerCase() === 'youtube' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  order.category.toLowerCase() === 'twitter/x' ? 'bg-slate-900 text-slate-300 border-slate-800' :
                                  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                }`}>
                                  {order.category}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-3 font-mono text-slate-400 max-w-xs">
                              <div className="flex items-center gap-1">
                                <a href={order.target_url} target="_blank" rel="noreferrer" className="hover:text-indigo-400 hover:underline truncate max-w-[110px] inline-block text-[11px]">
                                  {order.target_url.replace('https://', '').replace('www.', '')}
                                </a>
                                <ExternalLink className="w-3 h-3 text-slate-500 inline shrink-0" />
                              </div>
                            </td>
                            <td className="py-4 px-3 text-right font-semibold text-slate-200 whitespace-nowrap">{order.quantity.toLocaleString()}</td>
                            <td className="py-4 px-3 text-right font-extrabold text-indigo-400 whitespace-nowrap">{formatPrice(order.total_price)}</td>
                            <td className="py-4 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                              {order.start_count || 0}
                            </td>
                            <td className="py-4 px-3 text-slate-400 whitespace-nowrap">
                              <span>
                                {new Date(order.created_at).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }).replace('.', ':')}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {updatingOrderId === order.id ? (
                                <div className="flex flex-col gap-2.5 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl w-48 mx-auto text-left shadow-xl">
                                  {orderStatusSelect === 'pending' && (
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jumlah Awal</label>
                                      <input
                                        type="number"
                                        value={orderStartCountInput}
                                        onChange={(e) => setOrderStartCountInput(parseInt(e.target.value) || 0)}
                                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2 py-1 rounded outline-none text-xs"
                                      />
                                    </div>
                                  )}
                                  <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Progres</label>
                                    <select
                                      value={orderStatusSelect}
                                      onChange={(e) => {
                                        const nextStatus = e.target.value;
                                        setOrderStatusSelect(nextStatus as any);
                                        if (nextStatus === 'failed') {
                                          setCustomRefundInput(String(order.total_price));
                                        } else if (nextStatus === 'partial') {
                                          setCustomRefundInput('0');
                                        } else {
                                          setCustomRefundInput('0');
                                        }
                                      }}
                                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2 py-1 rounded outline-none text-xs"
                                    >
                                      <option value="pending">pending</option>
                                      <option value="processing">processing</option>
                                      <option value="inprogress">inprogress</option>
                                      <option value="success">success</option>
                                      <option value="partial">partial</option>
                                      <option value="failed">failed (error)</option>
                                    </select>
                                  </div>
                                  {orderStatusSelect === 'partial' && (
                                    <div>
                                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Jumlah Sisa (Remains)</label>
                                      <input
                                        type="number"
                                        placeholder="Sisa yg gagal kirim..."
                                        onChange={(e) => {
                                          const remains = parseFloat(e.target.value) || 0;
                                          const quantity = order.quantity || 1;
                                          const calculatedRefund = Math.min((remains / quantity) * order.total_price, order.total_price);
                                          setCustomRefundInput(String(Math.round(calculatedRefund)));
                                        }}
                                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2 py-1 rounded outline-none text-xs"
                                      />
                                    </div>
                                  )}
                                  {(orderStatusSelect === 'failed' || orderStatusSelect === 'partial') && (
                                    <div>
                                      <label className="text-[9px] font-bold text-red-400 uppercase tracking-wider block mb-1">Jumlah Refund (IDR)</label>
                                      <input
                                        type="number"
                                        value={customRefundInput}
                                        onChange={(e) => setCustomRefundInput(e.target.value)}
                                        placeholder="Jumlah refund..."
                                        className="w-full bg-slate-900 border border-red-500/30 focus:border-red-500 text-slate-200 px-2 py-1 rounded outline-none text-xs"
                                      />
                                      <span className="text-[8px] text-slate-500 mt-0.5 block font-light">Max: {formatPrice(order.total_price)}</span>
                                    </div>
                                  )}
                                  <div className="flex gap-1.5 mt-1.5">
                                    <button
                                      onClick={() => handleSaveOrderUpdate(order.id)}
                                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                      Simpan
                                    </button>
                                    <button
                                      onClick={() => setUpdatingOrderId(null)}
                                      className="px-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-[10px] cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              ) : order.status === 'success' || order.status === 'failed' ? (
                                <span className="text-slate-500 font-mono">-</span>
                              ) : (
                                <div className="flex flex-col gap-1.5 justify-center items-center">
                                  {order.status === 'pending' && (() => {
                                    const service = services.find(s => s.id === order.service_id);
                                    const isProvider = !!(service && service.provider_id && service.provider_id !== 'manual' && service.provider_service_id);
                                    if (isProvider) {
                                      return (
                                        <button
                                          onClick={() => handleRetryProvider(order.id)}
                                          disabled={retryingOrderId === order.id}
                                          className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/20 font-extrabold cursor-pointer transition-all active:scale-95 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                                        >
                                          <Zap className={`w-3 h-3 ${retryingOrderId === order.id ? 'animate-spin' : ''}`} />
                                          {retryingOrderId === order.id ? 'Mengirim...' : 'Kirim ke Provider'}
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}
                                  <button
                                    onClick={() => openOrderEditor(order)}
                                    className="inline-flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3.5 py-1.5 rounded-xl border border-indigo-500/20 font-extrabold cursor-pointer transition-all active:scale-95 text-[10px] w-full justify-center"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    Atur Progres
                                  </button>
                                </div>
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
          <div className="space-y-8">
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
                    rows={8}
                    className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 text-slate-300 px-5 py-4 rounded-2xl outline-none text-xs font-sans leading-relaxed tracking-wide resize-y min-h-[180px] focus:ring-1 focus:ring-indigo-500/20"
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

                <div className="border-t border-slate-850 pt-4 mt-4 space-y-4">
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Integrasi Provider Pusat</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Provider Pusat</label>
                    <select
                      value={providerId}
                      onChange={(e) => {
                        setProviderId(e.target.value);
                        setProviderServicesList([]);
                        setProviderError(null);
                        setProviderServiceId('');
                        setProviderPrice(0);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                    >
                      <option value="manual">Manual (Tanpa Provider)</option>
                      <option value="buzzerpanel">BuzzerPanel</option>
                      <option value="medanpedia">MedanPedia</option>
                    </select>
                  </div>

                  {(providerId === 'buzzerpanel' || providerId === 'medanpedia') && (
                    <div className="space-y-3 bg-slate-950/50 p-4 rounded-2xl border border-slate-850">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Layanan Pusat</span>
                        <button
                          type="button"
                          disabled={loadingProviderServices}
                          onClick={fetchProviderServices}
                          className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-lg transition-all font-semibold"
                        >
                          {loadingProviderServices ? 'Memuat...' : 'Muat Layanan Pusat'}
                        </button>
                      </div>

                      {providerError && (
                        <div className="text-[10px] text-red-400 bg-red-950/20 border border-red-500/20 p-2.5 rounded-xl font-light">
                          {providerError}
                        </div>
                      )}

                      {providerServicesList.length > 0 && (() => {
                        const uniqueProviderCategories = Array.from(new Set(providerServicesList.map(s => s?.category).filter(Boolean))) as string[];
                        const filteredProviderServices = providerServicesList.filter(s => {
                          if (!s) return false;
                          
                          // Bypas kategori jika pencarian adalah angka (ID) agar bisa dicari secara global
                          const isNumericSearch = /^\d+$/.test(providerSearch.trim());
                          if (isNumericSearch && String(s.id).includes(providerSearch.trim())) {
                            return true;
                          }

                          const nameMatch = (s.name || '').toLowerCase().includes(providerSearch.toLowerCase());
                          const idMatch = String(s.id).includes(providerSearch);
                          const catMatch = (s.category || '').toLowerCase().includes(providerSearch.toLowerCase());
                          const matchesSearch = nameMatch || idMatch || catMatch;
                          const matchesCategory = providerCategoryFilter === 'all' || s.category === providerCategoryFilter;
                          return matchesSearch && matchesCategory;
                        });

                        return (
                          <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cari Nama/ID</label>
                                <input
                                  type="text"
                                  placeholder="Contoh: Followers..."
                                  value={providerSearch}
                                  onChange={(e) => setProviderSearch(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2.5 py-1.5 rounded-lg outline-none text-[11px]"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter Kategori</label>
                                <input
                                  type="text"
                                  placeholder="Cari kategori..."
                                  value={providerCategorySearch}
                                  onChange={(e) => {
                                    const q = e.target.value;
                                    setProviderCategorySearch(q);
                                    // Pilih otomatis kategori pertama yang cocok
                                    const matched = uniqueProviderCategories.find(c => c.toLowerCase().includes(q.toLowerCase()));
                                    if (matched) {
                                      setProviderCategoryFilter(matched);
                                    }
                                  }}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2.5 py-1.5 rounded-lg outline-none text-[11px]"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori Pusat</label>
                                <select
                                  value={providerCategoryFilter}
                                  onChange={(e) => setProviderCategoryFilter(e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-2.5 py-1.5 rounded-lg outline-none text-[11px]"
                                >
                                  <option value="all">Semua Kategori</option>
                                  {uniqueProviderCategories
                                    .filter(cat => cat.toLowerCase().includes(providerCategorySearch.toLowerCase()))
                                    .map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pilih Layanan ({filteredProviderServices.length} ditemukan{filteredProviderServices.length > 100 ? ', menampilkan 100 teratas' : ''})</label>
                                {(providerSearch || providerCategoryFilter !== 'all' || providerCategorySearch) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProviderSearch('');
                                      setProviderCategoryFilter('all');
                                      setProviderCategorySearch('');
                                    }}
                                    className="text-[9px] text-indigo-400 hover:text-indigo-300 font-semibold"
                                  >
                                    Reset Filter
                                  </button>
                                )}
                              </div>
                              <select
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  const selected = providerServicesList.find(s => String(s.id) === val);
                                  if (selected) {
                                    setProviderServiceId(String(selected.id));
                                    setProviderPrice(parseFloat(selected.price));
                                    setServiceName(selected.name);
                                    setServicePrice(Math.round(parseFloat(selected.price) * 1.5)); // Default markup +50%
                                    setServiceMin(selected.min);
                                    setServiceMax(selected.max);
                                    let rawDesc = selected.note || selected.description || selected.desc || selected.details || '';
                                    
                                    // Memperbaiki masalah enkoding karakter emoji (double-encoded UTF-8 seperti "å" menjadi emoji asli)
                                    try {
                                      rawDesc = decodeURIComponent(escape(rawDesc));
                                    } catch (e) {
                                      // Abaikan jika gagal
                                    }

                                    // Bersihkan tag HTML agar menjadi teks biasa yang rapi
                                    rawDesc = rawDesc
                                      .replace(/<br\s*\/?>/gi, '\n')
                                      .replace(/<\/p>/gi, '\n')
                                      .replace(/<p[^>]*>/gi, '')
                                      .replace(/<[^>]*>/g, '')
                                      .replace(/&nbsp;/g, ' ')
                                      .replace(/&amp;/g, '&')
                                      .replace(/&lt;/g, '<')
                                      .replace(/&gt;/g, '>')
                                      .replace(/\n\s*\n+/g, '\n\n') // Satukan newline berlebih
                                      .trim();
                                    setServiceDescription(rawDesc);
                                    
                                    // Auto set average duration if returned by provider
                                    const avgTime = selected.average_time || selected.average_duration || selected.time;
                                    if (avgTime) {
                                      setAverageDuration(avgTime);
                                    } else {
                                      setAverageDuration('15 Menit');
                                    }
                                    // Auto set category if matches
                                    if (selected.category) {
                                      const catLower = selected.category.toLowerCase();
                                      if (catLower.includes('instagram')) setServiceCategory('Instagram');
                                      else if (catLower.includes('tiktok')) setServiceCategory('TikTok');
                                      else if (catLower.includes('youtube')) setServiceCategory('YouTube');
                                      else if (catLower.includes('twitter') || catLower.includes('x')) setServiceCategory('Twitter/X');
                                      else setServiceCategory(selected.category);
                                    }
                                  }
                                }}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-3 py-2 rounded-xl outline-none text-xs"
                              >
                                <option value="">-- Klik untuk memilih --</option>
                                {filteredProviderServices.slice(0, 100).map((ps: any) => (ps && (
                                  <option key={ps.id} value={ps.id}>
                                    [{ps.id}] {ps.category} - {ps.name} (Rp {parseFloat(ps.price).toLocaleString()})
                                  </option>
                                )))}
                              </select>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {providerId !== 'manual' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">ID Layanan Provider</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: 140"
                          value={providerServiceId}
                          onChange={(e) => setProviderServiceId(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Harga Modal (1K)</label>
                        <input
                          type="number"
                          required
                          placeholder="Harga beli"
                          value={providerPrice || ''}
                          onChange={(e) => setProviderPrice(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                        />
                      </div>
                    </div>
                  )}
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

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">⏱️ Rata-Rata Durasi Proses</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 15 Menit, 1 Jam, dll."
                    value={averageDuration}
                    onChange={(e) => setAverageDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Icon Layanan (Opsional)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setServiceIcon(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="service-icon-upload"
                    />
                    <label
                      htmlFor="service-icon-upload"
                      className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-350 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition-all inline-block hover:text-white"
                    >
                      Pilih File Gambar
                    </label>
                    {serviceIcon && (
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={serviceIcon} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setServiceIcon('')}
                          className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-red-500 font-bold text-xs transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    )}
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
                        setProviderId('manual');
                        setProviderServiceId('');
                        setProviderPrice(0);
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
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider">Daftar Layanan Tersedia</h3>
                <div className="space-y-4">
                  {services.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">Belum ada layanan di input.</div>
                  ) : (
                    services.slice((servicesPage - 1) * servicesPerPage, servicesPage * servicesPerPage).map(service => {
                      const categoryLower = service.category.toLowerCase();
                      const categoryBadge = 
                        categoryLower === 'instagram' ? 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-400 border-pink-500/20' :
                        categoryLower === 'tiktok' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        categoryLower === 'youtube' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-slate-800/50 text-slate-300 border-slate-700/50';

                      const serviceIconUrl = categoryIconMap[service.category] || service.icon_url;

                      return (
                        <div 
                          key={service.id} 
                          className="bg-slate-950/40 border border-slate-850 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-950/10 transition-all duration-300 p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs group"
                        >
                          <div className="flex items-start sm:items-center gap-3.5 flex-1">
                            {serviceIconUrl ? (
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-850 flex items-center justify-center shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={serviceIconUrl} alt="icon" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/80 to-purple-600/80 flex items-center justify-center shrink-0 text-white font-extrabold text-xs shadow-md border border-indigo-500/20">
                                {service.category[0].toUpperCase()}
                              </div>
                            )}

                             <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-lg font-extrabold text-[9px] uppercase tracking-wider border ${categoryBadge}`}>
                                  {service.category}
                                </span>
                                <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-650 dark:group-hover:text-white transition-colors">
                                  {service.name}
                                </span>
                              </div>
                            
                            <div className="text-slate-600 dark:text-slate-400 font-light flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                              <span className="flex items-center gap-1">
                                <span className="text-slate-500">Min:</span> <strong className="text-slate-700 dark:text-slate-305">{service.min_order.toLocaleString()}</strong>
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="flex items-center gap-1">
                                <span className="text-slate-500">Max:</span> <strong className="text-slate-700 dark:text-slate-305">{service.max_order.toLocaleString()}</strong>
                              </span>
                              {service.created_at && (
                                <>
                                  <span className="text-slate-300 dark:text-slate-700">•</span>
                                  <span className="text-slate-500">
                                    Dibuat: {new Date(service.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                  </span>
                                </>
                              )}
                            </div>

                            {service.description && (
                              <button
                                type="button"
                                onClick={() => setExpandedServices(prev => ({ ...prev, [service.id]: !prev[service.id] }))}
                                className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold mt-2.5 flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>{expandedServices[service.id] ? 'Sembunyikan Deskripsi' : 'Lihat Deskripsi'}</span>
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedServices[service.id] ? 'rotate-180' : ''}`} />
                              </button>
                            )}

                            {service.description && expandedServices[service.id] && (
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-2.5 bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-200 dark:border-slate-850/60 max-w-xl font-light leading-relaxed whitespace-pre-wrap select-text animate-in fade-in slide-in-from-top-2 duration-250">
                                <span className="block font-bold text-[9px] text-indigo-650 dark:text-indigo-400/80 uppercase tracking-wider mb-1">Deskripsi Detail:</span>
                                <div className="text-slate-700 dark:text-slate-300">{service.description}</div>
                              </div>
                            )}
                          </div>
                        </div>

                          <div className="flex sm:flex-col items-end gap-3 sm:gap-2 justify-between sm:justify-center border-t sm:border-t-0 border-slate-900 pt-3 sm:pt-0 shrink-0">
                            <div className="bg-indigo-500/10 text-indigo-400 font-extrabold px-3 py-1.5 rounded-xl border border-indigo-500/20 text-sm tracking-tight whitespace-nowrap shadow-inner">
                              {formatPrice(service.price_per_k)}
                            </div>
                             <div className="flex gap-2">
                              <button
                                onClick={() => handleToggleRecommend(service)}
                                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                  service.is_recommended
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    : 'bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350 dark:hover:text-slate-300'
                                }`}
                                title={service.is_recommended ? "Hapus Rekomendasi" : "Jadikan Rekomendasi"}
                              >
                                <Star className={`w-3.5 h-3.5 ${service.is_recommended ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={() => startEditService(service)}
                                className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl transition-colors cursor-pointer"
                                title="Edit Layanan"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteService(service.id)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-colors cursor-pointer"
                                title="Hapus Layanan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Services Pagination */}
              {Math.ceil(services.length / servicesPerPage) > 1 && (
                <div className="flex items-center justify-between border-t border-slate-850/80 bg-slate-900/10 pt-4 mt-6">
                  <div className="text-xs text-slate-400">
                    Menampilkan <span className="font-semibold text-slate-350">{((servicesPage - 1) * servicesPerPage) + 1}</span> - <span className="font-semibold text-slate-350">{Math.min(servicesPage * servicesPerPage, services.length)}</span> dari <span className="font-semibold text-slate-350">{services.length}</span> layanan
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={servicesPage === 1}
                      onClick={() => setServicesPage(p => Math.max(1, p - 1))}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 border border-slate-850 text-xs transition-all active:scale-95 disabled:pointer-events-none cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <button
                      disabled={servicesPage === Math.ceil(services.length / servicesPerPage)}
                      onClick={() => setServicesPage(p => Math.min(Math.ceil(services.length / servicesPerPage), p + 1))}
                      className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 border border-slate-850 text-xs transition-all active:scale-95 disabled:pointer-events-none cursor-pointer"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
            
            {/* Provider Price Matcher */}
            <div className="bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
              <h3 className="font-bold text-base text-slate-200 mb-2 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-400" />
                <span>Pembanding Harga Layanan Pusat (Real-Time Price Matcher)</span>
              </h3>
              <p className="text-slate-400 text-xs mb-6 font-light">
                Cari kata kunci layanan (misal: "Instagram Followers") untuk membandingkan harga modal antara <strong>BuzzerPanel</strong> dan <strong>MedanPedia</strong> secara berdampingan.
              </p>

              <form onSubmit={handleCompareServices} className="flex gap-3 mb-6 max-w-xl">
                <input
                  type="text"
                  required
                  placeholder="Ketik nama layanan, misal: Followers Indo..."
                  value={comparisonKeyword}
                  onChange={(e) => setComparisonKeyword(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-250 px-4 py-3 rounded-2xl outline-none text-xs"
                />
                <button
                  type="submit"
                  disabled={loadingComparison}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {loadingComparison ? 'Membandingkan...' : 'Bandingkan Harga'}
                </button>
              </form>

              {comparisonResults && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* BuzzerPanel results */}
                  <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                      <span className="font-bold text-xs text-slate-250 uppercase tracking-wider">Hasil BuzzerPanel</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 font-extrabold px-2 py-0.5 rounded-md border border-amber-500/25">
                        {comparisonResults.buzzerpanel.length} Ditemukan
                      </span>
                    </div>

                    {comparisonResults.buzzerpanel.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs font-light">Tidak ada layanan yang cocok.</div>
                    ) : (
                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                        {comparisonResults.buzzerpanel.map((s: any) => {
                          const avgTime = s.average_time || s.average || s.time || s.averageTime || s.average_duration;
                          return (
                            <div key={s.id} className="bg-slate-900/30 border border-slate-850/60 p-3.5 rounded-xl flex items-center justify-between text-xs hover:border-slate-800 transition-all">
                              <div className="min-w-0 pr-3">
                                <span className="font-semibold text-slate-250 block truncate" title={s.name}>[{s.id}] {s.name}</span>
                                <div className="flex gap-2 items-center mt-0.5">
                                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">{s.category}</span>
                                  {avgTime && (
                                    <span className="text-[9px] text-slate-400 font-light flex items-center gap-0.5" title="Rata-rata waktu pengerjaan">
                                      ⏱️ {avgTime}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="font-extrabold text-amber-400 shrink-0 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10">
                                {formatPrice(parseFloat(s.price))}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* MedanPedia results */}
                  <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                      <span className="font-bold text-xs text-slate-250 uppercase tracking-wider">Hasil MedanPedia</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-0.5 rounded-md border border-emerald-500/25">
                        {comparisonResults.medanpedia.length} Ditemukan
                      </span>
                    </div>

                    {comparisonResults.medanpedia.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs font-light">Tidak ada layanan yang cocok.</div>
                    ) : (
                      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                        {comparisonResults.medanpedia.map((s: any) => {
                          const similarBp = comparisonResults.buzzerpanel.find(b => 
                            (b.name || '').toLowerCase() === (s.name || '').toLowerCase() ||
                            (s.name || '').toLowerCase().includes(b.name || ''.toLowerCase())
                          );
                          const isCheaper = similarBp ? parseFloat(s.price) < parseFloat(similarBp.price) : false;
                          const avgTime = s.average_time || s.average || s.time || s.averageTime || s.average_duration;

                          return (
                            <div key={s.id} className={`p-3.5 rounded-xl flex items-center justify-between text-xs hover:border-slate-800 transition-all border ${
                              isCheaper ? 'bg-emerald-950/10 border-emerald-500/20' : 'bg-slate-900/30 border-slate-850/60'
                            }`}>
                              <div className="min-w-0 pr-3">
                                <span className="font-semibold text-slate-250 block truncate" title={s.name}>
                                  [{s.id}] {s.name}
                                  {isCheaper && <span className="text-[9px] bg-emerald-500 text-white font-extrabold px-1.5 py-0.5 rounded ml-1.5 uppercase tracking-wide">Lebih Murah!</span>}
                                </span>
                                <div className="flex gap-2 items-center mt-0.5">
                                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">{s.category}</span>
                                  {avgTime && (
                                    <span className="text-[9px] text-slate-400 font-light flex items-center gap-0.5" title="Rata-rata waktu pengerjaan">
                                      ⏱️ {avgTime}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`font-extrabold shrink-0 px-2 py-1 rounded border ${
                                isCheaper ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
                              }`}>
                                {formatPrice(parseFloat(s.price))}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
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

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Upload Banner / Gambar (Opsional)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAnnImageUrl(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="announcement-banner-upload"
                    />
                    <label
                      htmlFor="announcement-banner-upload"
                      className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-350 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition-all inline-block hover:text-white"
                    >
                      Pilih File Banner
                    </label>
                    {annImageUrl && (
                      <button
                        type="button"
                        onClick={() => setAnnImageUrl('')}
                        className="text-xs text-red-500 hover:text-red-400 font-bold cursor-pointer"
                      >
                        Hapus Gambar
                      </button>
                    )}
                  </div>
                  {annImageUrl && (
                    <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={annImageUrl} alt="Preview Banner" className="w-full h-full object-cover" />
                    </div>
                  )}
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
                {(() => {
                  const filteredUsers = userProfiles.filter(prof => 
                    (prof.email || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                    prof.id.toLowerCase().includes(userSearchTerm.toLowerCase())
                  );
                  
                  if (filteredUsers.length === 0) {
                    return <div className="py-8 text-center text-slate-500 text-xs">Tidak ada user ditemukan.</div>;
                  }

                  return (
                    <>
                      {filteredUsers
                        .slice((usersPage - 1) * 10, usersPage * 10)
                        .map(prof => (
                          <div key={prof.id} className="py-3.5 flex justify-between items-center gap-2 text-xs">
                            <div className="truncate">
                              <span className="font-bold text-slate-250 block truncate">{prof.email}</span>
                              <span className="text-[10px] text-slate-550 font-mono block mt-0.5">{prof.id.slice(0, 8)}</span>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-extrabold text-indigo-400 block">{formatPrice(prof.balance || 0)}</span>
                              <span className="text-[9px] text-slate-500 uppercase tracking-wider block mt-0.5">{prof.role}</span>
                            </div>
                          </div>
                        ))}
                      
                      {filteredUsers.length > 10 && (
                        <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-850 mt-3 shrink-0">
                          <button
                            type="button"
                            disabled={usersPage === 1}
                            onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-850 text-slate-350 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Sebelumnya
                          </button>
                          <span className="text-[10px] text-slate-500 font-medium">Hal {usersPage} dari {Math.ceil(filteredUsers.length / 10)}</span>
                          <button
                            type="button"
                            disabled={usersPage >= Math.ceil(filteredUsers.length / 10)}
                            onClick={() => setUsersPage(prev => prev + 1)}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-855 hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-855 text-slate-350 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            Selanjutnya
                          </button>
                        </div>
                      )}
                    </>
                  );
                })()}
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
                                <span className="text-[9px] text-slate-555 font-mono block mt-0.5">{tx.id.slice(0, 8)}</span>
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

        {/* Tab 5: Landing Page settings */}
        {activeTab === 'landing' && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md max-w-4xl mx-auto">
            <h3 className="font-bold text-base text-slate-250 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <span>Pengaturan Landing Page</span>
            </h3>

            {loadingLandingSettings ? (
              <div className="py-12 text-center text-slate-400">Loading settings...</div>
            ) : (
              <form onSubmit={handleSaveLandingSettings} className="space-y-6">
                
                {/* Hero Section settings */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                  <h4 className="font-bold text-sm text-indigo-400 border-b border-slate-900 pb-2">Hero Section</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Hero Badge Text</label>
                    <input
                      type="text"
                      value={landingSettings.hero_badge || ''}
                      onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_badge: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                      placeholder="e.g. Platform Buzzer Terpercaya & Tercepat di Indonesia"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2">Hero Title Heading (Gunakan **kata** untuk teks gradient)</label>
                    <input
                      type="text"
                      value={landingSettings.hero_title || ''}
                      onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                      placeholder="e.g. Tingkatkan **Popularitas Medsos** Anda dengan Proses Cepat!"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Hero Subtitle</label>
                    <textarea
                      value={landingSettings.hero_subtitle || ''}
                      onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs resize-none"
                      placeholder="e.g. Deskripsi singkat platform Anda..."
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Hero CTA Button Text</label>
                      <input
                        type="text"
                        value={landingSettings.hero_cta_text || ''}
                        onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_cta_text: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2">Hero Secondary Button Text</label>
                      <input
                        type="text"
                        value={landingSettings.hero_cta_sub_text || ''}
                        onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_cta_sub_text: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Statistics settings */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                  <h4 className="font-bold text-sm text-indigo-400 border-b border-slate-900 pb-2">Angka Statistik (Stats Counters)</h4>
                  
                  <div className="grid sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Pesanan Sukses</label>
                      <input
                        type="text"
                        value={landingSettings.stats_orders || ''}
                        onChange={(e) => setLandingSettings(prev => ({ ...prev, stats_orders: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-3 py-2.5 rounded-xl outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Pelanggan Aktif</label>
                      <input
                        type="text"
                        value={landingSettings.stats_clients || ''}
                        onChange={(e) => setLandingSettings(prev => ({ ...prev, stats_clients: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-3 py-2.5 rounded-xl outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Keberhasilan</label>
                      <input
                        type="text"
                        value={landingSettings.stats_success || ''}
                        onChange={(e) => setLandingSettings(prev => ({ ...prev, stats_success: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-3 py-2.5 rounded-xl outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2">Kecepatan</label>
                      <input
                        type="text"
                        value={landingSettings.stats_speed || ''}
                        onChange={(e) => setLandingSettings(prev => ({ ...prev, stats_speed: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-3 py-2.5 rounded-xl outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Informasi Tambahan per Kategori */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                  <h4 className="font-bold text-sm text-indigo-400 border-b border-slate-900 pb-2">Informasi Tambahan per Kategori (Form Pemesanan)</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Pilih Kategori</label>
                    <select
                      value={selectedWarningCategory}
                      onChange={(e) => setSelectedWarningCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-205 px-4 py-3 rounded-xl outline-none text-xs"
                    >
                      {Array.from(new Set(['Instagram', 'TikTok', 'YouTube', ...services.map(s => s.category)]))
                        .map(cat => (
                          <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                        ))
                      }
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Judul Peringatan / Info Tambahan</label>
                    <input
                      type="text"
                      value={landingSettings[`warning_title_${selectedWarningCategory}`] || ''}
                      onChange={(e) => setLandingSettings(prev => ({ ...prev, [`warning_title_${selectedWarningCategory}`]: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                      placeholder={`Contoh: Penting ${selectedWarningCategory.toUpperCase()}:`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Konten Peringatan (Gunakan **teks** untuk menebalkan kata)</label>
                    <textarea
                      value={landingSettings[`warning_desc_${selectedWarningCategory}`] || ''}
                      onChange={(e) => setLandingSettings(prev => ({ ...prev, [`warning_desc_${selectedWarningCategory}`]: e.target.value }))}
                      rows={6}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs resize-y"
                      placeholder="Masukkan deskripsi peringatan dan langkah-langkah di sini..."
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Gambar Ilustrasi/Contoh</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setLandingSettings(prev => ({ ...prev, [`warning_image_url_${selectedWarningCategory}`]: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="warning-image-upload"
                        />
                        <label
                          htmlFor="warning-image-upload"
                          className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-350 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition-all inline-block hover:text-white"
                        >
                          Pilih File Gambar
                        </label>
                        {landingSettings[`warning_image_url_${selectedWarningCategory}`] && (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={landingSettings[`warning_image_url_${selectedWarningCategory}`]}
                              alt="Warning Preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setLandingSettings(prev => ({ ...prev, [`warning_image_url_${selectedWarningCategory}`]: '' }))}
                              className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-all cursor-pointer"
                              title="Hapus gambar"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2">URL Video Panduan (Opsional)</label>
                      <input
                        type="text"
                        value={landingSettings[`warning_video_url_${selectedWarningCategory}`] || ''}
                        onChange={(e) => setLandingSettings(prev => ({ ...prev, [`warning_video_url_${selectedWarningCategory}`]: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                        placeholder="Contoh: https://youtube.com/watch?v=..."
                      />
                    </div>
                  </div>
                </div>

                {/* Pengaturan Deposit & Bonus */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                  <h4 className="font-bold text-sm text-indigo-400 border-b border-slate-900 pb-2">Pengaturan Deposit & Bonus</h4>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Minimal Deposit untuk Bonus (Rp)</label>
                      <input
                        type="number"
                        value={landingSettings.deposit_bonus_min || ''}
                        onChange={(e) => setLandingSettings(prev => ({ ...prev, deposit_bonus_min: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                        placeholder="Contoh: 10000"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Persentase Bonus Deposit (%)</label>
                      <input
                        type="number"
                        value={landingSettings.deposit_bonus_percent || ''}
                        onChange={(e) => setLandingSettings(prev => ({ ...prev, deposit_bonus_percent: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                        placeholder="Contoh: 11"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingLandingSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    {savingLandingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      {/* Premium confirmation modal for admin panel */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-2">Konfirmasi Tindakan</h4>
            <p className="text-xs text-slate-400 mb-6 font-light leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="flex-1 bg-slate-950 hover:bg-slate-900 text-slate-350 border border-slate-800 py-3 rounded-xl text-xs font-semibold transition-all active:scale-98 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, show: false }));
                }}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 active:scale-98 cursor-pointer"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
