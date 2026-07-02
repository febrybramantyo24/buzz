'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { dbClient as supabase } from '@/lib/db-client';
import { Service, Order, Announcement, Transaction } from '@/lib/types';
import PremiumThemeToggle from '@/components/PremiumThemeToggle';
import { useBrand } from '@/components/DynamicBrandProvider';
import {
  Zap,
  AlertCircle,
  LogOut,
  Settings,
  ShoppingBag,
  Plus,
  Loader2,
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
  Star,
  MessageSquare,
  Send,
  Upload,
  Pin,
  TrendingUp,
  Download
} from 'lucide-react';

const formatNumberWithDots = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === '') return '';
  // Parse as float first to handle "80000.00" correctly, then round
  const parsed = typeof num === 'number' ? num : parseFloat(String(num));
  if (isNaN(parsed) || parsed === 0) return '';
  const rounded = Math.round(parsed);
  return new Intl.NumberFormat('id-ID').format(rounded);
};

const parseNumberFromDots = (str: string): number => {
  const clean = str.replace(/\D/g, '');
  return parseInt(clean, 10) || 0;
};

// Clean raw provider descriptions: strip HTML, normalize caps, decode entities
const cleanProviderDescription = (raw: string): string => {
  if (!raw) return '';
  // Replace HTML line breaks with newlines
  let text = raw.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n');
  // Preserve links as "label (url)"
  text = text.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (_, href, label) => {
    const cleanLabel = label.replace(/<[^>]*>/g, '').trim();
    return cleanLabel && cleanLabel !== href ? `${cleanLabel} (${href})` : href;
  });
  // Strip remaining tags
  text = text.replace(/<[^>]*>/g, '');
  // Decode basic HTML entities
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  // Normalize all-caps lines to sentence case
  const lines = text.split('\n');
  const processed = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    const letters = trimmed.replace(/[^a-zA-Z]/g, '');
    const upperCount = letters.replace(/[^A-Z]/g, '').length;
    if (letters.length > 3 && upperCount / letters.length > 0.7) {
      return trimmed.split(/(?<=[.!?]\s+)/).map(sentence => {
        const s = sentence.trim();
        if (!s) return '';
        if (s.startsWith('http')) return s;
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      }).join(' ');
    }
    return trimmed;
  });
  return processed.filter((line, i, arr) => !(line === '' && arr[i - 1] === '')).join('\n').trim();
};

const getCategoryBadgeClass = (category: string): string => {
  const cat = category ? category.toLowerCase() : '';
  if (cat === 'instagram') return 'bg-pink-500/10 text-pink-500 dark:text-pink-400 border border-pink-500/20 backdrop-blur-md shadow-sm shadow-pink-500/5';
  if (cat === 'tiktok') return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 backdrop-blur-md shadow-sm shadow-cyan-500/5';
  if (cat === 'youtube') return 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 backdrop-blur-md shadow-sm shadow-red-500/5';
  if (cat === 'twitter/x' || cat === 'twitter' || cat === 'x') return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20 backdrop-blur-md shadow-sm';
  return 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md shadow-sm shadow-indigo-500/5';
};

const getAnnouncementBadgeClass = (badge: string): string => {
  const b = badge ? badge.toUpperCase() : '';
  if (b === 'HOT') return 'bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 backdrop-blur-md shadow-sm shadow-red-500/5';
  if (b === 'RECOMMENDED') return 'bg-indigo-500/10 text-indigo-550 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md shadow-sm shadow-indigo-500/5';
  if (b === 'DISCOUNT' || b === 'PROMO') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 backdrop-blur-md shadow-sm shadow-amber-500/5';
  return 'bg-slate-500/10 text-slate-600 dark:text-slate-450 border border-slate-500/20 backdrop-blur-md shadow-sm';
};

const getNumericId = (srv: any): string => {
  if (!srv) return '';
  const idStr = typeof srv === 'string' ? srv : (srv.provider_service_id || srv.id);
  if (!idStr) return '';
  if (/^\d+$/.test(idStr)) {
    return idStr;
  }
  const hexPart = String(idStr).split('-')[0].slice(0, 5);
  return String(parseInt(hexPart, 16) || idStr);
};

const getOrderStatusBadgeClass = (status: string): string => {
  const s = status ? status.toLowerCase() : '';
  if (s === 'success') return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white dark:!text-black font-extrabold shadow-sm shadow-emerald-500/30';
  if (s === 'inprogress') return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white dark:!text-black font-extrabold shadow-sm shadow-blue-500/30';
  if (s === 'processing') return 'bg-gradient-to-r from-sky-400 to-cyan-400 text-white dark:!text-black font-extrabold shadow-sm shadow-sky-400/30';
  if (s === 'failed' || s === 'error' || s === 'dibatalkan') return 'bg-gradient-to-r from-red-500 to-rose-600 text-white dark:!text-black font-extrabold shadow-sm shadow-rose-500/30';
  if (s === 'partial') return 'bg-gradient-to-r from-red-500 to-rose-600 text-white dark:!text-black font-extrabold shadow-sm shadow-rose-500/30';
  if (s === 'pending') return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white dark:!text-black font-extrabold shadow-sm shadow-amber-500/30';
  return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white dark:!text-black font-extrabold shadow-sm shadow-amber-500/30';
};

const getAdminDisplayStatus = (order: Order): string => {
  const pStatus = order.provider_status ? order.provider_status.toLowerCase() : '';
  if (pStatus === 'failed' || pStatus === 'canceled' || pStatus === 'error') {
    return 'failed';
  }
  if (pStatus === 'partial') {
    return 'partial';
  }
  return order.status;
};

const getPaymentStatusBadgeClass = (paymentStatus: string): string => {
  const ps = paymentStatus ? paymentStatus.toLowerCase() : '';
  if (ps === 'paid') return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white dark:!text-black font-extrabold shadow-sm shadow-emerald-500/30';
  if (ps === 'refunded') return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white dark:!text-black font-extrabold shadow-sm shadow-blue-500/30';
  if (ps === 'pending_refund') return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white dark:!text-black font-extrabold shadow-sm shadow-orange-550/30';
  return 'bg-gradient-to-r from-red-500 to-rose-600 text-white dark:!text-black font-extrabold shadow-sm shadow-rose-500/30'; // unpaid/default
};

const getTicketStatusBadgeClass = (status: string): string => {
  const s = status ? status.toLowerCase() : '';
  if (s === 'answered') return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold shadow-sm shadow-emerald-500/30';
  if (s === 'closed') return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white font-extrabold shadow-sm shadow-slate-600/30';
  return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/30';
};

export default function AdminDashboard() {
  const router = useRouter();
  const { logoUrl, brandName } = useBrand();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState<any[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<any[]>([]);



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
  const [statusFilterTransactions, setStatusFilterTransactions] = useState('all');
  const [typeFilterTransactions, setTypeFilterTransactions] = useState('all');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState('all');
  const [serviceProviderFilter, setServiceProviderFilter] = useState('all');

  // Pagination states
  const [ordersPage, setOrdersPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const itemsPerPage = 10;
  const servicesPerPage = 10;

  useEffect(() => {
    setOrdersPage(1);
  }, [orderSearch, orderStatusFilter]);

  useEffect(() => {
    setTransactionsPage(1);
  }, [searchTermTransactions, statusFilterTransactions, typeFilterTransactions]);

  useEffect(() => {
    setUsersPage(1);
  }, [userSearchTerm]);

  useEffect(() => {
    setServicesPage(1);
  }, [serviceSearch, serviceCategoryFilter, serviceProviderFilter]);

  // Derived filtered services states
  const filteredServicesList = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(serviceSearch.toLowerCase()) || 
                          String(service.id).includes(serviceSearch) ||
                          (service.provider_service_id && String(service.provider_service_id).includes(serviceSearch));
    
    const matchesCategory = serviceCategoryFilter === 'all' || service.category === serviceCategoryFilter;
    
    const matchesProvider = serviceProviderFilter === 'all' || 
                            (serviceProviderFilter === 'manual' && (!service.provider_id || service.provider_id === 'manual')) ||
                            (service.provider_id === serviceProviderFilter);
                            
    return matchesSearch && matchesCategory && matchesProvider;
  });

  const totalServicesPages = Math.ceil(filteredServicesList.length / servicesPerPage);
  const paginatedServices = filteredServicesList.slice((servicesPage - 1) * servicesPerPage, servicesPage * servicesPerPage);

  // Loading & Submitting status
  const [loading, setLoading] = useState(true);
  const [submittingService, setSubmittingService] = useState(false);
  const [submittingAnn, setSubmittingAnn] = useState(false);

  // User Balance Modification Modal State
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<any>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('add');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [submittingBalance, setSubmittingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Edit User Modal State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedEditUser, setSelectedEditUser] = useState<any>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [submittingEditUser, setSubmittingEditUser] = useState(false);
  const [editUserError, setEditUserError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'announcements' | 'transactions' | 'landing' | 'tickets' | 'users' | 'midtrans'>('orders');

  // Midtrans stats & transactions state
  const [midtransStats, setMidtransStats] = useState<any>({
    totalVolume: 0,
    pendingVolume: 0,
    failedVolume: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    totalCount: 0,
    todayVolume: 0,
    todayCount: 0,
    monthVolume: 0,
    monthCount: 0
  });
  const [midtransTransactions, setMidtransTransactions] = useState<any[]>([]);
  const [loadingMidtrans, setLoadingMidtrans] = useState(false);
  const [syncingMidtrans, setSyncingMidtrans] = useState(false);
  const [searchTermMidtrans, setSearchTermMidtrans] = useState('');
  const [statusFilterMidtrans, setStatusFilterMidtrans] = useState('all');
  const [midtransPage, setMidtransPage] = useState(1);

  const fetchMidtransData = async () => {
    setLoadingMidtrans(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/midtrans', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMidtransStats(data.stats);
        setMidtransTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error('Error fetching Midtrans data:', e);
    } finally {
      setLoadingMidtrans(false);
    }
  };

  const handleSyncMidtrans = async () => {
    setSyncingMidtrans(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/midtrans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Sinkronisasi selesai! ${data.syncedCount} transaksi berhasil disinkronkan.`);
        fetchMidtransData();
        fetchAdminData();
      } else {
        alert(data.error || 'Gagal mensinkronisasikan transaksi');
      }
    } catch (e: any) {
      console.error('Sync error:', e);
      alert('Terjadi kesalahan saat sinkronisasi: ' + e.message);
    } finally {
      setSyncingMidtrans(false);
    }
  };

  const changeTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    setSelectedOrderIds([]);
    setSelectedTicketIds([]);
    if (activeTab === 'midtrans') {
      fetchMidtransData();
    }
  }, [activeTab]);

  // Service Form State
  const [serviceCategory, setServiceCategory] = useState('Instagram');
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState<number | string>('');
  const [serviceMin, setServiceMin] = useState<number>(100);
  const [serviceMax, setServiceMax] = useState<number>(10000);
  const [serviceDescription, setServiceDescription] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceIcon, setServiceIcon] = useState('');
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const [showServiceFormModal, setShowServiceFormModal] = useState(false);

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
  const [isAdminCategoryDropdownOpen, setIsAdminCategoryDropdownOpen] = useState(false);
  const [isAdminCategorySearch, setIsAdminCategorySearch] = useState('');
  const [isProviderCategoryDropdownOpen, setIsProviderCategoryDropdownOpen] = useState(false);
  const [isProviderServiceDropdownOpen, setIsProviderServiceDropdownOpen] = useState(false);
  const [providerServiceSearchQuery, setProviderServiceSearchQuery] = useState('');
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
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);

  // Support Ticket System States
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketMessageImage, setNewTicketMessageImage] = useState('');
  const [sendingTicketMessage, setSendingTicketMessage] = useState(false);
  const [ticketSearchType, setTicketSearchType] = useState('id');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');
  const [showImageZoom, setShowImageZoom] = useState<string | null>(null);

  // Order start count updating helper
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [orderStartCountInput, setOrderStartCountInput] = useState<number>(0);
  const [orderRemainsInput, setOrderRemainsInput] = useState<number>(0);
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
    site_title: 'Buzzify',
    logo_url: '',
    favicon_url: '',
    warning_title_instagram: 'Penting Instagram (Followers):',
    warning_desc_instagram: 'Jika Anda tidak melihat pengikut baru masuk, kemungkinan besar karena akun Anda menyaring atau menahan pengikut untuk ditinjau. Ikuti langkah berikut agar followers langsung masuk otomatis tanpa tersaring ke spam:\n\n1. Buka menu **Pengaturan dan Privasi**.\n2. Pilih **Ikuti dan Undang Teman**.\n3. Nonaktifkan opsi **Tandai untuk Ditinjau (Flag for Review)**.\n4. Jika baru dinonaktifkan, silakan tes pesan dengan jumlah kecil dulu.',
    warning_image_url_instagram: '/instagram_instruction.jpg',
    warning_video_url_instagram: '',
    deposit_bonus_min: '10000',
    deposit_bonus_percent: '11',
    show_live_chat: 'true',
    show_live_chat_mobile: 'true',
    show_mobile_nav: 'true',
    referral_enabled: 'true',
    referral_commission_percent: '5'
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
    onConfirm: () => { }
  });

  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const alert = (message: string) => {
    let detectedType: 'success' | 'error' | 'info' = 'info';
    const msgLower = message.toLowerCase();
    if (msgLower.includes('berhasil') || msgLower.includes('sukses') || msgLower.includes('success')) {
      detectedType = 'success';
    } else if (msgLower.includes('gagal') || msgLower.includes('kesalahan') || msgLower.includes('error') || msgLower.includes('berakhir') || msgLower.includes('tidak')) {
      detectedType = 'error';
    }
    setAlertModal({
      show: true,
      type: detectedType,
      title: detectedType === 'success' ? 'Berhasil' : detectedType === 'error' ? 'Gagal' : 'Pemberitahuan',
      message
    });
  };

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
        fetchAnnouncements(),
        fetchTickets()
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
          profiles: profile ? { email: profile.email, username: profile.username } : (tx.profiles || undefined)
        };
      }).filter(Boolean);
      setTransactions(finalTxs as Transaction[]);

      const finalOrders = mergedOrders.map(order => {
        if (!order) return order;
        const profile = mergedProfiles.find(p => p && p.id === order.user_id);
        return {
          ...order,
          profiles: profile ? { email: profile.email, username: profile.username } : (order.profiles || undefined)
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

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  const fetchTicketDetails = async (ticketId: number) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedTicket(data.ticket);
        setTicketMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    }
  };

  const handleSendTicketMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketMessage.trim() || !selectedTicket) return;

    setSendingTicketMessage(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newTicketMessage,
          image_url: newTicketMessageImage || null
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTicketMessage('');
        setNewTicketMessageImage('');
        await fetchTicketDetails(selectedTicket.id);
        fetchTickets();
      } else {
        alert(data.error || 'Gagal mengirim pesan');
      }
    } catch (err) {
      console.error('Error replying to ticket:', err);
      alert('Terjadi kesalahan jaringan');
    } finally {
      setSendingTicketMessage(false);
    }
  };

  const handleCloseTicket = async (ticketId: number) => {
    if (!confirm('Apakah Anda yakin ingin menutup tiket ini?')) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Closed' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Tiket berhasil ditutup!');
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket((prev: any) => prev ? { ...prev, status: 'Closed' } : null);
        }
        fetchTickets();
      } else {
        alert(data.error || 'Gagal menutup tiket');
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleDeleteTicket = async (ticketId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tiket ini secara permanen?')) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert('Tiket berhasil dihapus!');
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(null);
        }
        setSelectedTicketIds(prev => prev.filter(id => id !== ticketId));
        fetchTickets();
      } else {
        alert(data.error || 'Gagal menghapus tiket');
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleBulkDeleteTickets = async () => {
    if (selectedTicketIds.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedTicketIds.length} tiket terpilih secara permanen?`)) return;
    try {
      const res = await fetch('/api/tickets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds: selectedTicketIds })
      });
      const data = await res.json();
      if (data.success) {
        alert('Tiket terpilih berhasil dihapus!');
        setSelectedTicketIds([]);
        fetchTickets();
      } else {
        alert(data.error || 'Gagal menghapus tiket secara massal');
      }
    } catch (err) {
      console.error('Error deleting tickets in bulk:', err);
      alert('Terjadi kesalahan jaringan');
    }
  };

  const handleBulkCloseTickets = async () => {
    if (selectedTicketIds.length === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menutup ${selectedTicketIds.length} tiket terpilih?`)) return;
    try {
      const res = await fetch('/api/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketIds: selectedTicketIds, status: 'Closed' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Tiket terpilih berhasil ditutup!');
        setSelectedTicketIds([]);
        fetchTickets();
      } else {
        alert(data.error || 'Gagal menutup tiket secara massal');
      }
    } catch (err) {
      console.error('Error closing tickets in bulk:', err);
      alert('Terjadi kesalahan jaringan');
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
        .select('*');

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
    if (!serviceName.trim() || Number(servicePrice) <= 0) return;

    setSubmittingService(true);
    const payload = {
      category: serviceCategory,
      name: serviceName,
      description: serviceDescription,
      price_per_k: Number(servicePrice) || 0,
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
      setShowServiceFormModal(false);
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
      setShowServiceFormModal(false);
    } finally {
      setSubmittingService(false);
    }
  };

  // Edit Service setup
  const startEditService = (service: any) => {
    setEditingServiceId(service.id);
    setServiceCategory(service.category);
    setServiceName(service.name);
    setServiceDescription(cleanProviderDescription(service.description || ''));
    setServicePrice(service.price_per_k);
    setServiceMin(service.min_order);
    setServiceMax(service.max_order);
    setServiceIcon(service.icon_url || '');
    setProviderId(service.provider_id || 'manual');
    setProviderServiceId(service.provider_service_id || '');
    setProviderPrice(Number(service.provider_price_per_k || 0));
    setAverageDuration(service.average_duration || '15 Menit');
    setShowServiceFormModal(true);
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
      if (editingAnnId) {
        const { error } = await supabase.from('announcements').update(payload).eq('id', editingAnnId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('announcements').insert(payload);
        if (error) throw error;
      }

      setAnnTitle('');
      setAnnContent('');
      setAnnImageUrl('');
      setEditingAnnId(null);
      await fetchAnnouncements();
    } catch (err) {
      console.error('Error saving announcement:', err);
      if (editingAnnId) {
        setAnnouncements(announcements.map(a => a.id === editingAnnId ? { ...a, ...payload } : a));
      } else {
        const newMockAnn = {
          id: Math.random().toString(36).substring(2, 9),
          ...payload,
          created_at: new Date().toISOString()
        };
        setAnnouncements([newMockAnn, ...announcements]);
      }
      setAnnTitle('');
      setAnnContent('');
      setAnnImageUrl('');
      setEditingAnnId(null);
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

  // Toggle Pin Announcement
  const handleTogglePinAnnouncement = async (ann: Announcement) => {
    const newVal = !ann.is_pinned;
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_pinned: newVal })
        .eq('id', ann.id);

      if (error) throw error;
      await fetchAnnouncements();
    } catch (err: any) {
      console.error('Error toggling pin:', err);
      setAnnouncements(announcements.map(a => a.id === ann.id ? { ...a, is_pinned: newVal } : a));
    }
  };

  // Open Order Status Editor Drawer
  const openOrderEditor = (order: Order) => {
    setUpdatingOrderId(order.id);
    setOrderStartCountInput(order.start_count || 0);
    setOrderRemainsInput(order.remains || 0);
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
          remains: orderRemainsInput,
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
            remains: orderRemainsInput,
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
                remains: orderRemainsInput,
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
  const handleProcessRefund = (orderId: string, refundAmt: number) => {
    setConfirmModal({
      show: true,
      message: `Setujui & proses refund saldo sebesar Rp ${refundAmt.toLocaleString('id-ID')} untuk pesanan ini?`,
      onConfirm: async () => {
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
              action: 'process_refund',
              orderId: orderId,
              refundAmount: refundAmt
            })
          });

          const data = await res.json();
          if (!res.ok) {
            alert(data.error || 'Gagal memproses refund');
          } else {
            alert(data.message || 'Refund berhasil diproses!');
            fetchAdminData();
          }
        } catch (err) {
          console.error(err);
          alert('Terjadi kesalahan saat memproses refund');
        }
      }
    });
  };

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBalance) return;
    const numericAmount = parseInt(String(adjustmentAmount).replace(/\D/g, ''), 10) || 0;
    if (adjustmentType !== 'set' && numericAmount <= 0) {
      setBalanceError('Nominal saldo harus lebih besar dari 0');
      return;
    }
    if (adjustmentType === 'set' && numericAmount < 0) {
      setBalanceError('Nominal saldo tidak boleh kurang dari 0');
      return;
    }
    if (!adjustmentReason.trim()) {
      setBalanceError('Alasan penyesuaian wajib diisi untuk catatan transaksi');
      return;
    }

    setSubmittingBalance(true);
    setBalanceError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sesi login admin tidak ditemukan.');
      }

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'update_user_balance',
          targetUserId: selectedUserForBalance.id,
          adjustmentType,
          amount: numericAmount,
          reason: adjustmentReason
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengubah saldo');
      }

      setShowBalanceModal(false);
      setSelectedUserForBalance(null);
      setAdjustmentAmount('');
      setAdjustmentReason('');
      await fetchAdminData();
    } catch (err: any) {
      setBalanceError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmittingBalance(false);
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
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.order_id ? String(o.order_id).includes(orderSearch.trim()) : false);

    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalOrdersPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchTermTransactions.toLowerCase()) ||
      (t.tx_id ? String(t.tx_id).includes(searchTermTransactions.toLowerCase().replace('trx-', '').trim()) : false) ||
      (t.profiles?.email || '').toLowerCase().includes(searchTermTransactions.toLowerCase()) ||
      (t.profiles?.username || '').toLowerCase().includes(searchTermTransactions.toLowerCase()) ||
      t.user_id.toLowerCase().includes(searchTermTransactions.toLowerCase());

    const matchesStatus = statusFilterTransactions === 'all' || t.status === statusFilterTransactions;
    const matchesType = typeFilterTransactions === 'all' || t.type === typeFilterTransactions;

    return matchesSearch && matchesStatus && matchesType;
  });

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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans transition-colors duration-300">

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-50 dark:bg-slate-950/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <div className="flex min-h-screen">

        {/* Left Sidebar */}
        <aside className={`fixed top-0 left-0 z-50 w-68 h-screen bg-slate-900 border-r border-slate-800/80 p-6 flex flex-col transition-transform duration-300 ease-in-out shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <div className="space-y-6 overflow-y-auto flex-1 pr-1 scrollbar-thin">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2.5 px-2">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-md shadow-indigo-500/10 w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Zap className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm leading-tight text-slate-900 dark:text-slate-100 tracking-tight">
                  {brandName}
                </span>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-0.5">
                  Admin Panel
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-6 pt-4">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-3 mb-2.5">Ringkasan & Log</span>
                <nav className="space-y-1">
                  <button
                    onClick={() => changeTab('orders')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'orders'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-rose-450'
                      : 'text-slate-400 dark:text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-800/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Manajemen Order</span>
                    <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${activeTab === 'orders'
                      ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                      : 'bg-slate-800 text-slate-400 dark:text-slate-400'
                      }`}>{orders.length}</span>
                  </button>
                  <button
                    onClick={() => changeTab('users')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'users'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-800/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Kelola User</span>
                    <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${activeTab === 'users'
                      ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                      : 'bg-slate-800 text-slate-400 dark:text-slate-400'
                      }`}>{userProfiles.length}</span>
                  </button>

                  <button
                    onClick={() => {
                      changeTab('transactions');
                      fetchAdminData();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'transactions'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-rose-450'
                      : 'text-slate-400 dark:text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-800/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Log Transaksi</span>
                    <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${activeTab === 'transactions'
                      ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                      : 'bg-slate-800 text-slate-400 dark:text-slate-400'
                      }`}>{transactions.length}</span>
                  </button>

                  <button
                    onClick={() => changeTab('midtrans')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'midtrans'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-rose-450'
                      : 'text-slate-400 dark:text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-800/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Laporan Midtrans</span>
                    {midtransStats?.pendingCount > 0 && (
                      <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md font-extrabold bg-amber-500/20 text-amber-400">
                        {midtransStats.pendingCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      changeTab('tickets');
                      fetchTickets();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'tickets'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-rose-450'
                      : 'text-slate-400 dark:text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-800/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Tiket Bantuan</span>
                    <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${activeTab === 'tickets'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-800 text-slate-400 dark:text-slate-400'
                      }`}>{tickets.filter(t => t.status === 'Pending').length}</span>
                  </button>
                </nav>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-3 mb-2.5">Pengaturan Sistem</span>
                <nav className="space-y-1">
                  <button
                    onClick={() => changeTab('services')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'services'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-rose-450'
                      : 'text-slate-400 dark:text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-800/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Atur Layanan</span>
                    <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-md font-extrabold ${activeTab === 'services'
                      ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                      : 'bg-slate-800 text-slate-400 dark:text-slate-400'
                      }`}>{services.length}</span>
                  </button>

                  <button
                    onClick={() => changeTab('announcements')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'announcements'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-rose-450'
                      : 'text-slate-400 dark:text-slate-400 hover:bg-slate-800 dark:hover:bg-slate-850/45 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>Info & Rekomendasi</span>
                  </button>

                  <button
                    onClick={() => {
                      changeTab('landing');
                      fetchLandingSettings();
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'landing'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-rose-450'
                      : 'text-slate-400 dark:text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-850/45 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Landing Page</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Sidebar Footer Logout - always pinned at bottom */}
          <div className="pt-4 mt-4 border-t border-slate-800 dark:border-slate-800/60 shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/10 transition-all cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 font-sans transition-all duration-300 ${isSidebarOpen ? 'lg:pl-68' : 'lg:pl-0'}`}>

          {/* Top Navbar */}
          <header className="h-16 bg-slate-900 border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Mobile Burger Toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-450 transition-colors cursor-pointer"
                title={isSidebarOpen ? "Sembunyikan Menu" : "Tampilkan Menu"}
              >
                <Zap className="w-5 h-5 text-indigo-500" />
              </button>

              <h1 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider hidden sm:block">
                {activeTab === 'orders' && 'Manajemen Pesanan'}
                {activeTab === 'services' && 'Pengaturan Layanan'}
                {activeTab === 'announcements' && 'Informasi & Rekomendasi'}
                {activeTab === 'transactions' && 'Log & Saldo Transaksi'}
                {activeTab === 'landing' && 'Konfigurasi Landing Page'}
                {activeTab === 'tickets' && 'Tiket Bantuan Pelanggan'}
                {activeTab === 'users' && 'Kelola User'}
                {activeTab === 'midtrans' && 'Laporan Transaksi & Saldo Midtrans'}
              </h1>
            </div>

            {/* Provider Balance Info & Theme Toggle */}
            <div className="flex items-center gap-3">
              {providerBalance !== null && (
                <div className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-200 font-extrabold border border-slate-200 dark:border-slate-800/80 text-xs tracking-tight flex items-center gap-2 shadow-sm" title="Saldo BuzzerPanel">
                  <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="hidden lg:inline text-slate-400 dark:text-slate-400 font-bold">BuzzerPanel:</span> <span className="text-slate-200 dark:text-slate-100 font-black">{formatPrice(parseInt(providerBalance))}</span>
                </div>
              )}
              {medanpediaBalance !== null && (
                <div className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-200 font-extrabold border border-slate-200 dark:border-slate-800/80 text-xs tracking-tight flex items-center gap-2 shadow-sm" title="Saldo MedanPedia">
                  <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="hidden lg:inline text-slate-400 dark:text-slate-400 font-bold">MedanPedia:</span> <span className="text-slate-200 dark:text-slate-100 font-black">{formatPrice(parseInt(medanpediaBalance))}</span>
                </div>
              )}
              <PremiumThemeToggle />
              <button
                onClick={handleLogout}
                title="Keluar Akun"
                className="h-9 px-3 rounded-xl bg-rose-500/5 hover:bg-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-650 text-rose-600 dark:text-rose-450 hover:text-white dark:hover:text-white border border-rose-200/40 dark:border-rose-500/20 hover:border-rose-600 dark:hover:border-rose-650 transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </header>

          {/* Main Dashboard Container */}
          <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto bg-slate-950">


            {/* Tab 1: Orders Management */}
            {activeTab === 'orders' && (
              <div className="space-y-6">

                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Card 1: Omset */}
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-slate-700/30 hover:bg-slate-900/60 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
                    <div className="min-w-0">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Total Omset (Sales)</span>
                      <span className="text-2xl font-extrabold text-slate-100 tracking-tight block">{formatPrice(totalSales)}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-lg w-fit border border-emerald-500/20">
                        💸 {paidOrders.length} Pesanan Lunas
                      </span>
                    </div>
                    <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-650 dark:text-emerald-400 shrink-0 self-start group-hover:scale-110 transition-transform duration-300">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 2: Profit */}
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-slate-700/30 hover:bg-slate-900/60 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
                    <div className="min-w-0">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Estimasi Profit Bersih</span>
                      <span className="text-2xl font-extrabold text-slate-100 tracking-tight block">{formatPrice(totalProfit)}</span>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[10px] text-slate-450 font-light block">
                          Margin Keuntungan: <strong className="text-slate-200">~{profitMarginPercent}%</strong>
                        </span>
                        <span className="text-[9px] text-slate-500 font-light block">
                          Modal Pusat: {formatPrice(totalCost)}
                        </span>
                      </div>
                    </div>
                    <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 shrink-0 self-start group-hover:scale-110 transition-transform duration-300">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 3: Orders Count */}
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-slate-700/30 hover:bg-slate-900/60 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
                    <div className="min-w-0">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Total Orderan Masuk</span>
                      <span className="text-2xl font-extrabold text-slate-100 tracking-tight block">{orders.length} Order</span>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {successCount} Sukses
                        </span>
                        <span className="text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                          {pendingCount + processingCount} Proses
                        </span>
                        <span className="text-[8px] bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/20">
                          {failedCount} Gagal
                        </span>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20 text-blue-650 dark:text-blue-400 shrink-0 self-start group-hover:scale-110 transition-transform duration-300">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Card 4: Best Seller */}
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl backdrop-blur-md flex items-center justify-between shadow-lg relative overflow-hidden group hover:border-slate-700/30 hover:bg-slate-900/60 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
                    <div className="min-w-0 flex-1 pr-3">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Layanan Terlaris</span>
                      <span className="text-sm font-extrabold text-slate-100 block truncate leading-tight" title={bestSellerName}>
                        {bestSellerName}
                      </span>
                      {bestSellerCount > 0 ? (
                        <span className="text-[10px] text-slate-450 font-light block mt-1.5">
                          Dipesan <strong className="text-slate-200 font-bold">{bestSellerCount} kali</strong> ({bestSellerCategory})
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-light block mt-1.5">Belum ada orderan</span>
                      )}
                    </div>
                    <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20 text-amber-650 dark:text-amber-400 shrink-0 self-start group-hover:scale-110 transition-transform duration-300">
                      <Award className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl backdrop-blur-md">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Cari Order ID, Layanan, atau URL..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 pl-11 pr-4 py-3 rounded-2xl outline-none transition-all text-sm shadow-inner"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['all', 'pending', 'processing', 'inprogress', 'success', 'partial', 'failed'].map(status => (
                      <button
                        key={status}
                        onClick={() => setOrderStatusFilter(status)}
                        className={`px-4 py-2 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${orderStatusFilter === status
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500/30'
                          : 'bg-slate-950/60 text-slate-400 hover:text-slate-250 border border-slate-900'
                          }`}
                      >
                        {status === 'all' ? 'Semua' : (status === 'failed' ? 'error' : status)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bulk Action copy bar */}
                {selectedOrderIds.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-indigo-500/10 border border-indigo-500/20 px-6 py-4 rounded-3xl mb-4 gap-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="text-xs text-indigo-650 dark:text-indigo-400 font-extrabold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>{selectedOrderIds.length} Order Terpilih</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          const textToCopy = selectedOrderIds.join(', ');
                          navigator.clipboard.writeText(textToCopy);
                          alert(`Berhasil menyalin ${selectedOrderIds.length} Order ID ke clipboard!`);
                        }}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-500/10 cursor-pointer transition-all active:scale-95"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Salin Semua ID
                      </button>
                      <button
                        onClick={() => setSelectedOrderIds([])}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* Orders Table */}
                <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl overflow-hidden backdrop-blur-md">
                  {filteredOrders.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 text-sm font-light">Belum ada orderan masuk.</div>
                  ) : (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-950/50">
                              <th className="py-3.5 px-4 w-10">
                                <input
                                  type="checkbox"
                                  checked={
                                    filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage).length > 0 &&
                                    filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage).every(o => selectedOrderIds.includes(o.order_id || o.id))
                                  }
                                  onChange={(e) => {
                                    const currentPageOrders = filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage);
                                    if (e.target.checked) {
                                      const newIds = currentPageOrders.map(o => o.order_id || o.id);
                                      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...newIds])));
                                    } else {
                                      const currentPageIds = currentPageOrders.map(o => o.order_id || o.id);
                                      setSelectedOrderIds(prev => prev.filter(id => !currentPageIds.includes(id)));
                                    }
                                  }}
                                  className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                                />
                              </th>
                              <th className="py-3.5 px-4">
                                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> User</span>
                              </th>
                              <th className="py-3.5 px-3">
                                <span className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Order ID</span>
                              </th>
                              <th className="py-3.5 px-3">
                                <span className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Layanan</span>
                              </th>
                              <th className="py-3.5 px-3">
                                <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Target URL</span>
                              </th>
                              <th className="py-3.5 px-3 text-right">Jumlah</th>
                              <th className="py-3.5 px-3 text-right">Total Harga</th>
                              <th className="py-3.5 px-3 text-center">Start Count</th>
                              <th className="py-3.5 px-3">
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Tanggal Masuk</span>
                              </th>
                              <th className="py-3.5 px-4 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/40">
                            {filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage).map(order => (
                              <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
                                <td className="py-4 px-4 w-10">
                                  <input
                                    type="checkbox"
                                    checked={selectedOrderIds.includes(order.order_id || order.id)}
                                    onChange={(e) => {
                                      const id = order.order_id || order.id;
                                      if (e.target.checked) {
                                        setSelectedOrderIds(prev => [...prev, id]);
                                      } else {
                                        setSelectedOrderIds(prev => prev.filter(x => x !== id));
                                      }
                                    }}
                                    className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                                  />
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white shadow-md shrink-0">
                                      {(order.profiles?.username || order.profiles?.email || 'U')[0].toUpperCase()}
                                    </div>
                                    <span className="font-semibold text-slate-250 tracking-tight text-xs truncate max-w-[120px]" title={order.profiles?.username || order.profiles?.email || 'User'}>
                                      {order.profiles?.username || order.profiles?.email || 'User'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-3">
                                  <button
                                    onClick={() => {
                                      const idToCopy = order.order_id ? String(order.order_id) : order.id;
                                      navigator.clipboard.writeText(idToCopy);
                                    }}
                                    className="font-mono text-slate-350 hover:text-indigo-500 dark:text-indigo-400 font-bold bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-lg text-[9px] w-fit flex items-center gap-1 transition-colors cursor-pointer"
                                    title="Salin ID"
                                  >
                                    {order.order_id ? String(order.order_id) : order.id.slice(0, 8)}
                                  </button>
                                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                    {/* Payment Status badge */}
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getPaymentStatusBadgeClass(order.payment_status)}`}>
                                      {order.payment_status}
                                    </span>
                                    {/* Process Status badge */}
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getOrderStatusBadgeClass(getAdminDisplayStatus(order))}`}>
                                      {getAdminDisplayStatus(order) === 'failed' ? 'error' : getAdminDisplayStatus(order)}
                                    </span>
                                  </div>
                                  {order.payment_status === 'pending_refund' && (
                                    <div className="mt-2.5 text-[10px] bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-xl p-3 max-w-[170px] space-y-1 shadow-sm">
                                      <p className="font-extrabold text-red-700 dark:text-red-400">Gagal di Pusat</p>
                                      <p className="text-slate-600 dark:text-slate-400 font-medium">Provider: <strong className="font-extrabold text-red-650 dark:text-red-300 capitalize">{order.provider_id || 'manual'}</strong></p>
                                      <p className="text-slate-600 dark:text-slate-400 font-medium">Refund: <strong className="font-extrabold text-red-650 dark:text-red-300">Rp {formatNumberWithDots(order.provider_refund_amount)}</strong></p>
                                    </div>
                                  )}
                                </td>
                                <td className="py-4 px-3 font-semibold text-slate-200">
                                  <div className="flex flex-col gap-1 max-w-[280px]">
                                    {(() => {
                                      const displaySrvId = getNumericId(order.service_id);
                                      return (
                                        <span className="font-bold text-slate-200 text-xs whitespace-normal break-words" title={order.service_name}>
                                          [#{displaySrvId}] {order.service_name}
                                        </span>
                                      );
                                    })()}
                                    <div className="flex gap-1.5 items-center flex-wrap">
                                      <span className={`px-1.5 py-0.5 rounded-md font-extrabold text-[8px] uppercase tracking-wider border w-fit ${getCategoryBadgeClass(order.category)}`}>
                                        {order.category}
                                      </span>
                                      {(() => {
                                        const service = services.find(s => s.id === order.service_id);
                                        const displayProvider = order.provider_id || (service ? service.provider_id : null) || 'manual';
                                        return (
                                          <span className="px-1.5 py-0.5 rounded-md font-black text-[7.5px] uppercase tracking-widest bg-slate-800 text-slate-350 border border-slate-700/60 w-fit flex items-center gap-0.5">
                                            🔌 {displayProvider}
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-3 font-mono text-slate-400 max-w-xs">
                                  <div className="flex items-center gap-1">
                                    <a href={order.target_url} target="_blank" rel="noreferrer" className="hover:text-indigo-500 dark:text-indigo-400 hover:underline truncate max-w-[110px] inline-block text-[11px]">
                                      {order.target_url.replace('https://', '').replace('www.', '')}
                                    </a>
                                    <ExternalLink className="w-3 h-3 text-slate-500 inline shrink-0" />
                                  </div>
                                </td>
                                <td className="py-4 px-3 text-right font-semibold text-slate-200 whitespace-nowrap">{order.quantity.toLocaleString()}</td>
                                <td className="py-4 px-3 text-right font-extrabold text-indigo-500 dark:text-indigo-400 whitespace-nowrap">{formatPrice(order.total_price)}</td>
                                <td className="py-4 px-3 text-center font-mono text-slate-350 whitespace-nowrap">
                                  {order.start_count !== undefined && order.start_count !== null ? order.start_count.toLocaleString() : '-'}
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
                                    <div className="flex flex-col gap-2.5 p-3.5 bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl w-48 mx-auto text-left shadow-xl">
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
                                            value={orderRemainsInput}
                                            placeholder="Sisa yg gagal kirim..."
                                            onChange={(e) => {
                                              const remains = parseFloat(e.target.value) || 0;
                                              setOrderRemainsInput(remains);
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
                                          className="flex-1 bg-indigo-600 hover:bg-indigo-600 text-white text-white font-bold py-1.5 rounded text-[10px] flex items-center justify-center gap-1 cursor-pointer"
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
                                  ) : order.payment_status === 'pending_refund' ? (
                                    <div className="flex flex-col gap-1.5 justify-center items-center">
                                      <button
                                        onClick={() => handleProcessRefund(order.id, parseFloat(String(order.provider_refund_amount || 0)))}
                                        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-3 py-1.5 rounded-xl font-extrabold cursor-pointer transition-all active:scale-95 text-[10px] w-full justify-center shadow-md shadow-orange-500/10"
                                      >
                                        <Wallet className="w-3 h-3" />
                                        Proses Refund
                                      </button>
                                      <button
                                        onClick={() => openOrderEditor(order)}
                                        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-350 px-3 py-1.5 rounded-xl border border-slate-700 font-extrabold cursor-pointer transition-all active:scale-95 text-[10px] w-full justify-center"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                        Atur Manual
                                      </button>
                                    </div>
                                  ) : (order.status === 'success' || order.status === 'failed' || order.payment_status === 'refunded') ? (
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
                                        className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-indigo-50/50 hover:to-indigo-100/50 dark:from-slate-800 dark:to-slate-850 dark:hover:from-slate-750 dark:hover:to-slate-800 text-slate-850 dark:text-slate-200 border border-slate-250 dark:border-slate-700/50 font-black px-3.5 py-1.5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 text-[10px] w-full justify-center"
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

                      {/* Mobile responsive cards list */}
                      <div className="block md:hidden divide-y divide-slate-800/40">
                        {filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage).map(order => (
                          <div key={order.id} className="p-4 space-y-3.5 bg-slate-900/10 hover:bg-slate-900/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedOrderIds.includes(order.order_id || order.id)}
                                  onChange={(e) => {
                                    const id = order.order_id || order.id;
                                    if (e.target.checked) {
                                      setSelectedOrderIds(prev => [...prev, id]);
                                    } else {
                                      setSelectedOrderIds(prev => prev.filter(x => x !== id));
                                    }
                                  }}
                                  className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <button
                                  onClick={() => {
                                    const idToCopy = order.order_id ? String(order.order_id) : order.id;
                                    navigator.clipboard.writeText(idToCopy);
                                  }}
                                  className="font-mono text-slate-355 font-bold bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-lg text-[9px] w-fit flex items-center gap-1 transition-colors"
                                >
                                  #{order.order_id ? String(order.order_id) : order.id.slice(0, 8)}
                                </button>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {new Date(order.created_at).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }).replace('.', ':')}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-medium">User:</span>
                                <span className="font-semibold text-slate-200 truncate max-w-[180px]">{order.profiles?.username || order.profiles?.email || 'User'}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-medium">Layanan:</span>
                                <div className="flex flex-col items-end gap-1 max-w-[280px]">
                                  {(() => {
                                    const displaySrvId = getNumericId(order.service_id);
                                    return (
                                      <span className="font-bold text-slate-100 text-right whitespace-normal break-words" title={order.service_name}>
                                        [#{displaySrvId}] {order.service_name}
                                      </span>
                                    );
                                  })()}
                                  <div className="flex gap-1 items-center flex-wrap">
                                    <span className={`px-1.5 py-0.5 rounded-md font-extrabold text-[8px] uppercase tracking-wider border w-fit ${getCategoryBadgeClass(order.category)}`}>
                                      {order.category}
                                    </span>
                                    {(() => {
                                      const service = services.find(s => s.id === order.service_id);
                                      const displayProvider = order.provider_id || (service ? service.provider_id : null) || 'manual';
                                      return (
                                        <span className="px-1.5 py-0.5 rounded-md font-black text-[7.5px] uppercase tracking-widest bg-slate-800 text-slate-350 border border-slate-700/60 w-fit flex items-center gap-0.5">
                                          🔌 {displayProvider}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-medium">Target URL:</span>
                                <a href={order.target_url} target="_blank" rel="noreferrer" className="text-indigo-500 dark:text-indigo-400 font-semibold hover:underline truncate max-w-[180px]">
                                  {order.target_url.replace('https://', '').replace('www.', '')}
                                </a>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-medium">Jumlah / Total Harga:</span>
                                <span className="font-bold text-slate-200">
                                  {order.quantity.toLocaleString()} | <span className="text-indigo-500 dark:text-indigo-400">{formatPrice(order.total_price)}</span>
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-medium">Status:</span>
                                <div className="flex gap-1.5 flex-wrap">
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getPaymentStatusBadgeClass(order.payment_status)}`}>
                                    {order.payment_status}
                                  </span>
                                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getOrderStatusBadgeClass(getAdminDisplayStatus(order))}`}>
                                    {getAdminDisplayStatus(order) === 'failed' ? 'error' : getAdminDisplayStatus(order)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2">
                              {updatingOrderId === order.id ? (
                                <div className="space-y-3.5 p-3.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl text-left shadow-xl">
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
                                        value={orderRemainsInput}
                                        placeholder="Sisa yg gagal kirim..."
                                        onChange={(e) => {
                                          const remains = parseFloat(e.target.value) || 0;
                                          setOrderRemainsInput(remains);
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
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveOrderUpdate(order.id)}
                                      className="flex-1 bg-indigo-600 hover:bg-indigo-600 text-white font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Check className="w-3 h-3" />
                                      Simpan
                                    </button>
                                    <button
                                      onClick={() => setUpdatingOrderId(null)}
                                      className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-450 rounded-xl text-xs cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              ) : order.status === 'success' || order.status === 'failed' || order.payment_status === 'refunded' ? (
                                <div className="text-center text-[10px] text-slate-500 font-mono italic">Order Selesai</div>
                              ) : (
                                <div className="flex gap-2 w-full">
                                  {order.status === 'pending' && (() => {
                                    const service = services.find(s => s.id === order.service_id);
                                    const isProvider = !!(service && service.provider_id && service.provider_id !== 'manual' && service.provider_service_id);
                                    if (isProvider) {
                                      return (
                                        <button
                                          onClick={() => handleRetryProvider(order.id)}
                                          disabled={retryingOrderId === order.id}
                                          className="flex-1 inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl border border-slate-800/80 font-extrabold cursor-pointer transition-all active:scale-95 text-[10px] disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                                        >
                                          <Zap className={`w-3 h-3 ${retryingOrderId === order.id ? 'animate-spin' : ''}`} />
                                          {retryingOrderId === order.id ? 'Mengirim...' : 'Kirim Provider'}
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}
                                  <button
                                    onClick={() => openOrderEditor(order)}
                                    className="flex-1 inline-flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-indigo-50/50 hover:to-indigo-100/50 dark:from-slate-800 dark:to-slate-850 dark:hover:from-slate-750 dark:hover:to-slate-800 text-slate-850 dark:text-slate-200 border border-slate-250 dark:border-slate-700/50 font-black px-3.5 py-1.5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 text-[10px] justify-center"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    Atur Progres
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
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
                      <div className="space-y-6">

                          {/* Clean Header Panel with Action Button */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-sm">
                            <div>
                              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-indigo-500" />
                                Pengaturan Layanan
                              </h3>
                              <p className="text-xs text-slate-400 mt-1 font-light">
                                Kelola kategori, harga jual, limit pemesanan, dan sinkronisasi otomatis dengan API provider pusat.
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setEditingServiceId(null);
                                setServiceName('');
                                setServiceDescription('');
                                setServicePrice(0);
                                setServiceMin(100);
                                setServiceMax(10000);
                                setServiceIcon('');
                                setProviderId('manual');
                                setProviderServiceId('');
                                setProviderPrice(0);
                                setAverageDuration('15 Menit');
                                setShowServiceFormModal(true);
                              }}
                              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-3 rounded-2xl text-xs font-black cursor-pointer shadow-lg shadow-indigo-600/20 active:scale-95 transition-all shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                              Tambah Layanan Baru
                            </button>
                          </div>

                          {/* Service Lists (Full Width for elegant display) */}
                          <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
                            <div>
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider shrink-0">Daftar Layanan Tersedia</h3>
                                
                                {/* Search and Filters */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-3xl justify-end">
                                  {/* Search */}
                                  <div className="relative flex-1 max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                    <input
                                      type="text"
                                      placeholder="Cari layanan, ID..."
                                      value={serviceSearch}
                                      onChange={(e) => setServiceSearch(e.target.value)}
                                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-850 text-slate-100 text-xs focus:outline-none focus:border-indigo-500/50"
                                    />
                                  </div>

                                  {/* Category Filter */}
                                  <select
                                    value={serviceCategoryFilter}
                                    onChange={(e) => setServiceCategoryFilter(e.target.value)}
                                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-slate-350 text-xs focus:outline-none focus:border-indigo-500/50 cursor-pointer w-full sm:w-auto"
                                  >
                                    <option value="all">Semua Kategori</option>
                                    {Array.from(new Set(services.map(s => s.category))).map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>

                                  {/* Provider Filter */}
                                  <select
                                    value={serviceProviderFilter}
                                    onChange={(e) => setServiceProviderFilter(e.target.value)}
                                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-slate-350 text-xs focus:outline-none focus:border-indigo-500/50 cursor-pointer w-full sm:w-auto"
                                  >
                                    <option value="all">Semua Provider</option>
                                    <option value="manual">Manual (Tanpa API)</option>
                                    {Array.from(new Set(services.filter(s => s.provider_id && s.provider_id !== 'manual').map(s => s.provider_id))).map(prov => (
                                      <option key={prov} value={prov}>{prov}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-4">
                                {filteredServicesList.length === 0 ? (
                                  <div className="py-8 text-center text-slate-500 text-xs">Belum ada layanan yang cocok dengan filter Anda.</div>
                                ) : (
                                  paginatedServices.map(service => {
                                    const serviceIconUrl = categoryIconMap[service.category] || service.icon_url;

                                    return (
                                      <div
                                        key={service.id}
                                        className="bg-slate-900 dark:bg-slate-950/50 border border-slate-850 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-950/10 transition-all duration-300 p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs group"
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
                                              <span className="px-2 py-0.5 rounded-lg font-mono font-bold text-[9px] bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                                #{getNumericId(service)}
                                              </span>
                                              <span className={`px-2 py-0.5 rounded-lg font-extrabold text-[9px] uppercase tracking-wider ${getCategoryBadgeClass(service.category)}`}>
                                                {service.category}
                                              </span>
                                              <span className="font-extrabold text-slate-850 dark:text-slate-100 text-sm transition-colors">
                                                {service.name}
                                              </span>
                                              {/* Provider badge in SMM list */}
                                              {service.provider_id && service.provider_id !== 'manual' && (
                                                <span className="px-1.5 py-0.5 rounded-md font-black text-[7.5px] uppercase tracking-widest bg-slate-850 text-slate-455 border border-slate-700/60 w-fit flex items-center gap-0.5">
                                                  🔌 {service.provider_id}
                                                </span>
                                              )}
                                            </div>

                                            <div className="text-slate-400 dark:text-slate-400 font-medium flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                                              <span className="flex items-center gap-1">
                                                <span className="text-slate-500 dark:text-slate-500">Min:</span> <strong className="text-slate-200 dark:text-slate-250 font-extrabold">{service.min_order.toLocaleString()}</strong>
                                              </span>
                                              <span className="text-slate-400 dark:text-slate-650">•</span>
                                              <span className="flex items-center gap-1">
                                                <span className="text-slate-500 dark:text-slate-500">Max:</span> <strong className="text-slate-200 dark:text-slate-250 font-extrabold">{service.max_order.toLocaleString()}</strong>
                                              </span>
                                              {service.created_at && (
                                                <>
                                                  <span className="text-slate-400 dark:text-slate-650">•</span>
                                                  <span className="text-slate-500 dark:text-slate-500">
                                                    Dibuat: <strong className="text-slate-200 dark:text-slate-250 font-extrabold">{new Date(service.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
                                                  </span>
                                                </>
                                              )}
                                            </div>

                                            {service.description && (
                                              <button
                                                type="button"
                                                onClick={() => setExpandedServices(prev => ({ ...prev, [service.id]: !prev[service.id] }))}
                                                className="text-[10px] text-indigo-500 dark:text-indigo-550 dark:text-indigo-400 hover:text-indigo-650 dark:hover:text-indigo-350 font-bold mt-2.5 flex items-center gap-1 cursor-pointer transition-colors"
                                              >
                                                <span>{expandedServices[service.id] ? 'Sembunyikan Deskripsi' : 'Lihat Deskripsi'}</span>
                                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedServices[service.id] ? 'rotate-180' : ''}`} />
                                              </button>
                                            )}

                                            {service.description && expandedServices[service.id] && (
                                              <div className="text-[11px] text-slate-350 dark:text-slate-300 mt-2.5 bg-slate-850/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-300 dark:border-slate-850/60 max-w-xl font-medium leading-relaxed whitespace-pre-wrap select-text animate-in fade-in slide-in-from-top-2 duration-250">
                                                <span className="block font-bold text-[9px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Deskripsi Detail:</span>
                                                <div className="text-slate-200 dark:text-slate-200">{service.description}</div>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <div className="flex sm:flex-row items-center gap-4 shrink-0 justify-end w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-850">
                                          <div className="text-right">
                                            <div className="text-[10px] text-slate-600 dark:text-slate-500 font-medium">Harga / 1K</div>
                                            <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                                              Rp {Number(service.price_per_k).toLocaleString('id-ID')}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            {/* Recomendation toggle */}
                                            <button
                                              onClick={async () => {
                                                const { error } = await supabase
                                                  .from('services')
                                                  .update({ is_recommended: !service.is_recommended })
                                                  .eq('id', service.id);
                                                if (!error) fetchServices();
                                              }}
                                              className={`p-2.5 rounded-xl border transition-all active:scale-95 cursor-pointer ${service.is_recommended
                                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                                }`}
                                              title={service.is_recommended ? 'Rekomendasi Aktif' : 'Atur Sebagai Rekomendasi'}
                                            >
                                              <Star className={`w-3.5 h-3.5 ${service.is_recommended ? 'fill-amber-500' : ''}`} />
                                            </button>

                                            <button
                                              onClick={() => startEditService(service)}
                                              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-indigo-500 border border-slate-850 hover:border-slate-750 transition-all active:scale-95 cursor-pointer"
                                              title="Edit Layanan"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteService(service.id)}
                                              className="p-2.5 rounded-xl bg-slate-950 hover:bg-red-950/20 text-slate-400 hover:text-red-500 border border-slate-850 hover:border-red-900/30 transition-all active:scale-95 cursor-pointer"
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
                            {totalServicesPages > 1 && (
                              <div className="flex items-center justify-between border-t border-slate-850/80 bg-slate-900/10 pt-4 mt-6">
                                <div className="text-xs text-slate-400">
                                  Menampilkan <span className="font-semibold text-slate-350">{((servicesPage - 1) * servicesPerPage) + 1}</span> - <span className="font-semibold text-slate-350">{Math.min(servicesPage * servicesPerPage, filteredServicesList.length)}</span> dari <span className="font-semibold text-slate-350">{filteredServicesList.length}</span> layanan
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
                                    disabled={servicesPage === totalServicesPages}
                                    onClick={() => setServicesPage(p => Math.min(totalServicesPages, p + 1))}
                                    className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 disabled:opacity-40 text-slate-300 border border-slate-850 text-xs transition-all active:scale-95 disabled:pointer-events-none cursor-pointer"
                                  >
                                    Selanjutnya
                                  </button>
                                </div>
                              </div>
                            )}
          </div>

                {/* Modal Overlay Form Container (Centered, wide, clean) */}
                {showServiceFormModal && (
                  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800/80 shadow-2xl rounded-3xl w-full max-w-3xl overflow-hidden relative max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">

                      {/* Modal Header */}
                      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-850 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                          <Settings className="w-5 h-5 text-indigo-500" />
                          <h3 className="font-extrabold text-base text-slate-200">
                            {editingServiceId ? 'Edit Layanan' : 'Tambah Layanan Baru'}
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setShowServiceFormModal(false);
                            setEditingServiceId(null);
                          }}
                          className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-6 overflow-y-auto space-y-6 flex-1 min-h-0 scrollbar-thin">
                        <form id="service-form" onSubmit={handleSaveService} className="space-y-6">

                          {/* Main Info Row */}
                          <div className="grid md:grid-cols-2 gap-5">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kategori</label>
                              {(() => {
                                const defaultCategories = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X'];
                                const existingCustomCategories = [...new Set(services.map(s => s.category))].filter(c => !defaultCategories.includes(c));
                                const allKnownCategories = [...defaultCategories, ...existingCustomCategories];
                                const isKnownCategory = allKnownCategories.includes(serviceCategory);

                                return (
                                  <>
                                    <div className="relative">
                                      <button
                                        type="button"
                                        onClick={() => setIsAdminCategoryDropdownOpen(!isAdminCategoryDropdownOpen)}
                                        className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs text-left cursor-pointer focus:border-indigo-500"
                                      >
                                        <span className="truncate">
                                          {isKnownCategory
                                            ? serviceCategory
                                            : serviceCategory === ''
                                              ? 'Pilih Kategori / Tulis Kustom'
                                              : `${serviceCategory} (Kustom)`
                                          }
                                        </span>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isAdminCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                                      </button>

                                      {isAdminCategoryDropdownOpen && (
                                        <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[220px] flex flex-col">
                                          <div className="p-2.5 border-b border-slate-900 bg-slate-950/80 sticky top-0 backdrop-blur-md">
                                            <input
                                              type="text"
                                              placeholder="Cari Kategori..."
                                              value={isAdminCategorySearch}
                                              onChange={(e) => setIsAdminCategorySearch(e.target.value)}
                                              className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 px-3 py-1.5 rounded-xl outline-none text-[11px]"
                                              autoFocus
                                            />
                                          </div>
                                          <div className="overflow-y-auto scrollbar-thin flex-1 py-1">
                                            {[...allKnownCategories, 'Kustom']
                                              .filter(cat => cat.toLowerCase().includes(isAdminCategorySearch.toLowerCase()))
                                              .map(cat => (
                                                <button
                                                  key={cat}
                                                  type="button"
                                                  onClick={() => {
                                                    if (cat === 'Kustom') {
                                                      setServiceCategory('');
                                                    } else {
                                                      setServiceCategory(cat);
                                                    }
                                                    setIsAdminCategoryDropdownOpen(false);
                                                    setIsAdminCategorySearch('');
                                                  }}
                                                  className={`w-full text-left px-4 py-2 text-xs hover:bg-indigo-600/10 hover:text-indigo-400 transition-colors ${
                                                    serviceCategory === cat ? 'text-indigo-400 bg-indigo-600/5 font-bold' : 'text-slate-355'
                                                  } ${!defaultCategories.includes(cat) && cat !== 'Kustom' ? 'italic' : ''}`}
                                                >
                                                  {cat === 'Kustom' ? '✏️ Kategori Baru (Kustom)...' : cat}
                                                  {!defaultCategories.includes(cat) && cat !== 'Kustom' && (
                                                    <span className="text-[9px] text-slate-500 ml-1.5">(kustom)</span>
                                                  )}
                                                </button>
                                              ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {!isKnownCategory && (
                                      <input
                                        type="text"
                                        required
                                        placeholder="Masukkan nama kategori baru..."
                                        value={serviceCategory}
                                        onChange={(e) => setServiceCategory(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 px-4 py-3 rounded-2xl outline-none text-xs mt-2"
                                      />
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            {/* Service Name */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nama Layanan</label>
                              <input
                                type="text"
                                required
                                placeholder="Contoh: Followers Indo Real"
                                value={serviceName}
                                onChange={(e) => setServiceName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 px-4 py-3 rounded-2xl outline-none text-xs"
                              />
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deskripsi Layanan</label>
                            <textarea
                              placeholder="Masukkan deskripsi detail layanan (misal: Followers real aktif, proses cepat, garansi 30 hari)..."
                              value={serviceDescription}
                              onChange={(e) => setServiceDescription(e.target.value)}
                              rows={4}
                              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-slate-300 px-4 py-3 rounded-2xl outline-none text-xs font-sans leading-relaxed resize-y min-h-[100px]"
                            />
                          </div>

                          {/* Price & Duration Row */}
                          <div className="grid md:grid-cols-2 gap-5">
                            {/* Price */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Harga per 1.000 (1K)</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                required
                                value={formatNumberWithDots(servicePrice)}
                                onChange={(e) => setServicePrice(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 px-4 py-3 rounded-2xl outline-none text-xs font-semibold"
                              />
                            </div>

                            {/* Average Duration */}
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">⏱️ Rata-Rata Durasi Proses</label>
                              <input
                                type="text"
                                required
                                placeholder="Contoh: 15 Menit, 1 Jam, dll."
                                value={averageDuration}
                                onChange={(e) => setAverageDuration(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 px-4 py-3 rounded-2xl outline-none text-xs"
                              />
                            </div>
                          </div>

                          {/* Min & Max Order Row */}
                          <div className="grid md:grid-cols-2 gap-5">
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Min Order</label>
                              <input
                                type="number"
                                required
                                value={serviceMin}
                                onChange={(e) => setServiceMin(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 px-4 py-3 rounded-2xl outline-none text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Max Order</label>
                              <input
                                type="number"
                                required
                                value={serviceMax}
                                onChange={(e) => setServiceMax(parseInt(e.target.value) || 0)}
                                className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 px-4 py-3 rounded-2xl outline-none text-xs"
                              />
                            </div>
                          </div>

                          {/* SMM Provider Integration Block */}
                          <div className="border-t border-slate-850 pt-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Integrasi Provider Pusat</h4>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4 items-end">
                              <div className="md:col-span-1">
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
                                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 px-4 py-3 rounded-2xl outline-none text-xs cursor-pointer"
                                >
                                  <option value="manual">Manual (Tanpa Provider)</option>
                                  <option value="buzzerpanel">BuzzerPanel</option>
                                  <option value="medanpedia">MedanPedia</option>
                                </select>
                              </div>

                              {providerId !== 'manual' && (
                                <div className="md:col-span-2 flex gap-3">
                                  <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">ID Layanan Pusat</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="Contoh: 140"
                                      value={providerServiceId}
                                      onChange={(e) => setProviderServiceId(e.target.value)}
                                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 px-4 py-3 rounded-2xl outline-none text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Harga Modal (1K)</label>
                                    <input
                                      type="number"
                                      required
                                      placeholder="Harga beli"
                                      value={providerPrice || ''}
                                      onChange={(e) => setProviderPrice(parseFloat(e.target.value) || 0)}
                                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-indigo-500 px-4 py-3 rounded-2xl outline-none text-xs"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {(providerId === 'buzzerpanel' || providerId === 'medanpedia') && (
                              <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-850">
                                <div className="flex items-center justify-between border-b border-slate-850/60 pb-3">
                                  <span className="text-xs text-indigo-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5">
                                    🔌 Hubungkan Langsung dari Database Pusat
                                  </span>
                                  <button
                                    type="button"
                                    disabled={loadingProviderServices}
                                    onClick={fetchProviderServices}
                                    className="inline-flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-all font-bold cursor-pointer"
                                  >
                                    {loadingProviderServices ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                    {loadingProviderServices ? 'Mengambil Data...' : 'Muat Layanan Pusat'}
                                  </button>
                                </div>

                                {providerError && (
                                  <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 p-3 rounded-xl">
                                    {providerError}
                                  </div>
                                )}

                                {providerServicesList.length > 0 && (() => {
                                  const uniqueProviderCategories = Array.from(new Set(providerServicesList.map(s => s?.category).filter(Boolean))) as string[];
                                  const filteredProviderServices = providerServicesList
                                    .filter(s => {
                                      if (!s) return false;
                                      const isNumericSearch = /^\d+$/.test(providerSearch.trim());
                                      if (isNumericSearch && String(s.id).includes(providerSearch.trim())) return true;
                                      const nameMatch = (s.name || '').toLowerCase().includes(providerSearch.toLowerCase());
                                      const idMatch = String(s.id).includes(providerSearch);
                                      const catMatch = (s.category || '').toLowerCase().includes(providerSearch.toLowerCase());
                                      return (nameMatch || idMatch || catMatch) && (providerCategoryFilter === 'all' || s.category === providerCategoryFilter);
                                    })
                                    .sort((a, b) => parseFloat(a.price || '0') - parseFloat(b.price || '0'));

                                  return (
                                    <div className="space-y-4">
                                      <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Cari Nama atau ID</label>
                                          <input
                                            type="text"
                                            placeholder="Contoh: Followers Indo, Likes..."
                                            value={providerSearch}
                                            onChange={(e) => setProviderSearch(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 focus:border-indigo-500 px-3.5 py-2 rounded-xl outline-none text-xs"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filter Kategori Pusat</label>
                                          <div className="relative">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setIsProviderCategoryDropdownOpen(!isProviderCategoryDropdownOpen);
                                                setIsProviderServiceDropdownOpen(false);
                                                setProviderCategorySearch('');
                                              }}
                                              className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl outline-none text-xs cursor-pointer"
                                            >
                                              <span className="truncate">{providerCategoryFilter === 'all' ? 'Semua Kategori' : providerCategoryFilter}</span>
                                              <ChevronDown className="w-4 h-4 text-slate-400" />
                                            </button>
                                            {isProviderCategoryDropdownOpen && (
                                              <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[280px]">
                                                {/* Search Input Box */}
                                                <div className="p-2 border-b border-slate-800/80 bg-slate-950 sticky top-0 z-10">
                                                  <div className="relative">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                                                    <input
                                                      type="text"
                                                      placeholder="Cari kategori..."
                                                      value={providerCategorySearch}
                                                      onChange={(e) => setProviderCategorySearch(e.target.value)}
                                                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg outline-none text-[11px] placeholder:text-slate-500"
                                                      onClick={(e) => e.stopPropagation()}
                                                    />
                                                    {providerCategorySearch && (
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setProviderCategorySearch('');
                                                        }}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                                                      >
                                                        <X className="w-3 h-3" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Options List */}
                                                <div className="overflow-y-auto max-h-[220px] scrollbar-thin">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setProviderCategoryFilter('all');
                                                      setProviderCategorySearch('');
                                                      setIsProviderCategoryDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-850 hover:text-indigo-400 cursor-pointer"
                                                  >
                                                    Semua Kategori
                                                  </button>
                                                  {uniqueProviderCategories
                                                    .filter(cat => cat.toLowerCase().includes(providerCategorySearch.toLowerCase()))
                                                    .map(cat => (
                                                      <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => {
                                                          setProviderCategoryFilter(cat);
                                                          setProviderCategorySearch('');
                                                          setIsProviderCategoryDropdownOpen(false);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-xs hover:bg-slate-850 hover:text-indigo-400 cursor-pointer"
                                                      >
                                                        {cat}
                                                      </button>
                                                    ))}
                                                  {uniqueProviderCategories.filter(cat => cat.toLowerCase().includes(providerCategorySearch.toLowerCase())).length === 0 && (
                                                    <div className="px-4 py-3 text-xs text-slate-500 text-center font-medium">Kategori tidak ditemukan</div>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div>
                                        <div className="flex justify-between items-center mb-2">
                                          <label className="block text-[10px] font-bold text-slate-455 uppercase tracking-wider">
                                            Pilih Layanan Pusat ({filteredProviderServices.length} ditemukan)
                                          </label>
                                          {(providerSearch || providerCategoryFilter !== 'all') && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setProviderSearch('');
                                                setProviderCategoryFilter('all');
                                              }}
                                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                                            >
                                              Clear Filter
                                            </button>
                                          )}
                                        </div>

                                        <div className="relative">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setIsProviderServiceDropdownOpen(!isProviderServiceDropdownOpen);
                                              setIsProviderCategoryDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs cursor-pointer"
                                          >
                                            <span className="truncate">
                                              {providerServiceId
                                                ? (() => {
                                                  const found = providerServicesList.find(s => String(s.id) === providerServiceId);
                                                  return found ? `[${found.id}] ${found.category} - ${found.name} (Rp ${parseFloat(found.price).toLocaleString()})` : `-- Klik untuk memilih --`;
                                                })()
                                                : '-- Klik untuk memilih --'
                                              }
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-slate-450" />
                                          </button>

                                          {isProviderServiceDropdownOpen && (
                                            <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-800 text-slate-250 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[260px] flex flex-col">
                                              <div className="p-2.5 border-b border-slate-900 sticky top-0 bg-slate-950/90">
                                                <input
                                                  type="text"
                                                  placeholder="Ketik untuk memfilter list..."
                                                  value={providerServiceSearchQuery}
                                                  onChange={(e) => setProviderServiceSearchQuery(e.target.value)}
                                                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl outline-none text-xs"
                                                  autoFocus
                                                />
                                              </div>
                                              <div className="overflow-y-auto scrollbar-thin py-1 flex-1">
                                                {filteredProviderServices
                                                  .filter((ps: any) => ps && (ps.name || '').toLowerCase().includes(providerServiceSearchQuery.toLowerCase()))
                                                  .slice(0, 100)
                                                  .map((ps: any) => (
                                                    <button
                                                      key={ps.id}
                                                      type="button"
                                                      onClick={() => {
                                                        setProviderServiceId(String(ps.id));
                                                        setProviderPrice(parseFloat(ps.price));
                                                        setServiceName(ps.name);
                                                        setServicePrice(String(Math.round(parseFloat(ps.price) * 1.5)));
                                                        setServiceMin(ps.min);
                                                        setServiceMax(ps.max);
                                                        let rawDesc = ps.note || ps.description || '';
                                                        setServiceDescription(cleanProviderDescription(rawDesc));
                                                        setAverageDuration(ps.average_time || '15 Menit');
                                                        if (ps.category) {
                                                          const cat = ps.category.toLowerCase();
                                                          if (cat.includes('instagram')) setServiceCategory('Instagram');
                                                          else if (cat.includes('tiktok')) setServiceCategory('TikTok');
                                                          else if (cat.includes('youtube')) setServiceCategory('YouTube');
                                                          else if (cat.includes('twitter') || cat.includes('x')) setServiceCategory('Twitter/X');
                                                          else setServiceCategory(ps.category);
                                                        }
                                                        setIsProviderServiceDropdownOpen(false);
                                                        setProviderServiceSearchQuery('');
                                                      }}
                                                      className="w-full text-left px-4 py-3 text-xs hover:bg-indigo-600/10 text-slate-350 hover:text-indigo-400 border-b border-slate-900/40 last:border-b-0 flex flex-col"
                                                    >
                                                      <span className="font-semibold truncate">[{ps.id}] {ps.name}</span>
                                                      <span className="text-[10px] text-slate-500 mt-0.5">
                                                        Rp {parseFloat(ps.price).toLocaleString()} | Kategori: {ps.category}
                                                      </span>
                                                    </button>
                                                  ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Icon Upload Option */}
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
                                    reader.onloadend = () => setServiceIcon(reader.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                                id="service-icon-upload"
                              />
                              <label
                                htmlFor="service-icon-upload"
                                className="bg-slate-950 border border-slate-800 text-slate-350 hover:text-slate-100 hover:border-indigo-500/50 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition-all inline-block"
                              >
                                Pilih File Gambar
                              </label>
                              {serviceIcon && (
                                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                                  <img src={serviceIcon} alt="Preview" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => setServiceIcon('')}
                                    className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-red-500 font-bold text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </form>
                      </div>

                      {/* Modal Footer */}
                      <div className="px-6 py-4 border-t border-slate-850 bg-slate-950/40 flex items-center justify-end gap-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowServiceFormModal(false);
                            setEditingServiceId(null);
                            setServiceName('');
                            setServiceDescription('');
                            setServicePrice('');
                          }}
                          className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-slate-100 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          form="service-form"
                          disabled={submittingService}
                          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/10 cursor-pointer flex items-center gap-1.5"
                        >
                          {submittingService ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          <span>{editingServiceId ? 'Simpan Perubahan' : 'Buat Layanan'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Provider Price Matcher */}
                <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-6 sm:p-8 rounded-3xl backdrop-blur-md">
                  <h3 className="font-bold text-base text-slate-200 mb-2 flex items-center gap-2">
                    <Search className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
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
                      className="flex-1 bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-250 px-4 py-3 rounded-2xl outline-none text-xs"
                    />
                    <button
                      type="submit"
                      disabled={loadingComparison}
                      className="bg-indigo-600 hover:bg-indigo-600 text-white disabled:opacity-55 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      {loadingComparison ? 'Membandingkan...' : 'Bandingkan Harga'}
                    </button>
                  </form>

                  {comparisonResults && (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* BuzzerPanel results */}
                      <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-850 p-5 rounded-2xl space-y-4">
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
                      <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-850 p-5 rounded-2xl space-y-4">
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
                                <div key={s.id} className={`p-3.5 rounded-xl flex items-center justify-between text-xs hover:border-slate-800 transition-all border ${isCheaper ? 'bg-emerald-950/10 border-emerald-500/20' : 'bg-slate-900/30 border-slate-850/60'
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
                                  <span className={`font-extrabold shrink-0 px-2 py-1 rounded border ${isCheaper ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10'
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
                <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-6 sm:p-8 rounded-3xl backdrop-blur-md">
                  <h3 className="font-bold text-base text-slate-200 mb-6 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    <span>{editingAnnId ? 'Edit Info Rekomendasi' : 'Buat Info Rekomendasi'}</span>
                  </h3>

                  <form onSubmit={handleSaveAnnouncement} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tag Badge</label>
                      <select
                        value={annBadge}
                        onChange={(e) => setAnnBadge(e.target.value)}
                        className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
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
                        className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Deskripsi / Detail Konten</label>
                      <textarea
                        required
                        rows={10}
                        placeholder="Masukkan pesan info detail rekomendasi di sini..."
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
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
                          className="bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-indigo-500/50 text-slate-350 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition-all inline-block hover:text-white"
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
                        <div className="mt-3 relative w-full h-32 rounded-xl overflow-hidden bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={annImageUrl} alt="Preview Banner" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {editingAnnId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAnnId(null);
                            setAnnTitle('');
                            setAnnContent('');
                            setAnnBadge('INFO');
                            setAnnImageUrl('');
                          }}
                          className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-3 rounded-2xl transition-all text-xs text-center cursor-pointer"
                        >
                          Batal
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={submittingAnn}
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {editingAnnId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{editingAnnId ? 'Simpan Perubahan' : 'Kirim Informasi'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Announcement lists */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl p-6">
                  <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider">Daftar Info Terkirim</h3>
                  <div className="divide-y divide-slate-850">
                    {announcements.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">Belum ada info diinput.</div>
                    ) : (
                      announcements.map(ann => (
                        <div key={ann.id} className="py-4 flex justify-between items-start gap-4">
                          <div className="text-xs text-left">
                            <div className="flex items-center gap-2">
                              {ann.badge && (
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${getAnnouncementBadgeClass(ann.badge)}`}>
                                  {ann.badge}
                                </span>
                              )}
                              <span className="font-bold text-slate-200">{ann.title}</span>
                              {ann.is_pinned && (
                                <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0 transform rotate-45" />
                              )}
                            </div>
                            <p className="text-slate-400 mt-1 font-light leading-relaxed">{ann.content}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleTogglePinAnnouncement(ann)}
                              className={`p-2 border rounded-xl cursor-pointer transition-all ${ann.is_pinned ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-slate-800/40 text-slate-450 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'}`}
                              title={ann.is_pinned ? "Lepas Pin" : "Pin Info"}
                            >
                              <Pin className={`w-3.5 h-3.5 ${ann.is_pinned ? 'fill-amber-500' : ''}`} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingAnnId(ann.id);
                                setAnnBadge(ann.badge || 'INFO');
                                setAnnTitle(ann.title);
                                setAnnContent(ann.content);
                                setAnnImageUrl(ann.image_url || '');
                              }}
                              className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white dark:hover:text-white rounded-xl cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
                              title="Edit Info"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAnn(ann.id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl cursor-pointer"
                              title="Hapus Info"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Transactions & Balances Logs */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">

                {/* Transaction Logs Table */}
                <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl p-6 sm:p-8 backdrop-blur-md">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span>Log Transaksi Sistem</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search Input */}
                      <div className="relative w-full sm:w-60">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-555" />
                        <input
                          type="text"
                          placeholder="Cari user, email, atau ID..."
                          value={searchTermTransactions}
                          onChange={(e) => setSearchTermTransactions(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 pl-10 pr-4 py-2 rounded-2xl outline-none transition-all text-xs"
                        />
                      </div>

                      {/* Type Filter */}
                      <select
                        value={typeFilterTransactions}
                        onChange={(e) => setTypeFilterTransactions(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-2xl outline-none text-xs font-bold transition-all cursor-pointer"
                      >
                        <option value="all">Semua Tipe</option>
                        <option value="topup">Topup</option>
                        <option value="order_payment">Order</option>
                        <option value="refund">Refund</option>
                      </select>

                      {/* Status Filter */}
                      <select
                        value={statusFilterTransactions}
                        onChange={(e) => setStatusFilterTransactions(e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-2xl outline-none text-xs font-bold transition-all cursor-pointer"
                      >
                        <option value="all">Semua Status</option>
                        <option value="success">Sukses</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Gagal / Batal</option>
                      </select>
                    </div>
                  </div>

                  {/* Transactions list */}
                  {filteredTransactions.length === 0 ? (
                    <div className="py-16 text-center text-slate-550 text-xs">Tidak ada riwayat transaksi ditemukan.</div>
                  ) : (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-455 font-bold uppercase tracking-wider">
                              <th className="py-4 px-4">User</th>
                              <th className="py-4 px-4">Tipe</th>
                              <th className="py-4 px-4">Jumlah</th>
                              <th className="py-4 px-4">Metode</th>
                              <th className="py-4 px-4 text-center">Status</th>
                              <th className="py-4 px-4">Tanggal & Waktu</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/30">
                            {filteredTransactions
                              .slice((transactionsPage - 1) * itemsPerPage, transactionsPage * itemsPerPage)
                              .map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-850/15 transition-colors">
                                  <td className="py-4 px-4">
                                    <span className="font-extrabold text-slate-200 block max-w-[170px] truncate">{tx.profiles?.username || tx.profiles?.email || 'User'}</span>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">{tx.profiles?.email || '-'}</span>
                                    <span className="text-[9px] text-slate-600 font-mono block mt-0.5">
                                      {tx.tx_id ? `TRX-${tx.tx_id}` : tx.id.slice(0, 8)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
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
                                  <td className="py-4 px-4 font-bold">
                                    <span className={tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                      {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 font-mono text-[10px] uppercase text-indigo-400 font-extrabold">{tx.payment_method || '-'}</td>
                                  <td className="py-4 px-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-block ${
                                      tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' :
                                      tx.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    }`}>
                                      {tx.status === 'success' ? 'Sukses' : tx.status === 'failed' ? 'Dibatalkan' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-slate-500">
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

                      {/* Mobile responsive cards list for transactions */}
                      <div className="block md:hidden divide-y divide-slate-800/40">
                        {filteredTransactions
                          .slice((transactionsPage - 1) * itemsPerPage, transactionsPage * itemsPerPage)
                          .map(tx => (
                            <div key={tx.id} className="py-4 space-y-2 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-slate-400 text-[10px]">
                                  {tx.tx_id ? `TRX-${tx.tx_id}` : tx.id.slice(0, 8)}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(tx.created_at).toLocaleString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium">User:</span>
                                  <span className="font-extrabold text-slate-200 truncate max-w-[180px]">{tx.profiles?.username || tx.profiles?.email || 'User'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium">Tipe / Metode:</span>
                                  <span className="font-medium text-slate-200">
                                    {tx.type === 'topup' ? (
                                      <span className="text-emerald-400 font-bold">Topup</span>
                                    ) : tx.type === 'refund' ? (
                                      <span className="text-blue-400 font-bold">Refund</span>
                                    ) : (
                                      <span className="text-slate-350 font-bold">Order</span>
                                    )}{' '}
                                    <span className="text-[10px] font-mono text-indigo-400 font-extrabold bg-slate-950 px-2 py-0.5 rounded uppercase">
                                      {tx.payment_method || '-'}
                                    </span>
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium">Jumlah:</span>
                                  <span className={`font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-450'}`}>
                                    {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400 font-medium">Status:</span>
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider inline-block ${tx.status === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold shadow-sm shadow-emerald-500/30' :
                                    tx.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold shadow-sm shadow-rose-500/30' :
                                      'bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/30'
                                    }`}>
                                    {tx.status === 'success' ? 'Sukses' : tx.status === 'failed' ? 'Dibatalkan' : 'Belum Dibayar'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
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
              <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl p-6 sm:p-8 backdrop-blur-md w-full">
                <h3 className="font-bold text-base text-slate-250 mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                  <span>Pengaturan Landing Page</span>
                </h3>

                {loadingLandingSettings ? (
                  <div className="py-12 text-center text-slate-400">Loading settings...</div>
                ) : (
                  <form onSubmit={handleSaveLandingSettings} className="space-y-6">
                    <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                      <h4 className="font-bold text-sm text-indigo-500 dark:text-indigo-400 border-b border-slate-900 pb-2">Branding (Logo & Favicon)</h4>

                      <div className="grid sm:grid-cols-3 gap-6">
                        {/* Brand Title */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Website / Brand</label>
                          <input
                            type="text"
                            value={landingSettings.site_title || ''}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, site_title: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-semibold"
                            placeholder="e.g. Buzzify"
                          />
                        </div>

                        {/* Logo Upload / URL */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Logo Website</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setLandingSettings(prev => ({ ...prev, logo_url: reader.result as string }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                              id="brand-logo-upload"
                            />
                            <label
                              htmlFor="brand-logo-upload"
                              className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-350 px-4 py-3 rounded-xl cursor-pointer text-xs font-bold transition-all flex items-center gap-2 hover:text-white shrink-0"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Logo</span>
                            </label>
                            {landingSettings.logo_url && (
                              <button
                                type="button"
                                onClick={() => setLandingSettings(prev => ({ ...prev, logo_url: '' }))}
                                className="text-xs text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={landingSettings.logo_url || ''}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl outline-none text-[10px] font-mono"
                            placeholder="Atau masukkan URL logo..."
                          />
                          {landingSettings.logo_url && (
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-805 flex items-center justify-center p-1 mt-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={landingSettings.logo_url} alt="Preview Logo" className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>

                        {/* Favicon Upload / URL */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Favicon Icon</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setLandingSettings(prev => ({ ...prev, favicon_url: reader.result as string }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="hidden"
                              id="brand-favicon-upload"
                            />
                            <label
                              htmlFor="brand-favicon-upload"
                              className="bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-350 px-4 py-3 rounded-xl cursor-pointer text-xs font-bold transition-all flex items-center gap-2 hover:text-white shrink-0"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Favicon</span>
                            </label>
                            {landingSettings.favicon_url && (
                              <button
                                type="button"
                                onClick={() => setLandingSettings(prev => ({ ...prev, favicon_url: '' }))}
                                className="text-xs text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={landingSettings.favicon_url || ''}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, favicon_url: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl outline-none text-[10px] font-mono"
                            placeholder="Atau masukkan URL favicon..."
                          />
                          {landingSettings.favicon_url && (
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-950 border border-slate-805 flex items-center justify-center p-1 mt-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={landingSettings.favicon_url} alt="Preview Favicon" className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live Chat Toggle */}
                      <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Integrasi Live Chat (Crisp)</label>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Tampilkan balon obrolan Crisp di pojok kanan bawah landing page untuk melayani pelanggan.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={landingSettings.show_live_chat === 'true'}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, show_live_chat: e.target.checked ? 'true' : 'false' }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                        </label>
                      </div>

                      {/* Mobile Bottom Navigation Toggle */}
                      <div className="pt-4 border-t border-slate-900 flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Navbar Bawah Mobile</label>
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Tampilkan menu navigasi bawah (bottom bar) di tampilan HP. Matikan jika ingin menyembunyikan menu bawah.</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={landingSettings.show_mobile_nav !== 'false'}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, show_mobile_nav: e.target.checked ? 'true' : 'false' }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                        </label>
                      </div>
                    </div>

                    {/* Hero Section settings */}
                    <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                      <h4 className="font-bold text-sm text-indigo-500 dark:text-indigo-400 border-b border-slate-900 pb-2">Hero Section</h4>

                      <div>
                        <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Hero Badge Text</label>
                        <input
                          type="text"
                          value={landingSettings.hero_badge || ''}
                          onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_badge: e.target.value }))}
                          className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                          placeholder="e.g. Platform Buzzer Terpercaya & Tercepat di Indonesia"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2">Hero Title Heading (Gunakan **kata** untuk teks gradient)</label>
                        <input
                          type="text"
                          value={landingSettings.hero_title || ''}
                          onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_title: e.target.value }))}
                          className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                          placeholder="e.g. Tingkatkan **Popularitas Medsos** Anda dengan Proses Cepat!"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Hero Subtitle</label>
                        <textarea
                          value={landingSettings.hero_subtitle || ''}
                          onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                          rows={3}
                          className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs resize-none"
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
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2">Hero Secondary Button Text</label>
                          <input
                            type="text"
                            value={landingSettings.hero_cta_sub_text || ''}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, hero_cta_sub_text: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Statistics settings */}
                    <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                      <h4 className="font-bold text-sm text-indigo-500 dark:text-indigo-400 border-b border-slate-900 pb-2">Angka Statistik (Stats Counters)</h4>

                      <div className="grid sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Pesanan Sukses</label>
                          <input
                            type="text"
                            value={landingSettings.stats_orders || ''}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, stats_orders: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-3 py-2.5 rounded-xl outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Pelanggan Aktif</label>
                          <input
                            type="text"
                            value={landingSettings.stats_clients || ''}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, stats_clients: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-3 py-2.5 rounded-xl outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Keberhasilan</label>
                          <input
                            type="text"
                            value={landingSettings.stats_success || ''}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, stats_success: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-3 py-2.5 rounded-xl outline-none text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-455 uppercase tracking-wider mb-2">Total Layanan (Fallback jika DB Kosong)</label>
                          <input
                            type="text"
                            value={landingSettings.stats_speed || ''}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, stats_speed: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-3 py-2.5 rounded-xl outline-none text-xs"
                            placeholder="Contoh: 100+"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Informasi Tambahan per Kategori */}
                    <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                      <h4 className="font-bold text-sm text-indigo-500 dark:text-indigo-400 border-b border-slate-900 pb-2">Informasi Tambahan per Kategori (Form Pemesanan)</h4>

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
                          className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                          placeholder={`Contoh: Penting ${selectedWarningCategory.toUpperCase()}:`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Konten Peringatan (Gunakan **teks** untuk menebalkan kata)</label>
                        <textarea
                          value={landingSettings[`warning_desc_${selectedWarningCategory}`] || ''}
                          onChange={(e) => setLandingSettings(prev => ({ ...prev, [`warning_desc_${selectedWarningCategory}`]: e.target.value }))}
                          rows={6}
                          className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs resize-y"
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
                              className="bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:border-indigo-500/50 text-slate-350 px-4 py-3 rounded-2xl cursor-pointer text-xs font-semibold transition-all inline-block hover:text-white"
                            >
                              Pilih File Gambar
                            </label>
                            {landingSettings[`warning_image_url_${selectedWarningCategory}`] && (
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center shrink-0">
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
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                            placeholder="Contoh: https://youtube.com/watch?v=..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pengaturan Deposit & Bonus */}
                    <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                      <h4 className="font-bold text-sm text-indigo-500 dark:text-indigo-400 border-b border-slate-900 pb-2">Pengaturan Deposit & Bonus</h4>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Minimal Deposit untuk Bonus (Rp)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumberWithDots(landingSettings.deposit_bonus_min)}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, deposit_bonus_min: e.target.value.replace(/\D/g, '') }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-semibold"
                            placeholder="Contoh: 10.000"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Persentase Bonus Deposit (%)</label>
                          <input
                            type="number"
                            value={landingSettings.deposit_bonus_percent || ''}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, deposit_bonus_percent: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                            placeholder="Contoh: 11"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pengaturan Referral & Afiliasi */}
                    <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                      <h4 className="font-bold text-sm text-indigo-500 dark:text-indigo-400 border-b border-slate-900 pb-2">Pengaturan Referral & Afiliasi</h4>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Status Sistem Referral</label>
                          <select
                            value={landingSettings.referral_enabled || 'false'}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, referral_enabled: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-bold transition-all cursor-pointer"
                          >
                            <option value="true">Aktif (Enabled)</option>
                            <option value="false">Nonaktif (Disabled)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Persentase Komisi (%)</label>
                          <input
                            type="number"
                            value={landingSettings.referral_commission_percent || '0'}
                            onChange={(e) => setLandingSettings(prev => ({ ...prev, referral_commission_percent: e.target.value }))}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs"
                            placeholder="Contoh: 5"
                            min="0"
                            max="100"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Syarat & Ketentuan settings */}
                    <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-900 space-y-4">
                      <h4 className="font-bold text-sm text-indigo-500 dark:text-indigo-400 border-b border-slate-900 pb-2">Konten Syarat & Ketentuan</h4>
                      <div>
                        <label className="block text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Isi Syarat & Ketentuan (Mendukung format HTML/Teks biasa)</label>
                        <textarea
                          rows={15}
                          value={landingSettings.terms_content || ''}
                          onChange={(e) => setLandingSettings(prev => ({ ...prev, terms_content: e.target.value }))}
                          className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-3 rounded-xl outline-none text-xs font-semibold font-mono"
                          placeholder="Masukkan isi syarat & ketentuan di sini. Kosongkan untuk menggunakan konten bawaan default."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={savingLandingSettings}
                        className="bg-indigo-600 hover:bg-indigo-600 text-white disabled:opacity-50 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        {savingLandingSettings ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            {/* Tab: Tickets Bantuan Management */}
            {activeTab === 'tickets' && (() => {
              const filteredTickets = tickets.filter(t => {
                if (ticketStatusFilter !== 'all' && t.status !== ticketStatusFilter) return false;
                const q = ticketSearchQuery.toLowerCase().trim();
                if (!q) return true;
                if (ticketSearchType === 'id') {
                  return String(t.id).includes(q);
                } else if (ticketSearchType === 'subject') {
                  return String(t.subject).toLowerCase().includes(q);
                } else {
                  return String(t.username || '').toLowerCase().includes(q) || String(t.full_name || '').toLowerCase().includes(q);
                }
              });

              return (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Filter controls */}
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl backdrop-blur-md">
                    <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider">Kelola Tiket Bantuan</h3>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Search query */}
                      <div className="flex gap-2 w-full md:w-auto">
                        <select
                          value={ticketSearchType}
                          onChange={(e) => setTicketSearchType(e.target.value)}
                          className="bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-3 py-2 rounded-xl outline-none text-xs"
                        >
                          <option value="id">ID</option>
                          <option value="subject">Subjek</option>
                          <option value="username">Username</option>
                        </select>
                        <div className="relative flex-1 md:w-64">
                          <input
                            type="text"
                            placeholder="Cari..."
                            value={ticketSearchQuery}
                            onChange={(e) => setTicketSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 pl-4 pr-10 py-2.5 rounded-xl outline-none text-xs"
                          />
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        </div>
                      </div>

                      {/* Status filter pills */}
                      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                        {['all', 'Pending', 'Answered', 'Closed'].map((status) => (
                          <button
                            key={status}
                            onClick={() => setTicketStatusFilter(status)}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${ticketStatusFilter === status
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/15'
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                              }`}
                          >
                            {status === 'all' ? 'Semua' : status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bulk Action Bar for Tickets */}
                  {selectedTicketIds.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-indigo-500/10 border border-indigo-500/20 px-6 py-4 rounded-3xl mb-4 gap-3 animate-in slide-in-from-top-2 duration-200">
                      <div className="text-xs text-indigo-650 dark:text-indigo-400 font-extrabold flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>{selectedTicketIds.length} Tiket Terpilih</span>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={handleBulkCloseTickets}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
                        >
                          Tutup Tiket
                        </button>
                        <button
                          onClick={handleBulkDeleteTickets}
                          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md shadow-red-500/10 cursor-pointer transition-all active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus Permanen
                        </button>
                        <button
                          onClick={() => setSelectedTicketIds([])}
                          className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-350 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tickets table list */}
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl p-6">
                    <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-850">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-850 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                            <th className="py-4 px-6 w-10">
                              <input
                                type="checkbox"
                                checked={
                                  filteredTickets.length > 0 &&
                                  filteredTickets.every(t => selectedTicketIds.includes(t.id))
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const newIds = filteredTickets.map(t => t.id);
                                    setSelectedTicketIds(prev => Array.from(new Set([...prev, ...newIds])));
                                  } else {
                                    const pageIds = filteredTickets.map(t => t.id);
                                    setSelectedTicketIds(prev => prev.filter(id => !pageIds.includes(id)));
                                  }
                                }}
                                className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                            </th>
                            <th className="py-4 px-6">ID</th>
                            <th className="py-4 px-6">User</th>
                            <th className="py-4 px-6">Subjek</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6">Pembaruan</th>
                            <th className="py-4 px-6 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {filteredTickets.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                                Tidak ada tiket bantuan yang ditemukan.
                              </td>
                            </tr>
                          ) : (
                            filteredTickets.map(t => (
                              <tr key={t.id} className="hover:bg-slate-900/20 text-xs text-slate-300">
                                <td className="py-4 px-6 w-10">
                                  <input
                                    type="checkbox"
                                    checked={selectedTicketIds.includes(t.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedTicketIds(prev => [...prev, t.id]);
                                      } else {
                                        setSelectedTicketIds(prev => prev.filter(id => id !== t.id));
                                      }
                                    }}
                                    className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                                  />
                                </td>
                                <td className="py-4 px-6 font-mono font-bold text-slate-500">#{t.id}</td>
                                <td className="py-4 px-6">
                                  <div className="font-bold text-slate-200">{t.full_name || 'User'}</div>
                                  <div className="text-[10px] text-slate-500">@{t.username || 'username'}</div>
                                </td>
                                <td className="py-4 px-6 font-semibold text-indigo-500 dark:text-indigo-400">
                                  {t.subject}
                                  {t.status === 'Pending' && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">NEW</span>
                                  )}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getTicketStatusBadgeClass(t.status)}`}>
                                    {t.status}
                                  </span>
                                </td>
                                <td className="py-4 px-6 font-medium text-slate-500">
                                  {new Date(t.updated_at).toLocaleString('id-ID', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => fetchTicketDetails(t.id)}
                                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold transition-all cursor-pointer"
                                    >
                                      Balas
                                    </button>
                                    {t.status !== 'Closed' && (
                                      <button
                                        onClick={() => handleCloseTicket(t.id)}
                                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-705 text-slate-350 text-[10px] font-bold transition-all cursor-pointer"
                                      >
                                        Tutup Tiket
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteTicket(t.id)}
                                      className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-650 text-red-500 hover:text-white transition-all cursor-pointer"
                                      title="Hapus Tiket"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View (Responsive Card List) */}
                    <div className="block md:hidden space-y-4">
                      {filteredTickets.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/20 rounded-2xl border border-slate-850">
                          Tidak ada tiket bantuan yang ditemukan.
                        </div>
                      ) : (
                        filteredTickets.map(t => (
                          <div
                            key={t.id}
                            className="p-5 rounded-[24px] border border-slate-800 bg-slate-950/40 space-y-3.5 transition-all"
                          >
                            {/* Row 1: ID & Date */}
                            <div className="flex justify-between items-center text-[10px] gap-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedTicketIds.includes(t.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTicketIds(prev => [...prev, t.id]);
                                    } else {
                                      setSelectedTicketIds(prev => prev.filter(id => id !== t.id));
                                    }
                                  }}
                                  className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span className="px-2.5 py-1 font-mono text-[9px] text-slate-350 bg-slate-900/50 border border-slate-800 rounded-xl font-bold">
                                  ID: #{t.id}
                                </span>
                              </div>
                              <span className="text-slate-500 font-medium">
                                {new Date(t.updated_at).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            {/* Row 2: User Info */}
                            <div className="pt-1">
                              <span className="text-slate-500 block text-[8px] uppercase tracking-widest font-black mb-1">Pengirim</span>
                              <div className="font-extrabold text-slate-200 text-xs">{t.full_name || 'User'}</div>
                              <div className="text-[10px] text-slate-400">@{t.username || 'username'}</div>
                            </div>

                            {/* Row 3: Subject & Status */}
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <span className="text-slate-500 block text-[8px] uppercase tracking-widest font-black">Subjek</span>
                                <div className="font-bold text-indigo-400 text-sm">
                                  {t.subject}
                                  {t.status === 'Pending' && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[8px] font-black bg-indigo-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">NEW</span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right space-y-1 shrink-0">
                                <span className="text-slate-500 block text-[8px] uppercase tracking-widest font-black">Status</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${getTicketStatusBadgeClass(t.status)}`}>
                                  {t.status}
                                </span>
                              </div>
                            </div>

                            {/* Row 4: Action Buttons */}
                            <div className="pt-3 border-t border-slate-800 flex gap-2 justify-end items-center">
                              <button
                                onClick={() => handleDeleteTicket(t.id)}
                                className="p-2 rounded-2xl bg-red-500/10 hover:bg-red-650 hover:text-white text-red-500 transition-all cursor-pointer shrink-0"
                                title="Hapus Tiket"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              {t.status !== 'Closed' && (
                                <button
                                  onClick={() => handleCloseTicket(t.id)}
                                  className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-705 text-slate-350 text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Tutup Tiket
                                </button>
                              )}
                              <button
                                onClick={() => fetchTicketDetails(t.id)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-600/15"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Balas</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tab: Kelola User */}
            {activeTab === 'users' && (() => {
              const filtered = userProfiles.filter(u => {
                if (!u) return false;
                const q = userSearchTerm.toLowerCase().trim();
                if (!q) return true;
                return (
                  String(u.email || '').toLowerCase().includes(q) ||
                  String(u.username || '').toLowerCase().includes(q) ||
                  String(u.full_name || '').toLowerCase().includes(q)
                );
              });
              const totalPages = Math.ceil(filtered.length / itemsPerPage);
              const paginatedUsers = filtered.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage);

              return (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Total User</span>
                      <span className="text-2xl font-black text-slate-100">{userProfiles.length}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Admin</span>
                      <span className="text-2xl font-black text-indigo-400">{userProfiles.filter(u => u?.role === 'admin').length}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">User Aktif</span>
                      <span className="text-2xl font-black text-emerald-400">{userProfiles.filter(u => u?.role === 'user').length}</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800/80 p-5 rounded-3xl">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Total Saldo</span>
                      <span className="text-lg font-black text-amber-400">{formatPrice(userProfiles.reduce((sum, u) => sum + (Number(u?.balance) || 0), 0))}</span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-400" />
                        Daftar User
                      </h2>
                      <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Cari email, username, nama..."
                          value={userSearchTerm}
                          onChange={e => setUserSearchTerm(e.target.value)}
                          className="w-full bg-slate-950/50 border border-slate-800 focus:border-indigo-500 text-slate-200 pl-9 pr-4 py-2.5 rounded-xl outline-none text-xs font-medium"
                        />
                      </div>
                    </div>

                    {paginatedUsers.length === 0 ? (
                      <div className="py-16 text-center text-slate-500 text-xs">
                        <Users className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                        <p>Tidak ada user yang ditemukan.</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-850 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                                <th className="py-3 px-4">User</th>
                                <th className="py-3 px-4">Role</th>
                                <th className="py-3 px-4">Saldo</th>
                                <th className="py-3 px-4">Bergabung</th>
                                <th className="py-3 px-4 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/40">
                              {paginatedUsers.map((u: any) => (
                                <tr key={u.id} className="hover:bg-slate-800/20 transition-colors">
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                        {(u.full_name || u.email || '?')[0].toUpperCase()}
                                      </div>
                                      <div>
                                        <span className="block font-bold text-slate-100">{u.full_name || u.username || '-'}</span>
                                        <span className="block text-[10px] text-slate-400 font-mono">{u.email}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'bg-slate-800 text-slate-400 border border-slate-750'}`}>
                                      {u.role || 'user'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-emerald-400">{formatPrice(Number(u.balance) || 0)}</td>
                                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[10px]">
                                    {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                  </td>
                                  <td className="py-3.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setSelectedEditUser(u);
                                          setEditFullName(u.full_name || '');
                                          setEditUsername(u.username || '');
                                          setEditEmail(u.email || '');
                                          setEditWhatsapp(u.whatsapp || '');
                                          setEditPassword('');
                                          setEditRole(u.role === 'admin' ? 'admin' : 'user');
                                          setEditUserError(null);
                                          setShowEditUserModal(true);
                                        }}
                                        title="Edit User"
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-all cursor-pointer border border-indigo-200 dark:border-indigo-500/20 active:scale-95 shadow-sm"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedUserForBalance(u);
                                          setAdjustmentAmount('');
                                          setAdjustmentType('add');
                                          setAdjustmentReason('');
                                          setBalanceError(null);
                                          setShowBalanceModal(true);
                                        }}
                                        title="Kelola Saldo"
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-450 hover:text-white transition-all cursor-pointer border border-emerald-200 dark:border-emerald-500/20 active:scale-95 shadow-sm"
                                      >
                                        <Wallet className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="block md:hidden space-y-3">
                          {paginatedUsers.map((u: any) => (
                            <div key={u.id} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                                  {(u.full_name || u.email || '?')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="block font-bold text-slate-100 text-xs">{u.full_name || u.username || '-'}</span>
                                  <span className="block text-[10px] text-slate-400 truncate">{u.email}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${u.role === 'admin' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                                  {u.role || 'user'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400">Saldo:</span>
                                <span className="font-bold text-emerald-400">{formatPrice(Number(u.balance) || 0)}</span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedEditUser(u);
                                    setEditFullName(u.full_name || '');
                                    setEditUsername(u.username || '');
                                    setEditEmail(u.email || '');
                                    setEditWhatsapp(u.whatsapp || '');
                                    setEditPassword('');
                                    setEditUserError(null);
                                    setShowEditUserModal(true);
                                  }}
                                  title="Edit User"
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-500/10 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 text-[10px] font-bold transition-all cursor-pointer border border-slate-300 dark:border-slate-750 hover:border-amber-400 dark:hover:border-amber-500/30 active:scale-95"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUserForBalance(u);
                                    setAdjustmentAmount('');
                                    setAdjustmentType('add');
                                    setAdjustmentReason('');
                                    setBalanceError(null);
                                    setShowBalanceModal(true);
                                  }}
                                  className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white text-[10px] font-bold transition-all cursor-pointer border border-indigo-200 dark:border-indigo-500/20 active:scale-95"
                                >
                                  <Wallet className="w-3.5 h-3.5" />
                                  Kelola Saldo
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex justify-between items-center gap-2 pt-5 border-t border-slate-850 mt-5">
                            <button
                              disabled={usersPage === 1}
                              onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                              className="bg-slate-950 hover:bg-slate-900 border border-slate-850 disabled:opacity-40 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >Sebelumnya</button>
                            <span className="text-xs text-slate-400 font-medium">
                              Halaman {usersPage} dari {totalPages} ({filtered.length} user)
                            </span>
                            <button
                              disabled={usersPage >= totalPages}
                              onClick={() => setUsersPage(p => p + 1)}
                              className="bg-slate-950 hover:bg-slate-900 border border-slate-850 disabled:opacity-40 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >Selanjutnya</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Tab: Midtrans Report (Dribbble-inspired UI) */}
            {activeTab === 'midtrans' && (() => {
              const filtered = midtransTransactions.filter(tx => {
                const searchLower = searchTermMidtrans.toLowerCase();
                const matchesSearch = 
                  (tx.email || '').toLowerCase().includes(searchLower) ||
                  (tx.username || '').toLowerCase().includes(searchLower) ||
                  (tx.id || '').toLowerCase().includes(searchLower) ||
                  (tx.reference_id || '').toLowerCase().includes(searchLower) ||
                  (tx.tx_id && String(tx.tx_id).includes(searchLower));

                const matchesStatus = 
                  statusFilterMidtrans === 'all' || 
                  tx.status === statusFilterMidtrans;

                return matchesSearch && matchesStatus;
              });

              const totalPages = Math.ceil(filtered.length / itemsPerPage);
              const paginated = filtered.slice((midtransPage - 1) * itemsPerPage, midtransPage * itemsPerPage);

              const handleExportCSV = () => {
                const headers = ["ID Transaksi", "Email", "Username", "Nominal", "Metode", "Status", "Keterangan", "Tanggal"];
                const rows = filtered.map(tx => [
                  tx.tx_id ? `TRX-${tx.tx_id}` : tx.id,
                  tx.email || "",
                  tx.username || "",
                  tx.amount,
                  tx.payment_method || "",
                  tx.status,
                  `"${(tx.description || '').replace(/"/g, '""')}"`,
                  new Date(tx.created_at).toISOString()
                ]);
                
                const csvContent = "data:text/csv;charset=utf-8," 
                  + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `laporan_midtrans_${new Date().toISOString().slice(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              };

              return (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* Top Dribbble Grid: Main Balance Card & Stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Glassmorphism Balance Card */}
                    <div className="lg:col-span-1 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between min-h-[220px]">
                      {/* Decorative background glow circles */}
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-pink-400/20 rounded-full blur-lg pointer-events-none" />
                      
                      <div className="relative z-10 flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-100 opacity-90 block">Saldo Midtrans Terproses</span>
                          <h2 className="text-3xl font-black mt-2 tracking-tight">
                            {formatPrice(midtransStats?.totalVolume || 0)}
                          </h2>
                        </div>
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-xl text-[9px] font-black tracking-wider uppercase border border-white/10">
                          Live Volume
                        </span>
                      </div>

                      <div className="relative z-10 space-y-4 mt-6">
                        <p className="text-[10px] text-indigo-50 leading-relaxed max-w-[90%]">
                          Representasi total volume pembayaran sukses melalui gerbang pembayaran Midtrans.
                        </p>
                        
                        <div className="flex gap-2.5">
                          <button
                            onClick={handleSyncMidtrans}
                            disabled={syncingMidtrans}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-black transition-all shadow-md active:scale-95 disabled:opacity-75"
                          >
                            {syncingMidtrans ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Sinkronisasi Status
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stats Dashboard Grid */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Stat 1 */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 group">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold text-xs">Transaksi Hari Ini</span>
                          <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-black">
                            {midtransStats?.todayCount || 0} Trx
                          </span>
                        </div>
                        <div className="mt-4">
                          <span className="text-[10px] text-slate-550 block">Volume hari ini</span>
                          <span className="text-xl font-extrabold text-slate-200 block mt-1">
                            {formatPrice(midtransStats?.todayVolume || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Stat 2 */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 group">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold text-xs">Transaksi Bulan Ini</span>
                          <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-xs font-black">
                            {midtransStats?.monthCount || 0} Trx
                          </span>
                        </div>
                        <div className="mt-4">
                          <span className="text-[10px] text-slate-550 block">Volume bulan ini</span>
                          <span className="text-xl font-extrabold text-slate-200 block mt-1">
                            {formatPrice(midtransStats?.monthVolume || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Stat 3 */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 group">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold text-xs">Pending Volume</span>
                          <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 text-xs font-black">
                            {midtransStats?.pendingCount || 0} Pending
                          </span>
                        </div>
                        <div className="mt-4">
                          <span className="text-[10px] text-slate-550 block">Nominal belum terbayar</span>
                          <span className="text-xl font-extrabold text-slate-200 block mt-1">
                            {formatPrice(midtransStats?.pendingVolume || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Stat 4 */}
                      <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between hover:border-slate-700/80 transition-all duration-200 group">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold text-xs">Total Transaksi (All Time)</span>
                          <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400 text-xs font-black">
                            {midtransStats?.totalCount || 0} Total
                          </span>
                        </div>
                        <div className="mt-4">
                          <span className="text-[10px] text-slate-550 block">Rasio Sukses</span>
                          <span className="text-xl font-extrabold text-slate-200 block mt-1">
                            {midtransStats?.totalCount > 0 
                              ? `${Math.round((midtransStats.successCount / midtransStats.totalCount) * 100)}%`
                              : '0%'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Feed Section */}
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl p-6 sm:p-8 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-slate-200">Riwayat Pembayaran Midtrans</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5">Daftar transaksi deposit instan menggunakan gerbang pembayaran Midtrans.</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* Search Input */}
                        <div className="relative w-full sm:w-60">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                          <input
                            type="text"
                            placeholder="Cari user email atau username..."
                            value={searchTermMidtrans}
                            onChange={(e) => setSearchTermMidtrans(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 text-slate-100 focus:border-indigo-500 pl-10 pr-4 py-2 rounded-2xl outline-none transition-all text-xs"
                          />
                        </div>

                        {/* Status Filter */}
                        <select
                          value={statusFilterMidtrans}
                          onChange={(e) => setStatusFilterMidtrans(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-300 px-3.5 py-2 rounded-2xl outline-none text-xs font-bold transition-all cursor-pointer"
                        >
                          <option value="all">Semua Status</option>
                          <option value="success">Sukses</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Gagal</option>
                        </select>

                        {/* Export Button */}
                        <button
                          onClick={handleExportCSV}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-850 hover:bg-slate-850 text-slate-205 text-xs font-bold transition-all cursor-pointer border border-slate-800"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    {loadingMidtrans ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-xs font-medium">Memuat data Midtrans...</span>
                      </div>
                    ) : paginated.length === 0 ? (
                      <div className="py-20 text-center text-slate-550 text-xs border border-dashed border-slate-800 rounded-2xl">
                        Tidak ada riwayat transaksi Midtrans ditemukan.
                      </div>
                    ) : (
                      <>
                        {/* Table layout for larger screens */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-slate-850 text-slate-450 font-bold uppercase tracking-wider">
                                <th className="py-4 px-4">User</th>
                                <th className="py-4 px-4">ID Order</th>
                                <th className="py-4 px-4">Nominal</th>
                                <th className="py-4 px-4">Metode</th>
                                <th className="py-4 px-4 text-center">Status</th>
                                <th className="py-4 px-4">Keterangan</th>
                                <th className="py-4 px-4">Tanggal & Waktu</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/30">
                              {paginated.map(tx => (
                                <tr key={tx.id} className="hover:bg-slate-850/15 transition-colors">
                                  <td className="py-4 px-4">
                                    <span className="font-extrabold text-slate-200 block">{tx.username || 'No Username'}</span>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">{tx.email}</span>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded-md text-[10px]">
                                      {tx.tx_id ? `TRX-${tx.tx_id}` : tx.id.slice(0, 8)}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 font-bold text-slate-105">
                                    {formatPrice(tx.amount)}
                                  </td>
                                  <td className="py-4 px-4 font-mono text-[10px] uppercase text-indigo-400 font-extrabold">
                                    {tx.payment_method || 'midtrans'}
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-block ${
                                      tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm' :
                                      tx.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    }`}>
                                      {tx.status === 'success' ? 'Sukses' : tx.status === 'failed' ? 'Gagal' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 max-w-xs text-slate-400" title={tx.description || '-'}>
                                    <span className="block text-[11px] leading-relaxed whitespace-normal break-words line-clamp-3">
                                      {tx.description || '-'}
                                    </span>
                                  </td>

                                  <td className="py-4 px-4 text-slate-500">
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

                        {/* Mobile list view */}
                        <div className="block md:hidden space-y-4">
                          {paginated.map(tx => (
                            <div key={tx.id} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="block font-bold text-slate-200">{tx.username || 'No Username'}</span>
                                  <span className="block text-[10px] text-slate-550">{tx.email}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                  tx.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                  'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {tx.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-y-2 text-xs border-t border-slate-850 pt-2.5">
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Order ID</span>
                                  <span className="font-mono text-slate-300">{tx.tx_id ? `TRX-${tx.tx_id}` : tx.id.slice(0, 8)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Nominal</span>
                                  <span className="font-extrabold text-slate-200">{formatPrice(tx.amount)}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] block">Metode</span>
                                  <span className="font-mono text-indigo-400 font-bold uppercase">{tx.payment_method}</span>
                                </div>
                                <div>
                                  <span className="text-slate-550 text-[10px] block">Tanggal</span>
                                  <span className="text-slate-400">
                                    {new Date(tx.created_at).toLocaleString('id-ID', {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination controls */}
                        {totalPages > 1 && (
                          <div className="flex justify-between items-center gap-2 pt-5 border-t border-slate-850 mt-5">
                            <button
                              disabled={midtransPage === 1}
                              onClick={() => setMidtransPage(p => Math.max(1, p - 1))}
                              className="bg-slate-950 hover:bg-slate-900 border border-slate-850 disabled:opacity-40 text-slate-350 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Sebelumnya
                            </button>
                            <span className="text-xs text-slate-400 font-medium">
                              Halaman {midtransPage} dari {totalPages} ({filtered.length} transaksi)
                            </span>
                            <button
                              disabled={midtransPage >= totalPages}
                              onClick={() => setMidtransPage(p => p + 1)}
                              className="bg-slate-950 hover:bg-slate-900 border border-slate-850 disabled:opacity-40 text-slate-350 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Selanjutnya
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Admin Ticket Detail Chat Modal */}
            {selectedTicket && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-2xl bg-white text-zinc-900 border border-zinc-200 p-6 sm:p-8 rounded-[32px] shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-zinc-100 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-200/50">
                          Tiket #{selectedTicket.id}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getTicketStatusBadgeClass(selectedTicket.status)}`}>
                          {selectedTicket.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-zinc-955 tracking-tight">Subjek: {selectedTicket.subject}</h3>
                      {selectedTicket.subject === 'Pesanan' && selectedTicket.order_id && (
                        <div className="mt-1.5 text-xs text-zinc-550 font-bold flex flex-wrap gap-x-4 gap-y-1">
                          <span>order_id: <span className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">{selectedTicket.order_id}</span></span>
                          {selectedTicket.request_type && <span>Permintaan: <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-black">{selectedTicket.request_type}</span></span>}
                        </div>
                      )}
                      {selectedTicket.subject === 'Deposit' && selectedTicket.deposit_id && (
                        <div className="mt-1.5 text-xs text-zinc-550 font-bold">
                          <span>ID Deposit: <span className="font-mono text-zinc-800 bg-zinc-100 px-1.5 py-0.5 rounded">{selectedTicket.deposit_id}</span></span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="text-zinc-400 hover:text-zinc-600 p-1.5 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Chat Body */}
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 scrollbar-thin scrollbar-thumb-zinc-200">
                    {ticketMessages.map((msg) => {
                      const isUser = msg.sender_role === 'user';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                        >
                          <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-bold mb-1 px-1">
                            <span>{isUser ? `Pengguna (${msg.full_name || 'User'})` : 'Anda (Admin)'}</span>
                            <span>•</span>
                            <span>{new Date(msg.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>

                          <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm font-light leading-relaxed whitespace-pre-wrap shadow-sm text-left ${isUser
                            ? 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200/50'
                            : 'bg-indigo-600 text-white rounded-tr-none'
                            }`}>
                            {msg.message}

                            {msg.image_url && (
                              <div
                                className="mt-3 relative rounded-xl overflow-hidden border border-black/10 cursor-zoom-in max-h-48"
                                onClick={() => {
                                  setShowImageZoom(msg.image_url);
                                }}
                              >
                                <img src={msg.image_url} alt="Attachment" className="max-h-48 w-full object-cover" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Input Form */}
                  {selectedTicket.status !== 'Closed' ? (
                    <form onSubmit={handleSendTicketMessage} className="border-t border-zinc-150 pt-4 space-y-3">
                      <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl p-2 focus-within:border-indigo-500 transition-all">
                        <textarea
                          value={newTicketMessage}
                          onChange={(e) => setNewTicketMessage(e.target.value)}
                          placeholder="Tulis balasan pesan Anda ke pengguna..."
                          rows={2}
                          className="flex-1 bg-transparent border-none outline-none resize-none text-xs sm:text-sm text-zinc-800 pl-2 pt-1"
                        />

                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setNewTicketMessageImage(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                            id="admin-reply-image-upload"
                          />
                          <label
                            htmlFor="admin-reply-image-upload"
                            className="p-2 hover:bg-zinc-200 rounded-xl text-zinc-500 hover:text-zinc-700 cursor-pointer transition-colors"
                            title="Lampirkan Gambar"
                          >
                            <Upload className="w-4 h-4" />
                          </label>
                          <button
                            type="submit"
                            disabled={sendingTicketMessage || !newTicketMessage.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-indigo-600/10 flex items-center justify-center shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {newTicketMessageImage && (
                        <div className="relative inline-block rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 p-1">
                          <img src={newTicketMessageImage} alt="Reply Attachment" className="h-16 w-16 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setNewTicketMessageImage('')}
                            className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md scale-75 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </form>
                  ) : (
                    <div className="border-t border-zinc-150 pt-4 text-center text-xs text-zinc-400 italic">
                      Tiket ini telah ditutup.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image Lightbox Zoom Overlay in Admin Panel */}
            {showImageZoom && (
              <div
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 animate-in fade-in duration-200 cursor-zoom-out"
                onClick={() => setShowImageZoom(null)}
              >
                <button
                  className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition-all cursor-pointer"
                  onClick={() => setShowImageZoom(null)}
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={showImageZoom}
                  alt="Zoomed Banner"
                  className="max-w-[92%] max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                />
              </div>
            )}
            {/* Edit User Modal */}
            {showEditUserModal && selectedEditUser && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button
                    onClick={() => { setShowEditUserModal(false); setSelectedEditUser(null); }}
                    className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
                      <Edit2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Edit User</h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Lakukan perubahan informasi akun user</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={e => setEditFullName(e.target.value)}
                        placeholder="Nama lengkap user"
                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl outline-none text-xs font-semibold transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">Username</label>
                      <input
                        type="text"
                        value={editUsername}
                        onChange={e => setEditUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl outline-none text-xs font-semibold transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        placeholder="Alamat email user"
                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl outline-none text-xs font-semibold transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">No. WhatsApp</label>
                      <input
                        type="text"
                        value={editWhatsapp}
                        onChange={e => setEditWhatsapp(e.target.value)}
                        placeholder="Contoh: 628123456789"
                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl outline-none text-xs font-semibold transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider mb-1.5">Password Baru</label>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={e => setEditPassword(e.target.value)}
                        placeholder="Kosongkan jika tidak ingin diubah"
                        className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-200 px-4 py-2.5 rounded-xl outline-none text-xs font-semibold transition-all"
                      />
                    </div>

                    {editUserError && (
                      <p className="text-xs text-rose-650 dark:text-rose-450 font-semibold bg-rose-500/5 px-3.5 py-2.5 rounded-xl border border-rose-500/15">{editUserError}</p>
                    )}
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => { setShowEditUserModal(false); setSelectedEditUser(null); }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-200 dark:border-slate-800 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >Batal</button>
                    <button
                      disabled={submittingEditUser}
                      onClick={async () => {
                        setSubmittingEditUser(true);
                        setEditUserError(null);
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
                              action: 'update_user_details',
                              editUserId: selectedEditUser.id,
                              fullName: editFullName,
                              username: editUsername,
                              email: editEmail,
                              whatsapp: editWhatsapp,
                              role: selectedEditUser.role || 'user',
                              password: editPassword
                            })
                          });

                          const data = await res.json();
                          if (!res.ok) {
                            throw new Error(data.error || 'Gagal menyimpan perubahan');
                          }

                          setUserProfiles(prev => prev.map(p => p.id === selectedEditUser.id ? {
                            ...p,
                            full_name: editFullName,
                            username: editUsername,
                            email: editEmail,
                            whatsapp: editWhatsapp
                          } : p));

                          alert(data.message || 'Data user berhasil diperbarui!');
                          setShowEditUserModal(false);
                          setSelectedEditUser(null);
                        } catch (err: any) {
                          setEditUserError(err.message || 'Gagal menyimpan perubahan.');
                        } finally {
                          setSubmittingEditUser(false);
                        }
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white py-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-500/10"
                    >
                      {submittingEditUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Simpan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Balance Modification Modal */}
            {showBalanceModal && selectedUserForBalance && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      setShowBalanceModal(false);
                      setSelectedUserForBalance(null);
                    }}
                    className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-950/50 border border-slate-800 hover:bg-slate-900 text-slate-400 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-450 mb-4">
                    <Wallet className="w-6 h-6" />
                  </div>

                  <h4 className="text-sm font-bold text-slate-200 mb-1">Kelola Saldo User</h4>
                  <p className="text-xs text-slate-400 mb-4 font-light">
                    Sesuaikan saldo untuk <span className="font-semibold text-slate-200">{selectedUserForBalance.email}</span>
                  </p>

                  <div className="bg-slate-950/50 border border-slate-850 p-3 rounded-2xl mb-4 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-light">Saldo Saat Ini:</span>
                    <span className="font-mono font-bold text-indigo-500 dark:text-indigo-400">{formatPrice(selectedUserForBalance.balance || 0)}</span>
                  </div>

                  <form onSubmit={handleUpdateBalance} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Tindakan</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'add', label: 'Tambah (+)', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
                          { value: 'subtract', label: 'Kurangi (-)', color: 'border-indigo-500/30 text-rose-400 bg-indigo-600/5' },
                          { value: 'set', label: 'Atur Baru (=)', color: 'border-blue-500/30 text-blue-400 bg-blue-500/5' }
                        ].map(type => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setAdjustmentType(type.value as any)}
                            className={`py-2 px-3 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${adjustmentType === type.value
                              ? `${type.color} ring-1 ring-offset-0 ring-indigo-500`
                              : 'border-slate-800 text-slate-400 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-900/60'
                              }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Nominal Saldo (Rp)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={formatNumberWithDots(adjustmentAmount)}
                        onChange={(e) => setAdjustmentAmount(e.target.value.replace(/\D/g, ''))}
                        placeholder="Contoh: 50.000"
                        className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-mono font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Alasan / Catatan</label>
                      <textarea
                        required
                        rows={3}
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                        placeholder="Tulis alasan penyesuaian (misal: Manual topup via transfer WA, refund order #123, dll)"
                        className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs resize-none"
                      />
                    </div>

                    {balanceError && (
                      <div className="p-3 bg-indigo-500/10 border border-rose-500/20 text-rose-400 text-[10px] rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{balanceError}</span>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowBalanceModal(false);
                          setSelectedUserForBalance(null);
                        }}
                        className="flex-1 bg-slate-950 hover:bg-slate-900 text-slate-350 border border-slate-800 py-3 rounded-xl text-xs font-semibold transition-all active:scale-98 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={submittingBalance}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-600 text-white shadow-md shadow-rose-500/10 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {submittingBalance ? 'Memproses...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </form>
                </div>
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
                      className="flex-1 bg-indigo-600 hover:bg-indigo-600 text-white shadow-md shadow-rose-500/10 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 active:scale-98 cursor-pointer"
                    >
                      Ya, Lanjutkan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Premium Dribbble-style Alert Modal */}
            {alertModal && alertModal.show && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
                <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col items-center text-center">
                    {alertModal.type === 'success' ? (
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-lg shadow-emerald-500/5">
                        <Check className="w-7 h-7" />
                      </div>
                    ) : alertModal.type === 'error' ? (
                      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-lg shadow-rose-500/5">
                        <X className="w-7 h-7" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-lg shadow-blue-500/5">
                        <AlertCircle className="w-7 h-7" />
                      </div>
                    )}

                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-2">
                      {alertModal.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium leading-relaxed max-w-[280px]">
                      {alertModal.message}
                    </p>

                    <button
                      onClick={() => setAlertModal(null)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 px-6 rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-indigo-500/10 cursor-pointer"
                    >
                      Mengerti
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
