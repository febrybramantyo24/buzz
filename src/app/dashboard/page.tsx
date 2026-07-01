'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { dbClient as supabase } from '@/lib/db-client';
import { Service, Order, Announcement, Transaction } from '@/lib/types';
import PremiumThemeToggle from '@/components/PremiumThemeToggle';
import { useBrand } from '@/components/DynamicBrandProvider';
import {
  Zap,
  LogOut,
  Info,
  ShoppingBag,
  History,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  User,
  AlertCircle,
  QrCode,
  Check,
  TrendingUp,
  Award,
  Sparkles,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  X,
  XCircle,
  Tag,
  Play,
  ChevronDown,
  ChevronUp,
  Star,
  Printer,
  FileText,
  ThumbsUp,
  Megaphone,
  Copy,
  Layers,
  MessageSquare,
  Send,
  Activity,
  Upload,
  Eye,
  EyeOff,
  Pin,
  Settings,
  Menu,
  ChevronLeft,
  List,
  Crown,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Leaderboard response typings
interface LeaderboardResponse {
  topOrders: Array<{
    name: string;
    totalSpent: number;
    totalOrders: number;
  }>;
  topDeposits: Array<{
    name: string;
    totalDeposit: number;
  }>;
  topServicesCount: Array<{
    name: string;
    serviceId: string;
    totalOrders: number;
    totalQuantity: number;
  }>;
  topServicesRevenue: Array<{
    name: string;
    serviceId: string;
    totalRevenue: number;
    totalOrders: number;
  }>;
  period: string;
}

const formatNumberWithDots = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === 0 || num === '0' || num === '') return '';
  let clean = String(num);
  if (clean.includes('.')) {
    const parsed = parseFloat(clean);
    if (!isNaN(parsed)) {
      clean = String(Math.round(parsed));
    }
  }
  const cleanDigits = clean.replace(/\D/g, '');
  if (!cleanDigits) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(cleanDigits, 10));
};

const parseNumberFromDots = (str: string): number => {
  const clean = str.replace(/\D/g, '');
  return parseInt(clean, 10) || 0;
};

const getTargetGuide = (category: string) => {
  const cat = (category || '').toLowerCase();

  if (cat.includes('instagram')) {
    return {
      placeholder: 'Contoh: mustakinnur atau https://www.instagram.com/p/BxilTdssedewBn_p/',
      guide: 'Followers/Story/Live/Visit: Username tanpa @ (mustakinnur). Likes/Views/Comments/Reels: Link postingan (https://www.instagram.com/p/BxilTdssedewBn_p/)'
    };
  }
  if (cat.includes('youtube')) {
    return {
      placeholder: 'Contoh: https://www.youtube.com/watch?v=NdgFndfdnFQqII',
      guide: 'Likes/Views/Comments/Share/Live: Link video (https://www.youtube.com/watch?v=...). Subscribers: Link channel (https://www.youtube.com/channel/...)'
    };
  }
  if (cat.includes('tiktok')) {
    return {
      placeholder: 'Contoh: https://tiktok.com/@username/ atau https://vt.tiktok.com/xxxxx/',
      guide: 'Followers: Link profile TikTok / username tanpa @. Likes/Views: Link video TikTok (https://vt.tiktok.com/xxxxx/)'
    };
  }
  if (cat.includes('facebook')) {
    return {
      placeholder: 'Contoh: https://www.facebook.com/telkomsel/',
      guide: 'Page Likes/Followers: Link fanspage. Post Likes/Video: Link post. Friends: Link profile. Group: Link grup.'
    };
  }
  if (cat.includes('twitter') || cat.includes(' x')) {
    return {
      placeholder: 'Contoh: TelkomCare atau https://twitter.com/TelkomCare/status/...',
      guide: 'Followers: Username tanpa @ (TelkomCare). Retweet/Favorite: Link tweet postingan.'
    };
  }
  if (cat.includes('shopee')) {
    return {
      placeholder: 'Contoh: mustakin001 atau https://shopee.co.id/...',
      guide: 'Followers: Username akun Shopee (mustakin001). Product Likes: Link produk Shopee.'
    };
  }
  if (cat.includes('tokopedia')) {
    return {
      placeholder: 'Contoh: https://www.tokopedia.com/cleanandcleanshop',
      guide: 'Followers: Username / link profile toko. Wishlist/Favorite: Link produk Tokopedia.'
    };
  }
  if (cat.includes('telegram')) {
    return {
      placeholder: 'Contoh: https://t.me/medanpediaSMM atau https://t.me/medanpediaSMM/1195',
      guide: 'Channel/Group: Link channel/grup. Post Views/Reactions/Story: Link post (https://t.me/username/1195).'
    };
  }
  if (cat.includes('whatsapp')) {
    return {
      placeholder: 'Contoh: https://whatsapp.com/channel/XXXXXXXXXXXXXXXXX',
      guide: 'Channel/Group Members: Link Channel atau Group WhatsApp.'
    };
  }
  if (cat.includes('traffic') || cat.includes('website') || cat.includes('web')) {
    return {
      placeholder: 'Contoh: https://medanpedia.co.id',
      guide: 'Website Traffic: Link URL lengkap Website Anda.'
    };
  }

  return {
    placeholder: 'https://instagram.com/username atau link video',
    guide: 'Pastikan periksa kembali target pesanan Anda sebelum pesanan dibuat sehingga pesanan dapat diproses.'
  };
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
  if (b === 'HOT') return 'bg-red-500/10 text-red-500 dark:text-red-450 border border-red-500/25 backdrop-blur-md shadow-sm shadow-red-500/5';
  if (b === 'RECOMMENDED') return 'bg-indigo-500/10 text-indigo-550 dark:text-indigo-400 border border-indigo-500/20 backdrop-blur-md shadow-sm';
  if (b === 'DISCOUNT' || b === 'PROMO') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 backdrop-blur-md shadow-sm shadow-amber-500/5';
  return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 backdrop-blur-md shadow-sm';
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

const getTicketStatusBadgeClass = (status: string): string => {
  const s = status ? status.toLowerCase() : '';
  if (s === 'answered') return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold shadow-sm shadow-emerald-500/30';
  if (s === 'closed') return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white font-extrabold shadow-sm shadow-slate-600/30';
  return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/30';
};

export default function UserDashboard() {
  const router = useRouter();
  const { logoUrl, brandName } = useBrand();

  // User state
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const isAutofillNavigating = useRef(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // Data state
  const [services, setServices] = useState<Service[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Client-side pagination states
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const [recomPage, setRecomPage] = useState(1);

  // Order Form State
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [targetUrl, setTargetUrl] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  // History State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderYearFilter, setOrderYearFilter] = useState('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [showOrderConfirmModal, setShowOrderConfirmModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'order' | 'history' | 'transactions' | 'deposits' | 'tickets' | 'services' | 'leaderboard'>('dashboard');
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'current' | 'last'>('current');
  const [leaderboardSubTab, setLeaderboardSubTab] = useState<'orders' | 'deposits' | 'services'>('orders');
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [servicesCategoryFilter, setServicesCategoryFilter] = useState('all');
  const [servicesPage, setServicesPage] = useState(1);
  const [servicesPerPage] = useState(15);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Wallet and Transactions states
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(0);
  const [submittingTopup, setSubmittingTopup] = useState(false);
  const [showDepositGuide, setShowDepositGuide] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});
  const [ordersPage, setOrdersPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [txStatusFilter, setTxStatusFilter] = useState('all');
  const [txYearFilter, setTxYearFilter] = useState('2026');
  const [txMonthFilter, setTxMonthFilter] = useState('all');
  const [txTypeFilter, setTxTypeFilter] = useState('all');
  const [depMonthFilter, setDepMonthFilter] = useState('all');
  const [txMethodFilter, setTxMethodFilter] = useState('all');
  const [txSearchType, setTxSearchType] = useState('id');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [isExamplesExpanded, setIsExamplesExpanded] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRecomExpanded, setIsRecomExpanded] = useState(true);
  const [warningExpanded, setWarningExpanded] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState<any | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileUsername, setProfileUsername] = useState('');
  const [profileFullName, setProfileFullName] = useState('');
  const [profileWhatsApp, setProfileWhatsApp] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // Support Ticket System States
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketSearchType, setTicketSearchType] = useState('id');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketOrderId, setTicketOrderId] = useState('');
  const [ticketRequestType, setTicketRequestType] = useState('');
  const [ticketDepositId, setTicketDepositId] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketImage, setTicketImage] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [selectedTicketOrders, setSelectedTicketOrders] = useState<any[]>([]);
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketMessageImage, setNewTicketMessageImage] = useState('');
  const [sendingTicketMessage, setSendingTicketMessage] = useState(false);
  const [lastReplyTime, setLastReplyTime] = useState<number>(0);
  const [lastTicketTime, setLastTicketTime] = useState<number>(0);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isServicesCategoryDropdownOpen, setIsServicesCategoryDropdownOpen] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [chartDataType, setChartDataType] = useState<'spending' | 'orders'>('spending');
  const [chartYearFilter, setChartYearFilter] = useState<string>('2026');
  const [chartMonthFilter, setChartMonthFilter] = useState<string>('all');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Trigger news modal automatically if there is any unread announcement
  useEffect(() => {
    if (isMounted && announcements.length > 0 && user) {
      const sortedAnnouncements = [...announcements].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latestAnnId = sortedAnnouncements[0]?.id;
      const readAnnId = localStorage.getItem(`last_read_announcement_id_${user.id}`);
      if (readAnnId !== latestAnnId) {
        setShowNewsModal(true);
      }
    }
  }, [isMounted, announcements, user]);
  const itemsPerPage = 10;

  useEffect(() => {
    setTransactionsPage(1);
  }, [txStatusFilter, txYearFilter, txMethodFilter, txSearchQuery]);

  useEffect(() => {
    setOrdersPage(1);
  }, [searchTerm, statusFilter, orderYearFilter]);

  // Clear selected checkboxes when user changes page, tab, or filter
  useEffect(() => {
    setSelectedOrderIds([]);
  }, [ordersPage, activeTab, searchTerm, statusFilter, orderYearFilter]);

  const clearOrderForm = () => {
    setSelectedCategory('');
    setSelectedService(null);
    setTargetUrl('');
    setQuantity(0);
    setTotalPrice(0);
    setFormError(null);
  };

  const fetchLeaderboard = async (period: 'current' | 'last' = 'current') => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${period}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLeaderboardData(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleSidebarTabClick = (tab: 'dashboard' | 'order' | 'history' | 'transactions' | 'deposits' | 'tickets' | 'services' | 'leaderboard', callback?: () => void) => {
    if (callback) callback();
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleQuickOrder = (srv: Service) => {
    isAutofillNavigating.current = true;
    setSelectedCategory(srv.category || '');
    setSelectedService(srv);
    setActiveTab('order');
  };

  const getNumericId = (srv: Service | string | null): string => {
    if (!srv) return '';
    const idStr = typeof srv === 'string' ? srv : (srv.provider_service_id || srv.id);
    if (!idStr) return '';
    if (/^\d+$/.test(idStr)) {
      return idStr;
    }
    const hexPart = String(idStr).split('-')[0].slice(0, 5);
    return String(parseInt(hexPart, 16) || idStr);
  };

  // Refetch data automatically on tab navigation and reset all inputs
  useEffect(() => {
    if (user) {
      fetchProfileAndTransactions(user.id);
      fetchOrders(user.id);
    }
    if (isAutofillNavigating.current) {
      // Reset the autofill navigation flag and skip resetting the form
      isAutofillNavigating.current = false;
    } else {
      clearOrderForm();
    }
    setTopupAmount(0);
    setTxMonthFilter('all');
    setTxTypeFilter('all');
    setDepMonthFilter('all');
    setTxYearFilter('2026');
  }, [activeTab, user]);

  // Auto‑fetch leaderboard when tab becomes active
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      fetchLeaderboard(leaderboardPeriod);
    }
  }, [activeTab, leaderboardPeriod]);

  // Clear topup input box when the modal is closed
  useEffect(() => {
    if (!showTopupModal) {
      setTopupAmount(0);
    }
  }, [showTopupModal]);

  // Prevent body scroll when any modal is open
  useEffect(() => {
    const isModalOpen = !!(
      showTopupModal ||
      selectedOrderDetail ||
      selectedInvoiceDetail ||
      showProfileModal ||
      selectedTicket ||
      showCreateTicket ||
      selectedAnnouncement ||
      showNewsModal ||
      selectedTxDetail
    );
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [
    showTopupModal,
    selectedOrderDetail,
    selectedInvoiceDetail,
    showProfileModal,
    selectedTicket,
    showCreateTicket,
    selectedAnnouncement,
    showNewsModal,
    selectedTxDetail
  ]);

  // Dynamically load Midtrans snap.js script to prevent Next.js Fast Refresh unmounting bugs
  useEffect(() => {
    const scriptId = 'midtrans-snap-script';
    if (document.getElementById(scriptId)) return;

    const snapSrc = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'false'
        ? 'https://app.sandbox.midtrans.com/snap/snap.js'
        : ((process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '').startsWith('SB-Mid-')
          ? 'https://app.sandbox.midtrans.com/snap/snap.js'
          : 'https://app.midtrans.com/snap/snap.js'));

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = snapSrc;
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Premium notifications & dialogs
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    show: false,
    message: '',
    type: 'success'
  });
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    message: '',
    onConfirm: () => { }
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ show: true, message, type });
    // Clear notification after 4 seconds
    setTimeout(() => {
      setNotification(prev => prev.message === message ? { ...prev, show: false } : prev);
    }, 4500);
  };

  const renderWarningContent = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split('**');
      const formattedLine = parts.map((part, partIdx) => {
        if (partIdx % 2 === 1) {
          return (
            <b key={partIdx} className="text-indigo-600 dark:text-indigo-500 dark:text-indigo-400 font-extrabold">
              {part}
            </b>
          );
        }
        return part;
      });

      const isListItem = line.trim().match(/^\d+\./);
      return (
        <div key={lineIdx} className={`${isListItem ? "pl-1 py-0.5" : "py-0.5"} leading-relaxed text-slate-350 dark:text-slate-300 font-medium`}>
          {formattedLine}
        </div>
      );
    });
  };

  // Authenticate user & initial fetch
  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // Check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'admin') {
        router.push('/sb-admin-panel');
        return;
      }

      setUser(session.user);

      // Load favorites
      const storedFavs = localStorage.getItem(`favorites_${session.user.id}`);
      if (storedFavs) {
        try {
          setFavorites(JSON.parse(storedFavs));
        } catch (e) {
          console.error(e);
        }
      }

      const fetchSiteSettings = async () => {
        try {
          const res = await fetch('/api/site-settings');
          if (res.ok) {
            const data = await res.json();
            setSiteSettings(data);
          }
        } catch (e) {
          console.error('Error fetching site settings:', e);
        }
      };

      // Fetch Services, Announcements, Orders, Wallet Profile, Site Settings
      await Promise.all([
        fetchServices(),
        fetchAnnouncements(),
        fetchOrders(session.user.id),
        fetchProfileAndTransactions(session.user.id),
        fetchSiteSettings(),
        fetchTickets()
      ]);
      setLoading(false);
    }

    checkAuthAndFetch();
  }, [router]);

  const fetchProfileAndTransactions = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profile) {
        setBalance(Number(profile.balance || 0));
        setUserProfile(profile);
      }

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setTransactions(txData || []);
    } catch (err) {
      console.warn('Error in fetchProfileAndTransactions:', err);
    }
  };

  // Fetch functions
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        // Parse fields that might be returned as strings from database
        const parsedData = data.map((s: any) => ({
          ...s,
          price_per_k: typeof s.price_per_k === 'string' ? parseFloat(s.price_per_k) : s.price_per_k,
          min_order: typeof s.min_order === 'string' ? parseInt(s.min_order) : s.min_order,
          max_order: typeof s.max_order === 'string' ? parseInt(s.max_order) : s.max_order,
        }));
        setServices(parsedData);
        const uniqueCategories = Array.from(new Set(parsedData.map((s: Service) => s.category))) as string[];
        setCategories(uniqueCategories);
        if (uniqueCategories.length > 0) {
          setSelectedCategory(uniqueCategories[0]);
        } else {
          setSelectedCategory('');
          setSelectedService(null);
        }
      } else {
        setServices([]);
        setCategories([]);
        setSelectedCategory('');
        setSelectedService(null);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setServices([]);
      setCategories([]);
      setSelectedCategory('');
      setSelectedService(null);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
      setAnnouncements([
        {
          id: '1',
          title: ' Update Sistem Pembayaran QRIS',
          content: 'Sekarang pembayaran menggunakan QRIS diproses secara otomatis & real-time. Saldo/status orderan Anda langsung terupdate.',
          badge: 'HOT',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]);
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

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;

    // Anti-spam check: 10s cooldown for creating tickets
    const now = Date.now();
    if (now - lastTicketTime < 10000) {
      showToast('Harap tunggu 10 detik sebelum membuat tiket baru.', 'error');
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage,
          image_url: ticketImage || null,
          order_id: ticketSubject === 'Pesanan' ? ticketOrderId : null,
          request_type: ticketSubject === 'Pesanan' ? ticketRequestType : null,
          deposit_id: ticketSubject === 'Deposit' ? ticketDepositId : null
        })
      });
      const data = await res.json();
      if (data.success) {
        setLastTicketTime(Date.now()); // Set last ticket time on success!
        showToast('Tiket berhasil dikirim!', 'success');
        setTicketSubject('');
        setTicketOrderId('');
        setTicketRequestType('');
        setTicketDepositId('');
        setTicketMessage('');
        setTicketImage('');
        setShowCreateTicket(false);
        await fetchTickets();
      } else {
        showToast(data.error || 'Gagal mengirim tiket', 'error');
      }
    } catch (err: any) {
      console.error('Error creating ticket:', err);
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendTicketMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketMessage.trim() || !selectedTicket) return;

    // Anti-spam check: 3s cooldown for sending replies
    const now = Date.now();
    if (now - lastReplyTime < 3000) {
      showToast('Harap tunggu 3 detik sebelum membalas tiket kembali.', 'error');
      return;
    }

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
        setLastReplyTime(Date.now()); // Set last reply time on success!
        await fetchTicketDetails(selectedTicket.id);
        // refresh list in background
        fetchTickets();
      } else {
        showToast(data.error || 'Gagal mengirim pesan', 'error');
      }
    } catch (err) {
      console.error('Error replying to ticket:', err);
      showToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setSendingTicketMessage(false);
    }
  };

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      setOrders(data || []);

      // Trigger sync-status in background to update statuses from provider automatically
      fetch('/api/cron/sync-status')
        .then(res => res.json())
        .then(resData => {
          if (resData && resData.syncedCount > 0) {
            // Re-fetch orders if any status actually changed
            supabase
              .from('orders')
              .select('*')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .then(({ data: updatedData }) => {
                if (updatedData) setOrders(updatedData);
              });
          }
        })
        .catch(err => console.error('Error auto-syncing statuses:', err));
    } catch (err: any) {
      console.error("Error fetching orders:", err.message || err);
    }
  };

  // Change service options when category changes
  useEffect(() => {
    const availableServices = services.filter(s => s.category === selectedCategory);
    if (availableServices.length > 0) {
      setSelectedService(availableServices[0]);
    } else {
      setSelectedService(null);
    }
  }, [selectedCategory, services]);

  // Recalculate total price
  useEffect(() => {
    if (selectedService && quantity > 0) {
      const calc = (selectedService.price_per_k / 1000) * quantity;
      setTotalPrice(calc);
    } else {
      setTotalPrice(0);
    }
  }, [selectedService, quantity]);


  // Order validation and submission (via Balance)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedService) {
      setFormError('Layanan belum dipilih.');
      return;
    }
    if (!targetUrl.trim()) {
      setFormError('Data target / URL tidak boleh kosong.');
      return;
    }
    if (quantity < selectedService.min_order) {
      setFormError(`Jumlah pesanan minimal adalah ${selectedService.min_order.toLocaleString()}.`);
      return;
    }
    if (quantity > selectedService.max_order) {
      setFormError(`Jumlah pesanan maksimal adalah ${selectedService.max_order.toLocaleString()}.`);
      return;
    }

    if (balance < totalPrice) {
      setFormError('Saldo Anda tidak mencukupi. Silakan lakukan Top Up terlebih dahulu.');
      return;
    }

    // Instead of executing immediately, show confirmation modal
    setShowOrderConfirmModal(true);
  };

  const executePlaceOrder = async () => {
    if (!selectedService) return;
    setShowOrderConfirmModal(false);
    setSubmittingOrder(true);
    setFormError(null);

    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          target_url: targetUrl,
          quantity: quantity
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Gagal membuat pesanan');
      }

      // Update local state balance
      setBalance(result.newBalance);
      localStorage.setItem(`balance_${user.id}`, String(result.newBalance));

      // Refresh state
      await Promise.all([
        fetchOrders(user.id),
        fetchProfileAndTransactions(user.id)
      ]);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Reset form fields
      setTargetUrl('');
      setQuantity(0);
      setActiveTab('history');
      showToast('Pemesanan sukses! Saldo Anda telah terpotong.', 'success');

    } catch (err: any) {
      setFormError(err.message || 'Gagal membuat permintaan.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Pay multiple unpaid orders in bulk via wallet balance
  const handleBulkPayOrders = async () => {
    const unpaidSelectedOrders = orders.filter(o => selectedOrderIds.includes(o.id) && o.payment_status === 'unpaid');
    if (unpaidSelectedOrders.length === 0) {
      showToast('Tidak ada orderan terpilih yang belum dibayar!', 'info');
      return;
    }

    const totalBulkPrice = unpaidSelectedOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
    if (balance < totalBulkPrice) {
      showToast(`Saldo Anda tidak mencukupi untuk membayar semua orderan terpilih. Total harga: ${formatPrice(totalBulkPrice)}.`, 'error');
      return;
    }

    setLoading(true);
    try {
      const newBalance = balance - totalBulkPrice;

      // Update local storage balance immediately
      localStorage.setItem(`balance_${user.id}`, String(newBalance));
      setBalance(newBalance);

      // We perform all supabase mutations
      const transactionLogs = unpaidSelectedOrders.map(order => ({
        user_id: user.id,
        amount: -order.total_price,
        type: 'order_payment',
        status: 'success',
        reference_id: order.id,
        payment_method: 'wallet'
      }));

      // 1. Update DB profile balance
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      // 2. Create transaction logs
      await supabase
        .from('transactions')
        .insert(transactionLogs);

      // 3. Update Orders to paid
      const orderIdsToUpdate = unpaidSelectedOrders.map(o => o.id);
      for (const orderId of orderIdsToUpdate) {
        await supabase
          .from('orders')
          .update({ payment_status: 'paid', payment_method: 'wallet', status: 'pending' })
          .eq('id', orderId);
      }

      // Update local state
      const updatedOrders = orders.map(o => {
        if (orderIdsToUpdate.includes(o.id)) {
          return { ...o, payment_status: 'paid', payment_method: 'wallet', status: 'pending' as const };
        }
        return o;
      });
      setOrders(updatedOrders as Order[]);
      localStorage.setItem(`orders_${user.id}`, JSON.stringify(updatedOrders));

      // Append local transaction logs to state
      const localTxs = unpaidSelectedOrders.map(order => ({
        id: `TX-${Math.random().toString(36).substring(2, 9)}`,
        user_id: user.id,
        amount: -order.total_price,
        type: 'order_payment' as const,
        status: 'success' as const,
        reference_id: order.id,
        payment_method: 'wallet',
        created_at: new Date().toISOString()
      }));
      const updatedTxs = [...localTxs, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTxs));

      setSelectedOrderIds([]);
      showToast(`${unpaidSelectedOrders.length} orderan berhasil dibayar massal!`, 'success');
    } catch (err) {
      console.error('Bulk payment error:', err);
      showToast('Gagal membayar orderan secara massal. Silakan coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pay unpaid order via wallet balance
  const handlePayOrderWithBalance = async (order: Order) => {
    if (balance < order.total_price) {
      showToast('Saldo Anda tidak mencukupi untuk membayar orderan ini. Silakan top up terlebih dahulu.', 'error');
      return;
    }

    setLoading(true);
    try {
      const newBalance = balance - order.total_price;

      // Update local storage balance immediately
      localStorage.setItem(`balance_${user.id}`, String(newBalance));
      setBalance(newBalance);

      const localTx = {
        id: `TX-${Math.random().toString(36).substring(2, 9)}`,
        user_id: user.id,
        amount: -order.total_price,
        type: 'order_payment' as const,
        status: 'success' as const,
        reference_id: order.id,
        payment_method: 'wallet',
        created_at: new Date().toISOString()
      };
      const updatedTxs = [localTx, ...transactions];
      setTransactions(updatedTxs);
      localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTxs));

      // Update DB profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      // Create transaction log
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          amount: -order.total_price,
          type: 'order_payment',
          status: 'success',
          reference_id: order.id,
          payment_method: 'wallet'
        });

      // Update Order
      const { error: orderError } = await supabase
        .from('orders')
        .update({ payment_status: 'paid', payment_method: 'wallet', status: 'pending' })
        .eq('id', order.id);

      if (orderError || profileError) {
        console.warn('DB updates failed for order payment, using local fallback');
        const updatedOrders = orders.map(o => {
          if (o.id === order.id) {
            return { ...o, payment_status: 'paid' as const, status: 'pending' as const, payment_method: 'wallet' };
          }
          return o;
        });
        setOrders(updatedOrders);
        localStorage.setItem(`orders_${user.id}`, JSON.stringify(updatedOrders));
      } else {
        await Promise.all([
          fetchOrders(user.id),
          fetchProfileAndTransactions(user.id)
        ]);
      }

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      showToast('Pembayaran pesanan berhasil menggunakan Saldo!', 'success');
    } catch (err: any) {
      showToast('Terjadi kesalahan: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySelectedOrderIds = () => {
    if (selectedOrderIds.length === 0) {
      showToast('Pilih minimal satu ID pesanan terlebih dahulu!', 'info');
      return;
    }
    const idsToCopy = orders
      .filter(o => selectedOrderIds.includes(o.id))
      .map(o => o.order_id ? String(o.order_id) : o.id);
    navigator.clipboard.writeText(idsToCopy.join(', '));
    showToast(`${selectedOrderIds.length} ID Pesanan berhasil disalin!`, 'success');
  };

  const handleToggleSelectAll = (filteredList: any[]) => {
    const allFilteredIds = filteredList.map(o => o.id);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedOrderIds.includes(id));
    if (isAllSelected) {
      // Remove all filtered IDs from selectedOrderIds
      setSelectedOrderIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      // Add all filtered IDs to selectedOrderIds without duplicates
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Top Up Wallet via Midtrans
  const handleInitiateTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topupAmount < 10000) {
      showToast('Minimal top up adalah Rp 10.000', 'error');
      return;
    }

    // Check if there is already pending deposits to prevent spam
    const pendingDeposits = transactions.filter(t => t.type === 'topup' && t.status === 'pending');
    if (pendingDeposits.length >= 3) {
      showToast('Anda hanya dapat memiliki maksimal 3 permintaan deposit Pending. Silakan selesaikan pembayaran sebelumnya.', 'error');
      return;
    }

    setSubmittingTopup(true);

    try {
      const tempTxId = Math.random().toString(36).substring(2, 9);

      // Generate Snap Token & create pending transaction in DB from server side
      const response = await fetch('/api/payment/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: tempTxId,
          grossAmount: topupAmount,
          email: user?.email,
          type: 'topup',
          userId: user.id
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      const snapToken = result.token;
      const dbTxId = result.dbTxId || tempTxId; // UUID returned from server!

      // Save Snap Token for later pay continuation
      localStorage.setItem(`snap_token_${dbTxId}`, snapToken);

      const txPayload = {
        user_id: user.id,
        amount: topupAmount,
        type: 'topup' as const,
        status: 'pending' as const,
        payment_method: 'midtrans',
      };

      if ((window as any).snap) {
        (window as any).snap.pay(snapToken, {
          onSuccess: async function (snapResult: any) {
            console.log('Topup payment success!', snapResult);
            setLoading(true);
            try {
              const res = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: dbTxId })
              });
              const verifyRes = await res.json();
              if (verifyRes.success) {
                setBalance(verifyRes.newBalance);
                localStorage.setItem(`balance_${user.id}`, String(verifyRes.newBalance));
                showToast('Top Up berhasil! Saldo Anda telah ditambahkan.', 'success');
              } else {
                showToast('Pembayaran berhasil! Saldo Anda sedang diproses oleh sistem.', 'success');
              }
            } catch (verifyErr) {
              console.error('Payment verification failed:', verifyErr);
              showToast('Pembayaran berhasil! Saldo Anda akan diperbarui otomatis dalam beberapa saat.', 'success');
            } finally {
              setLoading(false);
              await fetchProfileAndTransactions(user.id);
              setShowTopupModal(false);
              setTopupAmount(0);
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.5 }
              });
            }
          },
          onPending: async function (snapResult: any) {
            console.log('Topup payment pending', snapResult);
            const chosenMethod = snapResult.payment_type || 'midtrans';

            await supabase
              .from('transactions')
              .update({ payment_method: chosenMethod })
              .eq('id', dbTxId);

            const localTx = {
              id: dbTxId,
              ...txPayload,
              payment_method: chosenMethod,
              created_at: new Date().toISOString()
            };
            const updatedTxs = [localTx, ...transactions.filter(t => t.id !== dbTxId)];
            setTransactions(updatedTxs);
            localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTxs));

            await fetchProfileAndTransactions(user.id);
            setShowTopupModal(false);
            setTopupAmount(0);
            setActiveTab('transactions');
            showToast('Pembayaran sedang diproses. Status akan diperbarui secara otomatis.', 'info');
          },
          onError: function (snapResult: any) {
            console.error('Topup payment error', snapResult);
            showToast('Top Up gagal, silakan coba lagi.', 'error');
          },
          onClose: function () {
            console.log('Topup payment popup closed');
            const localTx = {
              id: dbTxId,
              ...txPayload,
              created_at: new Date().toISOString()
            };
            const updatedTxs = [localTx, ...transactions.filter(t => t.id !== dbTxId)];
            setTransactions(updatedTxs);
            localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTxs));

            fetchProfileAndTransactions(user.id);
            setShowTopupModal(false);
          }
        });
      } else {
        showToast('Sistem pembayaran Midtrans sedang memuat. Silakan coba beberapa saat lagi.', 'info');
      }
    } catch (err: any) {
      showToast('Gagal memproses top up: ' + err.message, 'error');
    } finally {
      setSubmittingTopup(false);
    }
  };

  const handlePayPendingTopup = async (tx: Transaction) => {
    setLoading(true);
    try {
      let snapToken = localStorage.getItem(`snap_token_${tx.id}`);

      if (!snapToken) {
        // Fetch fresh snap token if not found locally
        const response = await fetch('/api/payment/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: tx.id,
            grossAmount: tx.amount,
            email: user?.email,
            type: 'topup',
            userId: user.id
          }),
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);
        snapToken = result.token;
        if (snapToken) {
          localStorage.setItem(`snap_token_${tx.id}`, snapToken);
        }
      }

      if ((window as any).snap && snapToken) {
        (window as any).snap.pay(snapToken, {
          onSuccess: async function (snapResult: any) {
            console.log('Topup payment success!', snapResult);
            setLoading(true);
            try {
              const res = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: tx.id })
              });
              const verifyRes = await res.json();
              if (verifyRes.success) {
                setBalance(verifyRes.newBalance);
                localStorage.setItem(`balance_${user.id}`, String(verifyRes.newBalance));
                showToast('Top Up berhasil! Saldo Anda telah ditambahkan.', 'success');
              } else {
                showToast('Pembayaran berhasil! Saldo Anda sedang diproses oleh sistem.', 'success');
              }
            } catch (verifyErr) {
              console.error('Payment verification failed:', verifyErr);
              showToast('Pembayaran berhasil! Saldo Anda akan diperbarui otomatis dalam beberapa saat.', 'success');
            } finally {
              setLoading(false);
              await fetchProfileAndTransactions(user.id);
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.5 }
              });
            }
          },


          onPending: async function (snapResult: any) {
            const chosenMethod = snapResult?.payment_type || 'midtrans';
            await supabase
              .from('transactions')
              .update({ payment_method: chosenMethod })
              .eq('id', tx.id);

            await fetchProfileAndTransactions(user.id);
            showToast('Pembayaran sedang diproses.', 'info');
          },
          onClose: function () {
            console.log('Payment popup closed');
          }
        });
      } else {
        showToast('Sistem pembayaran Midtrans tidak siap.', 'error');
      }
    } catch (err: any) {
      showToast('Gagal memproses pembayaran: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPendingTopup = (tx: Transaction) => {
    setConfirmModal({
      show: true,
      message: 'Apakah Anda yakin ingin membatalkan transaksi top-up ini?',
      onConfirm: async () => {
        setLoading(true);
        try {
          // Update status to failed in DB
          await supabase
            .from('transactions')
            .update({ status: 'failed' })
            .eq('id', tx.id);

          await fetchProfileAndTransactions(user.id);
          localStorage.removeItem(`snap_token_${tx.id}`);
          showToast('Transaksi top-up berhasil dibatalkan.', 'success');
        } catch (err: any) {
          showToast('Gagal membatalkan transaksi: ' + err.message, 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setChangePasswordError('Konfirmasi password baru tidak cocok.');
      showToast('Konfirmasi password baru tidak cocok.', 'error');
      setTimeout(() => setChangePasswordError(''), 5000);
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError('Password baru minimal harus 6 karakter.');
      showToast('Password baru minimal harus 6 karakter.', 'error');
      setTimeout(() => setChangePasswordError(''), 5000);
      return;
    }
    setChangePasswordLoading(true);
    setChangePasswordError('');
    setChangePasswordSuccess('');

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setChangePasswordError(data.error || 'Gagal mengubah password.');
        showToast(data.error || 'Gagal mengubah password.', 'error');
        setTimeout(() => setChangePasswordError(''), 5000);
      } else {
        setChangePasswordSuccess(data.message || 'Password berhasil diperbarui!');
        showToast(data.message || 'Password berhasil diperbarui!', 'success');
        setTimeout(() => setChangePasswordSuccess(''), 5000);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setChangePasswordError('Terjadi kesalahan koneksi.');
      showToast('Terjadi kesalahan koneksi.', 'error');
      setTimeout(() => setChangePasswordError(''), 5000);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profileUsername,
          fullName: profileFullName,
          whatsapp: profileWhatsApp
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'Gagal memperbarui profil.');
        showToast(data.error || 'Gagal memperbarui profil.', 'error');
        setTimeout(() => setProfileError(''), 5000);
      } else {
        setProfileSuccess(data.message || 'Profil berhasil diperbarui!');
        showToast(data.message || 'Profil berhasil diperbarui!', 'success');
        setTimeout(() => setProfileSuccess(''), 5000);
        // Refresh local state profile
        if (user) {
          fetchProfileAndTransactions(user.id);
        }
      }
    } catch (err) {
      setProfileError('Terjadi kesalahan koneksi.');
      showToast('Terjadi kesalahan koneksi.', 'error');
      setTimeout(() => setProfileError(''), 5000);
    } finally {
      setProfileLoading(false);
    }
  };

  // Sync profile values when modal opens
  useEffect(() => {
    if (showProfileModal && userProfile) {
      setProfileUsername(userProfile.username || '');
      setProfileFullName(userProfile.full_name || '');
      setProfileWhatsApp(userProfile.whatsapp || '');
      setProfileError('');
      setProfileSuccess('');

      // Reset password states
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChangePasswordError('');
      setChangePasswordSuccess('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [showProfileModal]);

  const toggleFavorite = (serviceId: string) => {
    if (!user) return;
    let newFavs = [...favorites];
    if (favorites.includes(serviceId)) {
      newFavs = newFavs.filter(id => id !== serviceId);
      showToast('Layanan dihapus dari favorit.', 'info');
    } else {
      newFavs.push(serviceId);
      showToast('Layanan ditambahkan ke favorit.', 'success');
    }
    setFavorites(newFavs);
    localStorage.setItem(`favorites_${user.id}`, JSON.stringify(newFavs));
  };

  const handleReorder = (order: Order) => {
    isAutofillNavigating.current = true;
    // 1. Set tab to 'order'
    setActiveTab('order');

    // 2. Set Category
    setSelectedCategory(order.category);

    // 3. Find matching service from services list and set it
    const matchingService = services.find(s => s.id === order.service_id);
    if (matchingService) {
      setSelectedService(matchingService);
    } else {
      // Fallback service placeholder if service is no longer active/found
      setSelectedService({
        id: order.service_id,
        category: order.category,
        name: order.service_name,
        price_per_k: order.price_per_k,
        min_order: 10,
        max_order: 100000,
        is_active: true,
        created_at: new Date().toISOString()
      });
    }

    // 4. Fill form fields
    setTargetUrl(order.target_url);
    setQuantity(order.quantity);
    setTotalPrice(order.total_price);

    // 5. Show toast notify
    showToast('Form order berhasil diisi otomatis!', 'success');
  };

  const getChartData = () => {
    if (chartYearFilter === 'all') {
      // Aggregate by year (2024, 2025, 2026)
      const yearlyData: Record<number, { spending: number; count: number }> = {
        2024: { spending: 0, count: 0 },
        2025: { spending: 0, count: 0 },
        2026: { spending: 0, count: 0 }
      };
      const yearsOrder = [2024, 2025, 2026];

      orders.forEach(o => {
        if (o.payment_status === 'paid' && o.status !== 'failed') {
          const od = new Date(o.created_at);
          const y = od.getFullYear();
          if (y in yearlyData) {
            yearlyData[y].spending += Number(o.total_price);
            yearlyData[y].count += 1;
          }
        }
      });

      return yearsOrder.map(y => ({
        label: `Thn ${y}`,
        spending: yearlyData[y].spending,
        count: yearlyData[y].count,
        showLabel: true
      }));
    }

    const year = Number(chartYearFilter);

    if (chartMonthFilter === 'all') {
      // Aggregate by month (12 months)
      const monthlyData: Record<number, { spending: number; count: number }> = {};
      const monthsOrder = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let m = 0; m < 12; m++) {
        monthlyData[m] = { spending: 0, count: 0 };
        monthsOrder.push({ month: m, label: monthNames[m] });
      }

      orders.forEach(o => {
        if (o.payment_status === 'paid' && o.status !== 'failed') {
          const od = new Date(o.created_at);
          if (od.getFullYear() === year) {
            const m = od.getMonth();
            if (monthlyData[m]) {
              monthlyData[m].spending += Number(o.total_price);
              monthlyData[m].count += 1;
            }
          }
        }
      });

      return monthsOrder.map(mo => ({
        label: mo.label,
        spending: monthlyData[mo.month].spending,
        count: monthlyData[mo.month].count,
        showLabel: true
      }));
    } else {
      // Aggregate by day of the selected month
      const month = Number(chartMonthFilter);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const dailyData: Record<number, { spending: number; count: number }> = {};
      const daysOrder = [];

      for (let d = 1; d <= daysInMonth; d++) {
        dailyData[d] = { spending: 0, count: 0 };
        // Determine whether to display X-axis label
        const showLabel = d === 1 || d === 5 || d === 10 || d === 15 || d === 20 || d === 25 || d === daysInMonth;
        daysOrder.push({ day: d, label: `Tgl ${d}`, showLabel });
      }

      orders.forEach(o => {
        if (o.payment_status === 'paid' && o.status !== 'failed') {
          const od = new Date(o.created_at);
          if (od.getFullYear() === year && od.getMonth() === month) {
            const d = od.getDate();
            if (dailyData[d]) {
              dailyData[d].spending += Number(o.total_price);
              dailyData[d].count += 1;
            }
          }
        }
      });

      return daysOrder.map(doItem => ({
        label: doItem.label,
        spending: dailyData[doItem.day].spending,
        count: dailyData[doItem.day].count,
        showLabel: doItem.showLabel
      }));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatPaymentMethod = (method?: string | null) => {
    if (!method) return 'Payment Gateway';
    const lower = method.toLowerCase();
    if (lower === 'qris') return 'QRIS';
    if (lower === 'bank_transfer') return 'Bank Transfer';
    if (lower === 'gopay') return 'GoPay';
    if (lower === 'shopeepay') return 'ShopeePay';
    if (lower === 'cstore') return 'Convenience Store (Indomaret/Alfamart)';
    if (lower === 'credit_card') return 'Credit Card';
    if (lower === 'wallet') return 'Saldo Akun';
    if (lower === 'midtrans') return 'Payment Gateway';
    return method.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Mock list generator
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
      },
      {
        id: '4',
        category: 'TikTok',
        name: 'TikTok Views Video [Instant]',
        price_per_k: 3000,
        min_order: 500,
        max_order: 100000,
        is_active: true,
        created_at: ''
      },
      {
        id: '5',
        category: 'YouTube',
        name: 'YouTube Subscribers [Permanent - No Drop]',
        price_per_k: 280000,
        min_order: 50,
        max_order: 2000,
        is_active: true,
        created_at: ''
      }
    ];
  }

  const filteredOrders = orders.filter(o => {
    let matchesSearch = false;
    if (searchTerm.includes(',')) {
      const searchIds = searchTerm.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      matchesSearch = searchIds.some(searchId =>
        o.id.toLowerCase().includes(searchId) ||
        (o.order_id ? String(o.order_id).includes(searchId) : false)
      );
    } else {
      matchesSearch = o.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.target_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.order_id ? String(o.order_id).includes(searchTerm.trim()) : false);
    }

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

    let matchesYear = true;
    if (orderYearFilter !== 'all') {
      const year = new Date(o.created_at).getFullYear().toString();
      matchesYear = year === orderYearFilter;
    }

    return matchesSearch && matchesStatus && matchesYear;
  });

  const filteredTxs = transactions.filter(tx => {
    // Show all transactions (topup, refund, order_payment, etc.) for full audit transparency

    // Status filter
    if (txStatusFilter !== 'all') {
      if (txStatusFilter === 'pending' && tx.status !== 'pending') return false;
      if (txStatusFilter === 'failed' && tx.status !== 'failed') return false;
      if (txStatusFilter === 'success' && tx.status !== 'success') return false;
    }

    // Year filter
    if (txYearFilter !== 'all') {
      const year = new Date(tx.created_at).getFullYear().toString();
      if (year !== txYearFilter) return false;
    }

    // Method filter
    if (txMethodFilter !== 'all') {
      const methodLower = (tx.payment_method || '').toLowerCase();
      if (txMethodFilter === 'qris') {
        const isQris = methodLower.includes('qris') || methodLower === 'midtrans';
        if (!isQris) return false;
      } else if (txMethodFilter === 'bank_transfer') {
        const isBank = methodLower.includes('bank_transfer') || methodLower.includes('va') || methodLower.includes('echannel');
        if (!isBank) return false;
      } else if (txMethodFilter === 'gopay') {
        if (!methodLower.includes('gopay')) return false;
      } else if (txMethodFilter === 'shopeepay') {
        if (!methodLower.includes('shopeepay')) return false;
      } else if (txMethodFilter === 'other') {
        const isStandard = methodLower.includes('qris') || methodLower === 'midtrans' || methodLower.includes('bank_transfer') || methodLower.includes('va') || methodLower.includes('echannel') || methodLower.includes('gopay') || methodLower.includes('shopeepay');
        if (isStandard) return false;
      }
    }

    // Search query filter
    if (txSearchQuery.trim() !== '') {
      const queryLower = txSearchQuery.toLowerCase().trim();
      if (txSearchType === 'id') {
        const queryClean = queryLower.replace('trx-', '');
        const matchesId = tx.id.toLowerCase().includes(queryLower) ||
          (tx.tx_id ? String(tx.tx_id).includes(queryClean) : false);
        if (!matchesId) return false;
      } else if (txSearchType === 'amount') {
        if (!tx.amount.toString().includes(queryLower)) return false;
      }
    }

    return true;
  });

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="mt-4 text-slate-400 text-sm">Menyiapkan dashboard Anda...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans transition-colors duration-300">

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      <div className="flex min-h-screen">

        {/* Left Sidebar */}
        <aside className={`fixed top-0 left-0 z-50 w-68 h-screen bg-slate-900 border-r border-slate-800/80 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 overflow-hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>


          <div className="space-y-6 flex-1 overflow-y-auto scrollbar-thin pr-1">
            {/* Logo/Brand */}
            <div className="flex items-center gap-2.5 px-2">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-2xl shadow-md shadow-pink-500/10 w-10 h-10 flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Zap className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm leading-tight text-slate-100 tracking-tight">
                  {brandName}
                </span>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-0.5">

                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="space-y-6 pt-4">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block px-3 mb-2.5">Menu Utama</span>
                <nav className="space-y-1">
                  <button
                    onClick={() => handleSidebarTabClick('dashboard')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'dashboard'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-950/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => handleSidebarTabClick('order', clearOrderForm)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'order'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-950/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Buat Pesanan</span>
                  </button>

                  <button
                    onClick={() => handleSidebarTabClick('services')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'services'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-950/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <List className="w-4 h-4" />
                    <span>Daftar Layanan</span>
                  </button>

                  <button
                    onClick={() => handleSidebarTabClick('history', () => fetchOrders(user.id))}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'history'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-950/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Riwayat Pesanan</span>
                  </button>

                  <button
                    onClick={() => handleSidebarTabClick('deposits', () => fetchProfileAndTransactions(user.id))}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'deposits'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-950/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span>Riwayat Deposit</span>
                  </button>

                  <button
                    onClick={() => handleSidebarTabClick('tickets', fetchTickets)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'tickets'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-950/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Tiket Bantuan</span>
                  </button>

                  <button
                    onClick={() => handleSidebarTabClick('leaderboard', () => fetchLeaderboard(leaderboardPeriod))}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'leaderboard'
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-500 dark:text-amber-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-950/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Peringkat</span>
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Sidebar Footer Logout */}
          <div className="pt-4 border-t border-slate-800/60">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </aside>
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-w-0 font-sans transition-all duration-300 ${isSidebarOpen ? 'lg:pl-68' : 'lg:pl-0'}`}>

          {/* Top Navbar */}
          <header className="h-16 bg-slate-900 border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-45 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Mobile Burger Toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-650 dark:text-indigo-400 hover:text-white dark:hover:text-white rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border border-indigo-150 dark:border-indigo-500/20 shadow-sm active:scale-95"
                title={isSidebarOpen ? "Sembunyikan Menu" : "Tampilkan Menu"}
              >
                {isSidebarOpen ? (
                  <ChevronLeft className="w-4.5 h-4.5" />
                ) : (
                  <Menu className="w-4.5 h-4.5" />
                )}
              </button>

              <h1 className="text-xs font-black text-slate-100 uppercase tracking-wider hidden sm:block">
                {activeTab === 'dashboard' && 'Statistik & Ringkasan Akun'}
                {activeTab === 'order' && 'Buat Pesanan Baru'}
                {activeTab === 'services' && 'Daftar Layanan SMM & Buzzer'}
                {activeTab === 'history' && 'Riwayat Pesanan Anda'}
                {activeTab === 'transactions' && 'Log Mutasi Saldo'}
                {activeTab === 'deposits' && 'Riwayat Deposit & Top Up'}
                {activeTab === 'tickets' && 'Tiket Bantuan Pelanggan'}
                {activeTab === 'leaderboard' && '🏆 Peringkat Pengguna'}
              </h1>
            </div>

            {/* Profile Info, Balance & Theme Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTopupModal(true)}
                className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-850 text-slate-900 dark:text-slate-200 font-extrabold border border-slate-200 dark:border-slate-800/80 text-xs tracking-tight flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-102 active:scale-98"
                title="Klik untuk Top Up Saldo"
              >
                <Wallet className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                <span>Saldo: {formatPrice(balance)}</span>
              </button>

              {/* Profile Dropdown Container */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="h-10 px-4 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs font-extrabold text-slate-900 dark:text-slate-200 shadow-sm transition-all cursor-pointer shrink-0"
                  title="Menu Akun"
                >
                  <User className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                  <span className="truncate max-w-[120px] hidden sm:inline">{userProfile?.full_name || user?.email}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileDropdownOpen && (
                  <>
                    {/* Overlay to close dropdown when clicking outside */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150 py-3 font-inter">
                      {/* User Info Header */}
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-850">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-400 block">Akun Anda</span>
                        <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">{userProfile?.full_name || 'Pelanggan'}</span>
                        <span className="block text-[10.5px] font-medium text-slate-600 dark:text-slate-455 truncate mt-0.5">{user?.email}</span>
                      </div>

                      {/* Menu List */}
                      <div className="px-1.5 py-1">

                        {/* Riwayat Saldo Link */}
                        <button
                          onClick={() => {
                            setActiveTab('transactions');
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-655 dark:text-slate-350 hover:bg-slate-855/50 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                        >
                          <CreditCard className="w-4 h-4 text-slate-400" />
                          <span>Riwayat Saldo</span>
                        </button>



                        {/* Pengaturan / Password Link */}
                        <button
                          onClick={() => {
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                            setChangePasswordError('');
                            setChangePasswordSuccess('');
                            setShowProfileModal(true);
                            setIsProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-655 dark:text-slate-350 hover:bg-slate-855/50 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Pengaturan</span>
                        </button>

                        <div className="h-px bg-slate-100 dark:bg-slate-855 my-1" />

                        {/* Logout Link */}
                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Keluar Akun</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <PremiumThemeToggle />
            </div>
          </header>

          {/* Main Dashboard Container */}
          <main className="p-6 md:p-8 pb-28 md:pb-8 space-y-6 flex-1 overflow-y-auto bg-slate-950">

            {/* Dashboard Overview Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Wallet and Stats Cards — Dribbble Premium */}
                <div className="grid md:grid-cols-3 gap-5">
                  {/* Balance Card */}
                  <div className="relative overflow-hidden bg-slate-900 border border-indigo-500/15 shadow-sm p-6 rounded-3xl flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/25 hover:scale-[1.02] group animate-border-glow">
                    {/* Subtle glow accent */}
                    <div className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-500/8 blur-3xl rounded-full group-hover:bg-indigo-500/12 transition-colors"></div>
                    <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-indigo-400/5 blur-2xl rounded-full"></div>

                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Saldo Anda</span>
                        <div className="text-3xl font-black text-slate-100 mt-1.5 tabular-nums tracking-tight">{formatPrice(balance)}</div>
                      </div>
                      <div className="bg-indigo-500/12 p-3.5 rounded-2xl border border-indigo-500/15 shrink-0 group-hover:bg-indigo-500/18 transition-colors">
                        <Wallet className="w-6 h-6 text-indigo-400" />
                      </div>
                    </div>
                    <div className="mt-6 relative z-10">
                      <button
                        onClick={() => setShowTopupModal(true)}
                        className="shimmer-btn w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer hover:scale-102 shadow-lg shadow-indigo-600/20"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Top Up Saldo</span>
                      </button>
                    </div>
                  </div>

                  {/* Total Orders Card */}
                  <div className="relative overflow-hidden bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 hover:border-purple-500/20 hover:scale-[1.02] group">
                    {/* Glow */}
                    <div className="absolute -top-8 -right-8 w-32 h-32 bg-purple-500/8 blur-3xl rounded-full group-hover:bg-purple-500/12 transition-colors"></div>

                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Pesanan</span>
                        <div className="text-3xl font-black text-slate-100 mt-1.5 tabular-nums">{orders.length}</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/15 p-3.5 rounded-2xl border border-purple-500/15 shrink-0 group-hover:from-purple-500/30 group-hover:to-fuchsia-500/25 transition-all">
                        <ShoppingBag className="w-6 h-6 text-purple-400" />
                      </div>
                    </div>
                    <div className="mt-5 relative z-10">
                      <div className="flex items-center gap-2 text-[11px] text-slate-450 dark:text-slate-400 font-medium">
                        <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-700" style={{ width: `${Math.min((orders.length / Math.max(orders.length, 10)) * 100, 100)}%` }}></div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium mt-2 block">Semua transaksi pesanan yang pernah Anda buat</span>
                    </div>
                  </div>

                  {/* Active Orders Card */}
                  {(() => {
                    const activeCount = orders.filter(o => o.status === 'processing' || o.status === 'inprogress').length;
                    return (
                      <div className="relative overflow-hidden bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/20 hover:scale-[1.02] group">
                        {/* Glow */}
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-emerald-500/8 blur-3xl rounded-full group-hover:bg-emerald-500/12 transition-colors"></div>

                        <div className="flex justify-between items-start relative z-10">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              Layanan Aktif
                              {activeCount > 0 && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                              )}
                            </span>
                            <div className="text-3xl font-black text-slate-100 mt-1.5 flex items-baseline gap-2 tabular-nums">
                              {activeCount}
                              <span className="text-xs font-semibold text-slate-450 dark:text-slate-400">berjalan</span>
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/15 p-3.5 rounded-2xl border border-emerald-500/15 shrink-0 group-hover:from-emerald-500/30 group-hover:to-teal-500/25 transition-all">
                            <Activity className="w-6 h-6 text-emerald-400" />
                          </div>
                        </div>
                        <div className="mt-5 relative z-10">
                          <div className="flex items-center gap-2">
                            {activeCount > 0 ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/15">
                                <Activity className="w-3 h-3" />
                                {activeCount} sedang diproses
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 font-medium">Tidak ada pesanan aktif saat ini</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {/* SVG Line Chart Card (Dribbble-Style) */}
                <div className="relative overflow-hidden bg-slate-900 border border-slate-800/80 shadow-sm p-5 sm:p-6 lg:p-8 rounded-3xl backdrop-blur-md">
                  {/* Subtle background glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>

                  {/* Header & Filters */}
                  <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5 mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl shadow-md shadow-indigo-500/20">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <span>Statistik Akun Anda</span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-1.5 ml-[42px]">Analisis visual pengeluaran dan jumlah order berhasil Anda</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Year Filter */}
                      <select
                        value={chartYearFilter}
                        onChange={(e) => {
                          const val = e.target.value;
                          setChartYearFilter(val);
                          if (val === 'all') {
                            setChartMonthFilter('all');
                          }
                        }}
                        className="force-white-bg border border-slate-200 dark:border-slate-800 text-slate-200 dark:text-slate-100 font-semibold px-3 py-2 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-500 shadow-sm hover:border-slate-700 transition-colors"
                      >
                        <option value="all">Semua Tahun</option>
                        <option value="2026">Tahun 2026</option>
                        <option value="2025">Tahun 2025</option>
                        <option value="2024">Tahun 2024</option>
                      </select>

                      {/* Month Filter */}
                      <select
                        value={chartMonthFilter}
                        onChange={(e) => setChartMonthFilter(e.target.value)}
                        disabled={chartYearFilter === 'all'}
                        className="force-white-bg border border-slate-200 dark:border-slate-800 text-slate-200 dark:text-slate-100 font-semibold px-3 py-2 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-700 transition-colors"
                      >
                        <option value="all">Semua Bulan</option>
                        <option value="0">Januari</option>
                        <option value="1">Februari</option>
                        <option value="2">Maret</option>
                        <option value="3">April</option>
                        <option value="4">Mei</option>
                        <option value="5">Juni</option>
                        <option value="6">Juli</option>
                        <option value="7">Agustus</option>
                        <option value="8">September</option>
                        <option value="9">Oktober</option>
                        <option value="10">November</option>
                        <option value="11">Desember</option>
                      </select>

                      {/* Data Type Toggle Buttons */}
                      <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                        <button
                          onClick={() => setChartDataType('spending')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${chartDataType === 'spending'
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                          Pengeluaran
                        </button>
                        <button
                          onClick={() => setChartDataType('orders')}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${chartDataType === 'orders'
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/25'
                            : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                          Order Berhasil
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary Cards Dashboard (Dribbble Style) */}
                  {(() => {
                    const isAllYears = chartYearFilter === 'all';
                    const yearVal = isAllYears ? null : Number(chartYearFilter);
                    const monthVal = chartMonthFilter === 'all' ? null : Number(chartMonthFilter);

                    const filteredPaidOrders = orders.filter(o => {
                      if (o.payment_status !== 'paid' || o.status === 'failed') return false;
                      const d = new Date(o.created_at);
                      if (yearVal !== null && d.getFullYear() !== yearVal) return false;
                      if (monthVal !== null && d.getMonth() !== monthVal) return false;
                      return true;
                    });

                    const totalSpending = filteredPaidOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
                    const totalCount = filteredPaidOrders.length;
                    const averageTicket = totalCount > 0 ? totalSpending / totalCount : 0;

                    return (
                      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-950/50 border border-slate-800/60 p-4.5 rounded-2xl hover:border-indigo-500/20 transition-colors group/card">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-indigo-500/15 p-1.5 rounded-lg">
                              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Pengeluaran</span>
                          </div>
                          <div className="text-lg font-black text-slate-100 tabular-nums">{formatPrice(totalSpending)}</div>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-800/60 p-4.5 rounded-2xl hover:border-amber-500/20 transition-colors group/card">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-amber-500/15 p-1.5 rounded-lg">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Rata-rata Order</span>
                          </div>
                          <div className="text-lg font-black text-amber-400 tabular-nums">{formatPrice(averageTicket)}</div>
                        </div>
                        <div className="bg-slate-950/50 border border-slate-800/60 p-4.5 rounded-2xl hover:border-emerald-500/20 transition-colors group/card">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-emerald-500/15 p-1.5 rounded-lg">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Pesanan Sukses</span>
                          </div>
                          <div className="text-lg font-black text-emerald-400 tabular-nums">{totalCount.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-500">Order</span></div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Responsive SVG Chart — Premium Dribbble Style */}
                  {(() => {
                    const chartData = getChartData();
                    const maxValue = Math.max(...chartData.map(d => chartDataType === 'spending' ? d.spending : d.count), 1);
                    const height = 200;
                    const width = 640;
                    const paddingLeft = 55;
                    const paddingRight = 20;
                    const paddingTop = 20;
                    const paddingBottom = 35;

                    // Generate points
                    const points = chartData.map((d, index) => {
                      const val = chartDataType === 'spending' ? d.spending : d.count;
                      const x = paddingLeft + (index * (width - paddingLeft - paddingRight)) / (chartData.length - 1);
                      const y = paddingTop + (1 - val / maxValue) * (height - paddingTop - paddingBottom);
                      return { x, y, label: d.label, rawVal: val, showLabel: d.showLabel };
                    });

                    // Smooth bezier curve path
                    const smoothPath = points.reduce((acc, p, i, arr) => {
                      if (i === 0) return `M ${p.x} ${p.y}`;
                      const prev = arr[i - 1];
                      const cpx1 = prev.x + (p.x - prev.x) * 0.4;
                      const cpx2 = p.x - (p.x - prev.x) * 0.4;
                      return `${acc} C ${cpx1} ${prev.y}, ${cpx2} ${p.y}, ${p.x} ${p.y}`;
                    }, '');

                    const areaPath = points.length > 0
                      ? `${smoothPath} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
                      : '';

                    return (
                      <div className="relative z-10 w-full max-w-full overflow-x-auto scrollbar-none">
                        <style>{`
                          @keyframes drawPath {
                            from { stroke-dashoffset: 2000; }
                            to { stroke-dashoffset: 0; }
                          }
                          @keyframes fadeInArea {
                            from { opacity: 0; }
                            to { opacity: 1; }
                          }
                          @keyframes popPoint {
                            from { transform: scale(0); opacity: 0; }
                            to { transform: scale(1); opacity: 1; }
                          }
                          .animate-chart-line-v2 {
                            stroke-dasharray: 2000;
                            stroke-dashoffset: 2000;
                            animation: drawPath 2s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                          }
                          .animate-chart-area-v2 {
                            opacity: 0;
                            animation: fadeInArea 1.2s ease-out 1s forwards;
                          }
                          .animate-chart-point-v2 {
                            animation: popPoint 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
                          }
                        `}</style>
                        <div className="relative h-[240px] min-w-[320px] sm:min-w-[580px] w-full">
                          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                            {/* Gradients */}
                            <defs>
                              <linearGradient id="chartGradV2" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#818cf8" stopOpacity="0.30" />
                                <stop offset="50%" stopColor="#6366f1" stopOpacity="0.12" />
                                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                              </linearGradient>
                              <linearGradient id="lineGradV2" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="50%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#a78bfa" />
                              </linearGradient>
                              <filter id="dotGlow">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge>
                                  <feMergeNode in="blur" />
                                  <feMergeNode in="SourceGraphic" />
                                </feMerge>
                              </filter>
                            </defs>

                            {/* Y Grid Lines & Labels — 5 levels */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                              const y = paddingTop + ratio * (height - paddingTop - paddingBottom);
                              const gridVal = maxValue * (1 - ratio);
                              return (
                                <g key={idx}>
                                  <line
                                    x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y}
                                    stroke="currentColor"
                                    className="text-slate-800/40"
                                    strokeDasharray={idx === 4 ? "0" : "3 6"}
                                    strokeWidth={idx === 4 ? "1" : "0.5"}
                                  />
                                  <text x={paddingLeft - 10} y={y + 4} textAnchor="end" className="fill-slate-500 text-[9px] font-medium" style={{ fontFamily: 'ui-monospace, monospace' }}>
                                    {chartDataType === 'spending' ? formatPrice(gridVal) : Math.round(gridVal)}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Area Fill */}
                            {areaPath && <path d={areaPath} fill="url(#chartGradV2)" className="animate-chart-area-v2" />}

                            {/* Line Path — smooth bezier with gradient stroke */}
                            {smoothPath && (
                              <path
                                d={smoothPath}
                                fill="none"
                                stroke="url(#lineGradV2)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="animate-chart-line-v2"
                              />
                            )}

                            {/* Data Points with glow */}
                            {points.map((p, idx) => (
                              <g
                                key={idx}
                                className="group/dot cursor-pointer animate-chart-point-v2"
                                style={{
                                  transformOrigin: `${p.x}px ${p.y}px`,
                                  animationDelay: `${idx * 0.06 + 0.8}s`
                                }}
                              >
                                {/* Outer glow ring */}
                                <circle cx={p.x} cy={p.y} r="10" className="fill-indigo-500/0 group-hover/dot:fill-indigo-500/15 transition-all duration-300" />
                                {/* Glow effect */}
                                <circle cx={p.x} cy={p.y} r="6" className="fill-indigo-400/0 group-hover/dot:fill-indigo-400/25 transition-all duration-300" filter="url(#dotGlow)" />
                                {/* Dot */}
                                <circle cx={p.x} cy={p.y} r="3.5" className="fill-indigo-500 stroke-slate-900 stroke-[2.5]" />
                                {/* Inner white dot */}
                                <circle cx={p.x} cy={p.y} r="1.5" className="fill-white opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200" />

                                {/* Tooltip */}
                                <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200">
                                  <rect x={p.x - 40} y={p.y - 30} width="80" height="22" rx="8" className="fill-slate-800" stroke="#334155" strokeWidth="0.5" />
                                  <text x={p.x} y={p.y - 15} textAnchor="middle" className="fill-white text-[9px] font-bold">
                                    {chartDataType === 'spending' ? formatPrice(p.rawVal) : `${p.rawVal} order`}
                                  </text>
                                </g>
                              </g>
                            ))}

                            {/* X Axis Labels */}
                            {points.map((p, idx) => {
                              if (!p.showLabel) return null;
                              return (
                                <text key={idx} x={p.x} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[9px] font-semibold" style={{ fontFamily: 'ui-monospace, monospace' }}>
                                  {p.label}
                                </text>
                              );
                            })}
                          </svg>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Grid 2-Column: Left (Info) & Right (Recommendations) */}
                <div className="grid lg:grid-cols-2 gap-6 items-start">
                  {/* Left Column: Info & Pengumuman Penting */}
                  {announcements.length > 0 ? (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm p-4 sm:p-6 rounded-3xl backdrop-blur-md space-y-4 min-w-0 w-full">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg shadow-sm shadow-indigo-500/20">
                            <Megaphone className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Info & Pengumuman Penting</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowNewsModal(true)}
                          className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-650 dark:hover:text-indigo-300 font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Buka Popup Berita</span>
                          <span className="animate-pulse">🔔</span>
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          const announcementsItemsPerPage = 5;
                          const paginatedAnnouncements = announcements.slice((announcementsPage - 1) * announcementsItemsPerPage, announcementsPage * announcementsItemsPerPage);
                          const announcementsTotalPages = Math.ceil(announcements.length / announcementsItemsPerPage);

                          return (
                            <>
                              {paginatedAnnouncements.map(ann => (
                                <div key={ann.id} className="relative p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 flex items-start justify-between gap-3.5 hover:border-indigo-500/20 dark:hover:border-indigo-500/20 transition-all group/ann overflow-hidden">
                                  {/* Accent strip */}
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${ann.badge === 'URGENT' || ann.badge === 'PENTING' ? 'bg-red-500' : ann.badge === 'UPDATE' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></div>
                                  <div className="flex items-start gap-3.5 flex-1 min-w-0 pl-2">
                                    <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${ann.badge === 'URGENT' || ann.badge === 'PENTING' ? 'bg-gradient-to-br from-red-500 to-rose-600' : ann.badge === 'UPDATE' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                                      <Award className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {ann.badge && (
                                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide inline-block ${getAnnouncementBadgeClass(ann.badge)}`}>
                                            {ann.badge}
                                          </span>
                                        )}
                                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                                          {ann.title}
                                          {ann.is_pinned && (
                                            <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0 transform rotate-45" />
                                          )}
                                        </h4>
                                      </div>
                                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-light line-clamp-2">{ann.content}</p>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedAnnouncement(ann)}
                                        className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-bold mt-1.5 flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <span>Detail Selengkapnya</span>
                                        <span>&rarr;</span>
                                      </button>
                                    </div>
                                  </div>
                                  {ann.image_url && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedAnnouncement(ann)}
                                      className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-100 dark:bg-slate-950 hover:opacity-80 transition-opacity cursor-pointer"
                                      title="Klik untuk memperbesar gambar"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={ann.image_url} alt="Thumbnail Banner" className="w-full h-full object-cover" />
                                    </button>
                                  )}
                                </div>
                              ))}

                              {announcementsTotalPages > 1 && (
                                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-850/60 mt-4 text-[10px]">
                                  <button
                                    type="button"
                                    disabled={announcementsPage === 1}
                                    onClick={() => setAnnouncementsPage(prev => Math.max(1, prev - 1))}
                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-200 disabled:dark:hover:border-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg font-bold transition-all cursor-pointer"
                                  >
                                    &larr; Prev
                                  </button>
                                  <span className="text-slate-500 dark:text-slate-500 font-medium">Page {announcementsPage} of {announcementsTotalPages}</span>
                                  <button
                                    type="button"
                                    disabled={announcementsPage >= announcementsTotalPages}
                                    onClick={() => setAnnouncementsPage(prev => Math.min(announcementsTotalPages, prev + 1))}
                                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850 hover:border-slate-300 dark:hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-200 disabled:dark:hover:border-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg font-bold transition-all cursor-pointer"
                                  >
                                    Next &rarr;
                                  </button>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm p-6 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center py-12 text-center text-slate-500 text-xs min-w-0 w-full">
                      <Megaphone className="w-8 h-8 text-slate-400 dark:text-slate-650 mb-2" />
                      <span>Belum ada pengumuman terbaru.</span>
                    </div>
                  )}

                  {/* Right Column: Layanan Rekomendasi */}
                  <div className="relative overflow-hidden bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl backdrop-blur-md min-w-0 w-full">
                    <button
                      type="button"
                      onClick={() => setIsRecomExpanded(!isRecomExpanded)}
                      className="w-full flex items-center justify-between p-6 sm:p-7 hover:bg-slate-900/10 dark:hover:bg-slate-900/30 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg shadow-sm shadow-indigo-500/20">
                          <ThumbsUp className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Layanan Rekomendasi</span>
                      </div>
                      {isRecomExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      )}
                    </button>

                    {isRecomExpanded && (
                      <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-t border-slate-805 dark:border-slate-850/60 pt-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid sm:grid-cols-2 gap-4">
                          {(() => {
                            let recommended = services.filter(s => s.is_recommended);
                            if (recommended.length === 0) {
                              recommended = services.slice(0, 18);
                            }

                            if (recommended.length === 0) {
                              return (
                                <p className="text-slate-400 text-xs font-light col-span-full py-8 text-center bg-slate-950/20 rounded-2xl border border-slate-850">Belum ada layanan tersedia.</p>
                              );
                            }

                            const recomItemsPerPage = 6;
                            const paginatedRecom = recommended.slice((recomPage - 1) * recomItemsPerPage, recomPage * recomItemsPerPage);
                            const recomTotalPages = Math.ceil(recommended.length / recomItemsPerPage);

                            return (
                              <>
                                {paginatedRecom.map((service, index) => {
                                  const actualIndex = ((recomPage - 1) * recomItemsPerPage) + index;
                                  return (
                                    <div
                                      key={service.id}
                                      className="relative p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between gap-4 hover:border-indigo-500/30 hover:bg-slate-950/60 transition-all group min-w-0 w-full hover:shadow-lg hover:shadow-indigo-500/5"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                          <span className="text-[9px] font-extrabold text-white uppercase bg-gradient-to-r from-indigo-600 to-purple-600 px-2 py-0.5 rounded-md shadow-sm">
                                            #{actualIndex + 1}
                                          </span>
                                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/50 px-1.5 py-0.5 rounded">
                                            {service.category}
                                          </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-355 dark:text-slate-350 whitespace-normal break-words leading-relaxed group-hover:text-indigo-400 transition-colors" title={service.name}>
                                          {service.name}
                                        </h4>
                                        <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-extrabold mt-1 tabular-nums">
                                          {formatPrice(service.price_per_k)} <span className="text-[9px] text-slate-500 font-normal">/ 1K</span>
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          isAutofillNavigating.current = true;
                                          clearOrderForm();
                                          setSelectedCategory(service.category);
                                          setSelectedService(service);
                                          setActiveTab('order');
                                          showToast(`Layanan '${service.name}' dipilih.`, 'success');
                                        }}
                                        className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white transition-all active:scale-95 cursor-pointer shrink-0 shadow-md shadow-indigo-600/20"
                                        title="Pesan Sekarang"
                                      >
                                        <ShoppingBag className="w-4 h-4" />
                                      </button>
                                    </div>
                                  );
                                })}

                                {recomTotalPages > 1 && (
                                  <div className="col-span-full flex justify-between items-center pt-4 border-t border-slate-850/60 mt-4 text-[10px]">
                                    <button
                                      type="button"
                                      disabled={recomPage === 1}
                                      onClick={() => setRecomPage(prev => Math.max(1, prev - 1))}
                                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-850 text-slate-300 hover:text-white rounded-lg font-bold transition-all cursor-pointer"
                                    >
                                      &larr; Prev
                                    </button>
                                    <span className="text-slate-500 font-medium">Page {recomPage} of {recomTotalPages}</span>
                                    <button
                                      type="button"
                                      disabled={recomPage >= recomTotalPages}
                                      onClick={() => setRecomPage(prev => Math.min(recomTotalPages, prev + 1))}
                                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-850 text-slate-300 hover:text-white rounded-lg font-bold transition-all cursor-pointer"
                                    >
                                      Next &rarr;
                                    </button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Order Form Tab */}
            {activeTab === 'order' && (
              <div className="grid lg:grid-cols-3 gap-8 items-start">

                {/* Form Card */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 shadow-sm p-6 sm:p-8 rounded-3xl backdrop-blur-md">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    <span>Formulir Pemesanan</span>
                  </h2>

                  {formError && (
                    <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex gap-2 items-start">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handlePlaceOrder} className="space-y-6">

                    <div className="grid sm:grid-cols-2 gap-6 min-w-0">
                      {/* Category Selection */}
                      <div className="space-y-2 relative min-w-0">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Kategori</label>

                        {/* Custom Category Selector Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                            setIsServiceDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between force-white-bg border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-200 dark:text-slate-100 px-4 py-3.5 rounded-2xl outline-none transition-all text-sm text-left cursor-pointer min-w-0 max-w-full"
                        >
                          <span className="truncate block w-full">{selectedCategory || 'Pilih Kategori...'}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Custom Category Dropdown List */}
                        {isCategoryDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1.5 force-white-bg border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150 max-h-[300px] flex flex-col">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-900 force-white-bg sticky top-0 backdrop-blur-md">
                              <input
                                type="text"
                                placeholder="Cari Kategori..."
                                value={categorySearchQuery}
                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                className="w-full force-white-bg border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-250 dark:text-slate-100 px-3 py-2 rounded-xl outline-none text-xs"
                                autoFocus
                              />
                            </div>
                            <div className="overflow-y-auto scrollbar-thin flex-1 py-1">
                              {categories
                                .filter(cat => cat.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                                .map(cat => (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCategory(cat);
                                      setIsCategoryDropdownOpen(false);
                                      setCategorySearchQuery('');
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-indigo-600/10 hover:text-indigo-500 dark:text-indigo-400 transition-colors ${selectedCategory === cat ? 'bg-indigo-600/20 text-indigo-450 font-semibold' : 'text-slate-300 dark:text-slate-300'
                                      }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              {categories.filter(cat => cat.toLowerCase().includes(categorySearchQuery.toLowerCase())).length === 0 && (
                                <div className="px-4 py-3 text-xs text-slate-500 text-center">Kategori tidak ditemukan</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Service Selection */}
                      <div className="space-y-2 relative min-w-0">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Layanan</label>
                        <div className="flex gap-2 min-w-0 w-full">
                          {/* Custom Service Selector Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsServiceDropdownOpen(!isServiceDropdownOpen);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className="flex-1 flex items-center justify-between force-white-bg border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-200 dark:text-slate-100 px-4 py-3.5 rounded-2xl outline-none transition-all text-sm text-left cursor-pointer min-w-0 max-w-[calc(100vw-140px)] sm:max-w-none"
                          >
                            {selectedService ? (
                              <span className="truncate block w-full">
                                {getNumericId(selectedService)} - {selectedService.name}
                              </span>
                            ) : (
                              <span className="truncate block w-full text-slate-400">Pilih Layanan...</span>
                            )}
                            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {selectedService && (
                            <button
                              type="button"
                              onClick={() => toggleFavorite(selectedService.id)}
                              className={`p-3.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer ${favorites.includes(selectedService.id)
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                : 'force-white-bg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                              title={favorites.includes(selectedService.id) ? 'Hapus dari Layanan Favorit' : 'Simpan ke Layanan Favorit'}
                            >
                              <Star className={`w-5 h-5 ${favorites.includes(selectedService.id) ? 'fill-current' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Custom Service Dropdown List */}
                        {isServiceDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1.5 force-white-bg border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150 max-h-[300px] flex flex-col">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-900 force-white-bg sticky top-0 backdrop-blur-md">
                              <input
                                type="text"
                                placeholder="Cari Layanan (Nama atau ID)..."
                                value={serviceSearchQuery}
                                onChange={(e) => setServiceSearchQuery(e.target.value)}
                                className="w-full force-white-bg border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-250 dark:text-slate-100 px-3 py-2 rounded-xl outline-none text-xs"
                                autoFocus
                              />
                            </div>
                            <div className="overflow-y-auto scrollbar-thin flex-1 py-1">
                              {services
                                .filter(s => {
                                  const matchesCategory = s.category === selectedCategory;
                                  const srvId = getNumericId(s);
                                  const matchesSearch = s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
                                    srvId.toLowerCase().includes(serviceSearchQuery.toLowerCase());
                                  return matchesCategory && matchesSearch;
                                })
                                .map(service => {
                                  const displayId = getNumericId(service);
                                  return (
                                    <button
                                      key={service.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedService(service);
                                        setIsServiceDropdownOpen(false);
                                        setServiceSearchQuery('');
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-indigo-600/10 hover:text-indigo-500 dark:text-indigo-400 transition-colors flex flex-col gap-0.5 ${selectedService?.id === service.id ? 'bg-indigo-600/20 text-indigo-450 font-semibold' : 'text-slate-300 dark:text-slate-300'
                                        }`}
                                    >
                                      <span className="block truncate">{displayId} - {service.name}</span>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        {formatPrice(service.price_per_k)} / 1K | Min: {service.min_order.toLocaleString()} - Max: {service.max_order.toLocaleString()}
                                      </span>
                                    </button>
                                  );
                                })}
                              {services.filter(s => {
                                const matchesCategory = s.category === selectedCategory;
                                const srvId = getNumericId(s);
                                return matchesCategory && (
                                  s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
                                  srvId.toLowerCase().includes(serviceSearchQuery.toLowerCase())
                                );
                              }).length === 0 && (
                                  <div className="px-4 py-3 text-xs text-slate-500 text-center">Layanan tidak ditemukan</div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Service Description */}
                    {selectedService && selectedService.description && (
                      <div className="relative overflow-hidden p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200/85 dark:border-indigo-500/25 text-xs shadow-sm w-full max-w-full break-words">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-xl pointer-events-none" />
                        <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-850">
                          <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Deskripsi Layanan</span>
                        </div>
                        <div
                          className="text-slate-700 dark:text-slate-350 leading-relaxed font-semibold text-xs pl-0.5 whitespace-pre-wrap select-text [&_a]:text-indigo-500 dark:text-slate-400 [&_a]:underline [&_a]:hover:text-indigo-300 tracking-wide font-sans break-words"
                          dangerouslySetInnerHTML={{ __html: selectedService.description }}
                        />
                      </div>
                    )}

                    {/* Target URL */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Data Target / URL Profil / Link Video</label>
                      {(() => {
                        const targetGuide = getTargetGuide(selectedCategory);
                        return (
                          <>
                            <input
                              type="text"
                              required
                              placeholder={targetGuide.placeholder}
                              value={targetUrl}
                              onChange={(e) => setTargetUrl(e.target.value)}
                              className="w-full force-white-bg border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-200 dark:text-slate-100 px-4 py-3.5 rounded-2xl outline-none transition-all text-sm font-medium"
                            />
                            <p className="mt-2 text-[11.5px] leading-relaxed bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 rounded-xl p-3.5 flex gap-2 items-start shadow-sm">
                              <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                              <span className="text-slate-850 dark:text-slate-200 font-semibold">
                                <strong className="font-black uppercase text-indigo-600 dark:text-indigo-400 mr-1.5">[Petunjuk]:</strong>
                                {targetGuide.guide}
                              </span>
                            </p>
                          </>
                        );
                      })()}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* Quantity Input */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jumlah Pesanan</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          required
                          value={formatNumberWithDots(quantity)}
                          onChange={(e) => setQuantity(parseNumberFromDots(e.target.value))}
                          placeholder="Contoh: 1.000"
                          className="w-full force-white-bg border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-200 dark:text-slate-100 px-4 py-3.5 rounded-2xl outline-none transition-all text-sm font-semibold"
                        />
                        {selectedService && (
                          <div className="mt-2.5 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10.5px] text-slate-400 flex items-start gap-2 w-full max-w-full break-words">
                            <Info className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                            <div className="w-full min-w-0">
                              <p className="font-semibold text-slate-350 dark:text-slate-300">Batas order layanan ini:</p>
                              <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[10px]">
                                <li>Min Order: <strong className="text-slate-700 dark:text-slate-200">{selectedService.min_order.toLocaleString()}</strong></li>
                                <li>Max Order: <strong className="text-slate-700 dark:text-slate-200">{selectedService.max_order.toLocaleString()}</strong></li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Calculations Display */}
                      <div className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/15 p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Harga per 1.000 (1K)</span>
                          <div className="text-base font-bold text-slate-100 dark:text-slate-200">
                            {selectedService ? formatPrice(selectedService.price_per_k) : 'IDR 0'}
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-indigo-500/10 flex justify-between items-end">
                          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Harga</span>
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatPrice(totalPrice)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Validation helper info */}
                    {selectedService && (
                      <div className="space-y-4 w-full max-w-full overflow-hidden break-words">
                        {/* Category specific warning */}
                        {selectedCategory && (siteSettings[`warning_title_${selectedCategory.toLowerCase()}`] || siteSettings[`warning_desc_${selectedCategory.toLowerCase()}`]) && (
                          <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-500/5 border border-indigo-500/10 dark:border-indigo-500/10 text-xs text-slate-300 dark:text-slate-300 w-full max-w-full overflow-hidden break-words">
                            <div className="flex flex-col gap-3">
                              {siteSettings[`warning_title_${selectedCategory.toLowerCase()}`] && (
                                <button
                                  type="button"
                                  onClick={() => setWarningExpanded(!warningExpanded)}
                                  className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                                >
                                  <div className="flex gap-2 items-center">
                                    <AlertCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-500 dark:text-indigo-400 shrink-0" />
                                    <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-500 dark:text-indigo-400">
                                      {siteSettings[`warning_title_${selectedCategory.toLowerCase()}`]}
                                    </span>
                                  </div>
                                  <div className="shrink-0 lg:hidden">
                                    {warningExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-indigo-500" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-indigo-500" />
                                    )}
                                  </div>
                                </button>
                              )}

                              <div className={`flex-col md:flex-row gap-4 items-start ${warningExpanded ? 'flex' : 'hidden lg:flex'}`}>
                                <div className="flex-1 space-y-1 w-full max-w-full overflow-hidden break-words">
                                  {siteSettings[`warning_desc_${selectedCategory.toLowerCase()}`] && renderWarningContent(siteSettings[`warning_desc_${selectedCategory.toLowerCase()}`])}

                                  {siteSettings[`warning_video_url_${selectedCategory.toLowerCase()}`] && (
                                    <div className="pt-2">
                                      <a
                                        href={siteSettings[`warning_video_url_${selectedCategory.toLowerCase()}`]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/15 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-500 dark:text-indigo-400 text-[10px] font-bold transition-all"
                                      >
                                        <Play className="w-3 h-3 fill-current" />
                                        <span>Tonton Video Panduan</span>
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {siteSettings[`warning_image_url_${selectedCategory.toLowerCase()}`] && (
                                  <a
                                    href={siteSettings[`warning_image_url_${selectedCategory.toLowerCase()}`]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block shrink-0 overflow-hidden rounded-xl border border-indigo-500/10 hover:border-indigo-500 bg-slate-950/80 max-w-[120px] transition-all hover:scale-105"
                                    title="Klik untuk memperbesar"
                                  >
                                    <img
                                      src={siteSettings[`warning_image_url_${selectedCategory.toLowerCase()}`]}
                                      alt="Panduan Kategori"
                                      className="w-full h-auto object-cover opacity-95"
                                    />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Service Description removed and moved above target input */}

                        {selectedService.average_duration && (
                          <div className="relative overflow-hidden p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs shadow-md w-full max-w-full break-words">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-xl pointer-events-none" />
                            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-indigo-500/10">
                              <Zap className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                              <span className="font-extrabold text-[10px] text-indigo-500 uppercase tracking-wider">Informasi Kecepatan Layanan</span>
                            </div>
                            <p className="text-slate-200 leading-relaxed font-semibold">
                              Kecepatan Rata-Rata: {selectedService.average_duration}
                            </p>
                            <p className="text-slate-400 text-[10px] leading-relaxed font-light mt-1.5">
                              *Kecepatan rata-rata didasarkan pada data order selesai sebelumnya. Kecepatan bisa lebih cepat atau lebih lambat tergantung beban server provider pusat.
                            </p>
                          </div>
                        )}

                        {/* Order limits box removed and moved under quantity input */}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingOrder || !selectedService}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/15 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submittingOrder ? 'Membuat Permintaan...' : 'Buat Permintaan & Bayar'}
                    </button>
                  </form>
                </div>

                {/* Sidebar Guidelines */}
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl">
                    <h3 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                      <span>Petunjuk Penting</span>
                    </h3>
                    <ul className="space-y-3.5 text-xs text-slate-400 font-light leading-relaxed mb-6">
                      <li className="flex gap-2">
                        <span className="text-indigo-500 dark:text-indigo-400 font-bold"></span>
                        <span>Pengisian data jumlah awal (start count) dilakukan otomatis oleh system / admin pada awal proses buzzer berjalan.</span>
                      </li>
                    </ul>

                    <div className="pt-4 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setIsExamplesExpanded(!isExamplesExpanded)}
                        className="w-full inline-flex items-center justify-between px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80 text-xs font-bold transition-all cursor-pointer active:scale-98 shadow-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          <span>Contoh Pengisian Target Sosmed</span>
                        </span>
                        {isExamplesExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExamplesExpanded ? 'max-h-[5000px] opacity-100 mt-6 pt-4 border-t border-slate-800/60' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                      <div className="text-[11px] text-slate-450 leading-relaxed font-light space-y-4 pr-1">
                        <p className="mb-2">Berikut adalah beberapa contoh pengisian pada target pesanan. Pastikan untuk periksa kembali target pesanan Anda sebelum pesanan dibuat sehingga pesanan dapat diproses.</p>

                        <div className="space-y-3">
                          {/* Instagram */}
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2">Instagram</span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-slate-300 font-semibold">Followers, Story, Live Video, Profile Visits</p>
                                <p className="text-[10px] text-slate-450">Username akun Instagram tanpa tanda @</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">mustakinnur</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Likes, Views, Comments, Impressions, Saves</p>
                                <p className="text-[10px] text-slate-450">Link postingan akun Instagram</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.instagram.com/p/BxilTdssedewBn_p/</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Instagram TV</p>
                                <p className="text-[10px] text-slate-450">Link postingan Instagram TV</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.instagram.com/tv/CUOfgerkDLoBsqP/</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Instagram Reels</p>
                                <p className="text-[10px] text-slate-450">Link postingan Instagram Reels</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.instagram.com/reel/CUrqMtmfdfdloDI/</div>
                              </div>
                            </div>
                          </div>

                          {/* YouTube */}
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2">YouTube</span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-slate-300 font-semibold">Likes, Views, Shares, Komentar</p>
                                <p className="text-[10px] text-slate-450">Link video YouTube</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.youtube.com/watch?v=NdgFndfdnFQqII</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Live Stream</p>
                                <p className="text-[10px] text-slate-450">Link video live YouTube</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.youtube.com/watch?v=0AFdfM8thZU_g</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Subscribers</p>
                                <p className="text-[10px] text-slate-450">Link channel YouTube</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.youtube.com/channel/UCjPr9Tbddfdf2zs9TCEDn-eALw</div>
                              </div>
                            </div>
                          </div>

                          {/* Facebook */}
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2">Facebook</span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-slate-300 font-semibold">Page Likes, Page Followers</p>
                                <p className="text-[10px] text-slate-450">Link halaman atau fanspage Facebook</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.facebook.com/telkomsel/</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Post Likes, Post Video</p>
                                <p className="text-[10px] text-slate-450">Link postingan Facebook</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.facebook.com/admintakin/posts/2161457404010124</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Followers, Friends</p>
                                <p className="text-[10px] text-slate-450">Link profile Facebook</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.facebook.com/admintakin</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Group Members</p>
                                <p className="text-[10px] text-slate-450">Link group Facebook</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.facebook.com/groups/1675298779413438239/</div>
                              </div>
                            </div>
                          </div>

                          {/* Twitter */}
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2">Twitter / X</span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-slate-300 font-semibold">Followers</p>
                                <p className="text-[10px] text-slate-450">Username akun Twitter tanpa @</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">TelkomCare</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Retweet, Favorite</p>
                                <p className="text-[10px] text-slate-450">Link tweet atau postingan Twitter</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://twitter.com/TelkomCare/status/1238691324498513920</div>
                              </div>
                            </div>
                          </div>

                          {/* TikTok */}
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2">TikTok</span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-slate-300 font-semibold">Followers</p>
                                <p className="text-[10px] text-slate-450">Link profile TikTok atau username tanpa @</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://tiktok.com/@username/</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Likes / Views</p>
                                <p className="text-[10px] text-slate-450">Link video TikTok</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://vt.tiktok.com/xxxxx/</div>
                              </div>
                            </div>
                          </div>

                          {/* Shopee */}
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2">Shopee</span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-slate-300 font-semibold">Followers</p>
                                <p className="text-[10px] text-slate-450">Username akun Shopee</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">mustakin001</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Product Likes</p>
                                <p className="text-[10px] text-slate-450">Link produk Shopee</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://shopee.co.id/Stiker-Keyboard-Arab-Stiker-Keyboard-Arabic-i.8232793.668063715</div>
                              </div>
                            </div>
                          </div>

                          {/* Tokopedia */}
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2">Tokopedia</span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-slate-300 font-semibold">Followers</p>
                                <p className="text-[10px] text-slate-450">Username akun Tokopedia atau link profile</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.tokopedia.com/cleanandcleanshop</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Wishlist atau Favorite</p>
                                <p className="text-[10px] text-slate-450">Link produk Tokopedia</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://www.tokopedia.com/dbeofficial/dbe-dj80-foldable-dj-headphone-with-detachable-microphone-hitam</div>
                              </div>
                            </div>
                          </div>

                          {/* Telegram */}
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2">Telegram</span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-slate-300 font-semibold">Channnel Members / Group</p>
                                <p className="text-[10px] text-slate-450">Link Channel atau Group Telegram</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://t.me/medanpediaSMM</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Telegram Post Last Views / Post Views</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://t.me/medanpediaSMM/1195</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Telegram Reactions</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://t.me/medanpediaSMM/1195</div>
                              </div>
                              <div className="pt-2 border-t border-slate-900/60">
                                <p className="text-slate-300 font-semibold">Telegram Story</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://t.me/medanpediaSMM/s/2</div>
                              </div>
                            </div>
                          </div>

                          {/* WhatsApp */}
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2">WhatsApp</span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-slate-300 font-semibold">Channnel Members / Group</p>
                                <p className="text-[10px] text-slate-450">Link Channel atau Group WhatsApp</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://whatsapp.com/channel/XXXXXXXXXXXXXXXXX</div>
                              </div>
                            </div>
                          </div>

                          {/* Website Traffic */}
                          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60">
                            <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block mb-2">Website Traffic</span>
                            <div className="space-y-2">
                              <div>
                                <p className="text-slate-300 font-semibold">Website Traffic</p>
                                <p className="text-[10px] text-slate-450">Link Website</p>
                                <div className="mt-1 font-mono text-[10px] text-emerald-450 bg-slate-900/80 px-2 py-1 rounded border border-slate-800/60 select-all break-all">https://medanpedia.co.id</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="pt-2 text-[10px] text-slate-500 border-t border-slate-800/40">
                          Jika ada hal yang ingin ditanyakan, silakan hubungi kami via halaman kontak website ya.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Layanan Favorit Sidebar (Desktop Only) */}
                  {favorites.length > 0 && (() => {
                    const favoriteServices = services.filter(s => favorites.includes(s.id));
                    if (favoriteServices.length === 0) return null;
                    return (
                      <div className="hidden lg:block bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl">
                        <button
                          type="button"
                          onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
                          className="w-full flex items-center justify-between text-left cursor-pointer outline-none"
                        >
                          <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span>Layanan Favorit Anda</span>
                          </h3>
                          {isFavoritesExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isFavoritesExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                          <div className="flex flex-col gap-2 pt-4 border-t border-slate-800/60 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
                            {favoriteServices.map(fav => (
                              <button
                                key={fav.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(fav.category);
                                  setSelectedService(fav);
                                  showToast(`Layanan '${fav.name}' dipilih.`, 'info');
                                }}
                                className={`px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer w-full text-left leading-relaxed ${selectedService?.id === fav.id
                                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                                  : 'bg-slate-950 border-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-850 hover:border-slate-700'
                                  }`}
                              >
                                <span className="block w-full whitespace-normal break-words text-left leading-relaxed">{fav.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}


            {/* History Order List Tab */}
            {activeTab === 'history' && (
              <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl p-6 sm:p-8 backdrop-blur-md">

                {/* Table Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Cari berdasarkan ID, Layanan, atau URL Target..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full force-white-bg border border-slate-200 dark:border-slate-800 text-slate-200 dark:text-slate-100 focus:border-indigo-500 pl-11 pr-4 py-2.5 rounded-xl outline-none transition-colors text-sm shadow-sm"
                    />
                  </div>

                  {/* Action & Filter Selects */}
                  {/* Desktop layout */}
                  <div className="hidden sm:flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <button
                      onClick={handleCopySelectedOrderIds}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID Pesanan{selectedOrderIds.length > 0 ? ` (${selectedOrderIds.length})` : ''}</span>
                    </button>

                    {selectedOrderIds.length > 0 && orders.filter(o => selectedOrderIds.includes(o.id) && o.payment_status === 'unpaid').length > 0 && (
                      <button
                        onClick={handleBulkPayOrders}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-600/15 hover:shadow-emerald-600/25 active:scale-95 cursor-pointer whitespace-nowrap animate-in zoom-in-95 duration-150"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Bayar Terpilih ({orders.filter(o => selectedOrderIds.includes(o.id) && o.payment_status === 'unpaid').length})</span>
                      </button>
                    )}

                    <select
                      value={orderYearFilter}
                      onChange={(e) => setOrderYearFilter(e.target.value)}
                      className="force-white-bg border border-slate-200 dark:border-slate-850 text-slate-200 dark:text-slate-100 font-semibold px-4 py-2.5 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-500 shadow-sm"
                    >
                      <option value="all">Semua Tahun</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="force-white-bg border border-slate-200 dark:border-slate-855 text-slate-250 dark:text-slate-100 font-semibold px-4 py-2.5 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-500 shadow-sm"
                    >
                      <option value="all">Semua Status</option>
                      <option value="pending">PENDING</option>
                      <option value="processing">PROCESSING</option>
                      <option value="inprogress">INPROGRESS</option>
                      <option value="success">SUCCESS</option>
                      <option value="partial">PARTIAL</option>
                      <option value="failed">ERROR</option>
                    </select>
                  </div>

                  {/* Mobile layout */}
                  <div className="flex sm:hidden flex-col gap-3 w-full">
                    {/* primary actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleCopySelectedOrderIds}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 active:scale-95 cursor-pointer whitespace-nowrap"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy ID Pesanan{selectedOrderIds.length > 0 ? ` (${selectedOrderIds.length})` : ''}</span>
                      </button>

                      <select
                        value={orderYearFilter}
                        onChange={(e) => setOrderYearFilter(e.target.value)}
                        className="w-full force-white-bg border border-slate-200 dark:border-slate-800 text-slate-200 dark:text-slate-100 font-bold px-4 py-3 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-500 shadow-sm transition-all"
                      >
                        <option value="all">Semua Tahun</option>
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                      </select>
                    </div>

                    {/* Row 2: Pilih Semua & Semua Status */}
                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        const currentPageOrders = filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage);
                        const isPageAllSelected = currentPageOrders.length > 0 && currentPageOrders.every(o => selectedOrderIds.includes(o.id));
                        return (
                          <button
                            onClick={() => handleToggleSelectAll(currentPageOrders)}
                            className={`w-full flex items-center justify-center gap-2 border font-bold py-3 rounded-xl text-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap ${isPageAllSelected
                              ? 'bg-rose-50/80 dark:bg-rose-950/15 border-indigo-500/30 text-indigo-550 dark:text-indigo-500 dark:text-indigo-400'
                              : 'force-white-bg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={isPageAllSelected}
                              readOnly
                              className="w-3.5 h-3.5 rounded border-slate-350 dark:border-slate-800 text-rose-600 dark:text-rose-455 pointer-events-none"
                            />
                            <span>Pilih Semua</span>
                          </button>
                        );
                      })()}

                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full force-white-bg border border-slate-200 dark:border-slate-800 text-slate-200 dark:text-slate-100 font-bold px-4 py-3 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-500 shadow-sm transition-all"
                      >
                        <option value="all">Semua Status</option>
                        <option value="pending">PENDING</option>
                        <option value="processing">PROCESSING</option>
                        <option value="inprogress">INPROGRESS</option>
                        <option value="success">SUCCESS</option>
                        <option value="partial">PARTIAL</option>
                        <option value="failed">ERROR</option>
                      </select>
                    </div>

                    {selectedOrderIds.length > 0 && orders.filter(o => selectedOrderIds.includes(o.id) && o.payment_status === 'unpaid').length > 0 && (
                      <button
                        onClick={handleBulkPayOrders}
                        className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Bayar Terpilih ({orders.filter(o => selectedOrderIds.includes(o.id) && o.payment_status === 'unpaid').length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* List Table */}
                {filteredOrders.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-light flex flex-col items-center justify-center gap-2">
                    <History className="w-10 h-10 text-slate-600 mb-2" />
                    <p>Tidak ada riwayat pesanan ditemukan.</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop View */}
                    <div className="hidden md:block overflow-x-auto scrollbar-thin">
                      {(() => {
                        const currentPageOrders = filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage);
                        const isPageAllSelected = currentPageOrders.length > 0 && currentPageOrders.every(o => selectedOrderIds.includes(o.id));
                        return (
                          <table className="w-full min-w-[850px] text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-850 text-slate-450 text-xs font-semibold uppercase tracking-wider">
                                <th className="py-4 px-4 w-12 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isPageAllSelected}
                                    onChange={() => handleToggleSelectAll(currentPageOrders)}
                                    className="w-4 h-4 rounded border-slate-350 dark:border-slate-800 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                                  />
                                </th>
                                <th className="py-4 px-4">ID</th>
                                <th className="py-4 px-4">Layanan</th>
                                <th className="py-4 px-4">Target URL</th>
                                <th className="py-4 px-4 text-right">Jumlah</th>
                                <th className="py-4 px-4 text-right">Harga</th>
                                <th className="py-4 px-4 text-center">Status</th>
                                <th className="py-4 px-4 text-center whitespace-nowrap">Jumlah Awal</th>
                                <th className="py-4 px-4 text-center whitespace-nowrap">Jumlah Kurang</th>
                                <th className="py-4 px-4">Tanggal & Waktu</th>
                                <th className="py-4 px-4 text-left">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/40 text-xs">
                              {currentPageOrders.map(order => {
                                const isSelected = selectedOrderIds.includes(order.id);
                                return (
                                  <tr
                                    key={order.id}
                                    style={{ backgroundColor: isSelected ? 'var(--color-selected-row)' : undefined }}
                                    className={`transition-colors ${isSelected ? '' : 'hover:bg-slate-900/30'}`}
                                  >
                                    <td className="py-4 px-4 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleSelectOrder(order.id)}
                                        className="w-4 h-4 rounded border-slate-350 dark:border-slate-800 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                                      />
                                    </td>
                                    <td className="py-4 px-4">
                                      <div className="flex items-center border border-slate-200 dark:border-slate-800/80 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50 max-w-[130px] shadow-sm">
                                        <span className="px-2 py-1 font-mono text-[10px] text-slate-700 dark:text-slate-300 select-all truncate flex-1 font-semibold">
                                          {order.order_id ? String(order.order_id) : order.id.slice(0, 8)}
                                        </span>
                                        <button
                                          onClick={() => {
                                            const idToCopy = order.order_id ? String(order.order_id) : order.id;
                                            navigator.clipboard.writeText(idToCopy);
                                            showToast('ID Pesanan berhasil disalin!', 'success');
                                          }}
                                          className="bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/20 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 p-1 transition-all cursor-pointer flex items-center justify-center border-l border-slate-200 dark:border-slate-800 w-7 h-7 active:scale-95"
                                          title="Salin ID Pesanan"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 max-w-[280px]">
                                      <span className="font-bold text-slate-800 dark:text-slate-100 block leading-relaxed break-words">{order.service_name}</span>
                                      <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mt-1.5 ${getCategoryBadgeClass(order.category)}`}>
                                        {order.category}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 font-mono text-slate-450 max-w-xs truncate">
                                      <a href={order.target_url} target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-indigo-500 hover:underline">
                                        {order.target_url}
                                      </a>
                                    </td>
                                    <td className="py-4 px-4 text-right font-medium text-slate-700 dark:text-slate-300">{order.quantity.toLocaleString()}</td>
                                    <td className="py-4 px-4 text-right font-bold text-slate-800 dark:text-slate-100">{formatPrice(order.total_price)}</td>
                                    <td className="py-4 px-4 text-center">
                                      <div className="flex flex-col items-center gap-1.5 justify-center">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wide inline-block ${getOrderStatusBadgeClass(order.status)}`}>
                                          {order.status === 'failed' ? 'ERROR' : order.status}
                                        </span>
                                        {order.payment_status === 'unpaid' && (
                                          <button
                                            onClick={() => handlePayOrderWithBalance(order)}
                                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition-all shadow-sm shadow-indigo-600/25 active:scale-95 cursor-pointer whitespace-nowrap"
                                          >
                                            Bayar via Saldo
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-center font-mono text-slate-700 dark:text-slate-300 font-semibold">
                                      {order.start_count !== null && order.start_count !== undefined ? order.start_count.toLocaleString() : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-center font-mono text-slate-700 dark:text-slate-300 font-semibold">
                                      {order.remains !== null && order.remains !== undefined ? order.remains.toLocaleString() : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-slate-500 dark:text-slate-300 font-medium">
                                      {new Date(order.created_at).toLocaleString('id-ID', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                      })}
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                      <div className="flex items-center justify-start gap-1.5">
                                        <button
                                          onClick={() => setSelectedOrderDetail(order)}
                                          className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/10 shadow-sm"
                                          title="Detail Pesanan"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {order.payment_status === 'paid' && (
                                          <>
                                            <button
                                              onClick={() => setSelectedInvoiceDetail({
                                                type: 'order',
                                                id: order.order_id ? String(order.order_id) : order.id,
                                                amount: order.total_price,
                                                date: order.created_at,
                                                method: 'Saldo Akun (Wallet)',
                                                description: `Pembelian Layanan: ${order.service_name}`,
                                                status: order.status
                                              })}
                                              className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-600 dark:hover:bg-sky-600 text-sky-600 dark:text-sky-400 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center shrink-0 border border-sky-100/50 dark:border-sky-500/10 shadow-sm"
                                              title="Cetak Invoice"
                                            >
                                              <Printer className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => handleReorder(order)}
                                              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center shrink-0 border border-emerald-100/50 dark:border-emerald-500/10 shadow-sm"
                                              title="Pesan Lagi"
                                            >
                                              <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>

                    {/* Mobile View (Responsive Card List) */}
                    <div className="block md:hidden space-y-3.5">
                      {(() => {
                        const currentPageOrders = filteredOrders.slice((ordersPage - 1) * itemsPerPage, ordersPage * itemsPerPage);
                        return currentPageOrders.map(order => {
                          const isSelected = selectedOrderIds.includes(order.id);
                          const isExpanded = expandedOrderId === order.id;
                          const dateStr = new Date(order.created_at).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          }).replace('.', ':');

                          return (
                            <div key={order.id} className={`p-4 border border-slate-200 dark:border-slate-800/80 rounded-3xl transition-all duration-300 shadow-sm ${isSelected
                              ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border-indigo-500/40 shadow-indigo-500/10'
                              : 'bg-white dark:bg-slate-900/40 border-zinc-200 dark:border-slate-800 shadow-zinc-200/60 dark:shadow-none'
                              }`}>
                              {/* Header: Clickable to Expand */}
                              <div className="cursor-pointer select-none" onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}>
                                {/* Row 1: Badges & Status */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleToggleSelectOrder(order.id);
                                      }}
                                      className="w-4 h-4 rounded-lg border-slate-350 dark:border-slate-800 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 cursor-pointer shrink-0"
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const idToCopy = order.order_id ? String(order.order_id) : order.id;
                                        navigator.clipboard.writeText(idToCopy);
                                        showToast('ID Pesanan disalin!', 'success');
                                      }}
                                      className="font-mono text-slate-400 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 px-2 py-0.5 rounded-lg text-[9px] w-fit flex items-center gap-1 transition-colors shrink-0"
                                    >
                                      #{order.order_id ? String(order.order_id) : order.id.slice(0, 6)}
                                    </button>
                                    <span className="px-2 py-0.5 rounded-lg font-extrabold text-[8px] uppercase tracking-wider border bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-850 shrink-0">
                                      {order.category}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wide inline-block ${getOrderStatusBadgeClass(order.status)}`}>
                                      {order.status === 'failed' ? 'ERROR' : order.status}
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-slate-400" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-slate-400" />
                                    )}
                                  </div>
                                </div>

                                {/* Row 2: Service Name (Full width, wrapping naturally) */}
                                <div className="mt-2.5">
                                  <span className="font-bold text-slate-900 dark:text-slate-100 text-left block leading-relaxed text-xs">
                                    {order.service_name}
                                  </span>
                                </div>
                              </div>

                              {/* Body: Collapsible details */}
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between items-center gap-4">
                                      <span className="text-slate-400 font-medium shrink-0">Target URL:</span>
                                      <a
                                        href={order.target_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 hover:underline truncate max-w-[180px]"
                                      >
                                        {order.target_url.replace('https://', '').replace('www.', '')}
                                      </a>
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400 font-medium">Jumlah:</span>
                                      <span className="font-bold text-slate-900 dark:text-slate-100">{order.quantity.toLocaleString()}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400 font-medium">Harga:</span>
                                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{formatPrice(order.total_price)}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400 font-medium">Mulai Count:</span>
                                      <span className="font-mono text-slate-500 dark:text-slate-300">{order.start_count !== null && order.start_count !== undefined ? order.start_count.toLocaleString() : '-'}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400 font-medium">Waktu:</span>
                                      <span className="text-slate-900 dark:text-slate-200">{dateStr}</span>
                                    </div>
                                  </div>

                                  <div className="pt-1">
                                    <div className="flex gap-2 w-full">
                                      <button
                                        onClick={() => setSelectedOrderDetail(order)}
                                        className="flex-1 inline-flex items-center gap-1.5 justify-center py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-sm shadow-indigo-600/10"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>Detail</span>
                                      </button>

                                      {order.payment_status === 'paid' && (
                                        <>
                                          <button
                                            onClick={() => setSelectedInvoiceDetail({
                                              type: 'order',
                                              id: order.order_id ? String(order.order_id) : order.id,
                                              amount: order.total_price,
                                              date: order.created_at,
                                              method: 'Saldo Akun (Wallet)',
                                              description: `Pembelian Layanan: ${order.service_name}`,
                                              status: order.status
                                            })}
                                            className="flex-1 inline-flex items-center gap-1.5 justify-center py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-855 dark:text-slate-300 text-[10px] font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap border border-slate-200 dark:border-slate-700 shadow-sm"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                            <span>Invoice</span>
                                          </button>
                                          <button
                                            onClick={() => handleReorder(order)}
                                            className="flex-1 inline-flex items-center gap-1.5 justify-center py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-sm"
                                          >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span>Pesan Lagi</span>
                                          </button>
                                        </>
                                      )}

                                      {order.payment_status === 'unpaid' && (
                                        <button
                                          onClick={() => handlePayOrderWithBalance(order)}
                                          className="flex-1 px-2.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold whitespace-nowrap transition-transform active:scale-95 cursor-pointer shadow-sm"
                                        >
                                          Bayar via Saldo
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                    {filteredOrders.length > itemsPerPage && (
                      <div className="flex justify-between items-center gap-2 pt-5 border-t border-slate-850 mt-5">
                        <button
                          type="button"
                          disabled={ordersPage === 1}
                          onClick={() => setOrdersPage(prev => Math.max(1, prev - 1))}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-850 text-slate-350 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Sebelumnya
                        </button>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Menampilkan {((ordersPage - 1) * itemsPerPage) + 1} - {Math.min(ordersPage * itemsPerPage, filteredOrders.length)} dari {filteredOrders.length} orderan
                        </span>
                        <button
                          type="button"
                          disabled={ordersPage >= Math.ceil(filteredOrders.length / itemsPerPage)}
                          onClick={() => setOrdersPage(prev => prev + 1)}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-850 text-slate-350 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {/* Log Mutasi Saldo Tab */}
            {activeTab === 'transactions' && (() => {
              // Map order UUID to numeric order_id
              const orderIdMap = new Map<string, string>();
              orders.forEach(o => {
                if (o.id && o.order_id) {
                  orderIdMap.set(o.id, String(o.order_id));
                }
              });

              // Mutasi Saldo: type !== 'topup' OR (type === 'topup' && status === 'success')
              const baseMutationTxs = transactions.filter(tx => tx.type !== 'topup' || tx.status === 'success');

              // Sort newest first
              const sortedMutationTxs = [...baseMutationTxs].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );

              // Calculate running balance for each transaction using database delta directly
              const txBalancesMap = new Map<string, number>();
              let tempBalance = balance; // current profile balance

              for (const tx of sortedMutationTxs) {
                txBalancesMap.set(tx.id, tempBalance);

                // Subtract delta amount (since delta is positive for additions and negative for deductions)
                // This gives the balance BEFORE this transaction.
                tempBalance -= Number(tx.amount);
              }

              // Apply Search, Year, Month, and Type filters
              const mutationTxs = sortedMutationTxs.filter(tx => {
                // Year filter
                if (txYearFilter !== 'all') {
                  const year = new Date(tx.created_at).getFullYear().toString();
                  if (year !== txYearFilter) return false;
                }

                // Month filter
                if (txMonthFilter !== 'all') {
                  const month = (new Date(tx.created_at).getMonth() + 1).toString().padStart(2, '0');
                  if (month !== txMonthFilter) return false;
                }

                // Type filter (pesanan, deposit, refund)
                if (txTypeFilter !== 'all') {
                  if (txTypeFilter === 'order_payment' && tx.type !== 'order_payment') return false;
                  if (txTypeFilter === 'topup' && tx.type !== 'topup') return false;
                  if (txTypeFilter === 'refund' && tx.type !== 'refund') return false;
                }

                // Search query filter
                if (txSearchQuery.trim() !== '') {
                  const queryLower = txSearchQuery.toLowerCase().trim();
                  if (txSearchType === 'id') {
                    const queryClean = queryLower.replace('trx-', '');
                    const matchesId = tx.id.toLowerCase().includes(queryLower) ||
                      (tx.tx_id ? String(tx.tx_id).includes(queryClean) : false);
                    if (!matchesId) return false;
                  } else if (txSearchType === 'amount') {
                    if (!tx.amount.toString().includes(queryLower)) return false;
                  }
                }
                return true;
              });

              return (
                <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl p-3.5 sm:p-8 backdrop-blur-md animate-in fade-in duration-300">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    <span>Log Mutasi Saldo</span>
                  </h2>

                  {/* Redesigned Premium Filters Bar (Search, Type, Month, Year) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {/* Pencarian */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">Cari Mutasi</label>
                      <div className="flex gap-2">
                        <select
                          value={txSearchType}
                          onChange={(e) => setTxSearchType(e.target.value)}
                          className="bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 px-3 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold shrink-0"
                        >
                          <option value="id">ID Transaksi</option>
                          <option value="amount">Jumlah</option>
                        </select>
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="cari..."
                            value={txSearchQuery}
                            onChange={(e) => setTxSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 pl-4 pr-10 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                          />
                          <button
                            type="button"
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors cursor-pointer"
                            title="Cari"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filter Tipe Mutasi */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">Tipe Mutasi</label>
                      <select
                        value={txTypeFilter}
                        onChange={(e) => setTxTypeFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                      >
                        <option value="all">Semua Tipe</option>
                        <option value="order_payment">Pesanan</option>
                        <option value="topup">Deposit</option>
                        <option value="refund">Refund</option>
                      </select>
                    </div>

                    {/* Filter Bulan */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">Bulan</label>
                      <select
                        value={txMonthFilter}
                        onChange={(e) => setTxMonthFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                      >
                        <option value="all">Semua Bulan</option>
                        <option value="01">Januari</option>
                        <option value="02">Februari</option>
                        <option value="03">Maret</option>
                        <option value="04">April</option>
                        <option value="05">Mei</option>
                        <option value="06">Juni</option>
                        <option value="07">Juli</option>
                        <option value="08">Agustus</option>
                        <option value="09">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                      </select>
                    </div>

                    {/* Filter Tahun */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">Tahun</label>
                      <select
                        value={txYearFilter}
                        onChange={(e) => setTxYearFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                      >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="all">Semua Tahun</option>
                      </select>
                    </div>
                  </div>

                  {mutationTxs.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 font-light flex flex-col items-center justify-center gap-2">
                      <CreditCard className="w-10 h-10 text-slate-600 mb-2" />
                      <p>Tidak ada riwayat mutasi saldo dengan kriteria ini.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop View */}
                      <div className="hidden md:block space-y-3 font-inter max-w-4xl mx-auto">
                        {mutationTxs
                          .slice((transactionsPage - 1) * itemsPerPage, transactionsPage * itemsPerPage)
                          .map(tx => {
                            const dateStr = new Date(tx.created_at).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            });

                            const isAddition = tx.type === 'topup' || tx.type === 'refund';

                            let creditedAmount = Number(tx.amount);
                            let baseAmount = Number(tx.amount);

                            if (tx.type === 'topup') {
                              const bonusMin = parseInt(siteSettings.deposit_bonus_min) || 10000;
                              const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;
                              const hasBonus = baseAmount >= bonusMin && bonusPercent > 0;
                              const bonusAmount = hasBonus ? Math.round(baseAmount * bonusPercent / 100) : 0;
                              creditedAmount = baseAmount + bonusAmount;
                            }

                            const displayAmount = tx.type === 'topup' ? creditedAmount : baseAmount;

                            const balanceAfter = txBalancesMap.get(tx.id) || 0;
                            const balanceAfterStr = formatPrice(balanceAfter);

                            const getOrderDisplayId = (refId?: string) => {
                              if (refId && orderIdMap.has(refId)) {
                                return orderIdMap.get(refId)!;
                              }
                              return refId ? refId.slice(0, 8) : '';
                            };

                            const cleanDesc = (desc: string) => {
                              let res = desc;
                              const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
                              const matches = res.match(uuidRegex);
                              if (matches) {
                                for (const uuid of matches) {
                                  res = res.replace(uuid, getOrderDisplayId(uuid));
                                }
                              }
                              return res;
                            };

                            let formattedDescription = tx.description;
                            if (!formattedDescription) {
                              if (tx.type === 'order_payment') {
                                formattedDescription = `Membuat Pesanan. ID Pesanan: ${getOrderDisplayId(tx.reference_id)}.`;
                              } else if (tx.type === 'refund') {
                                formattedDescription = `Pengembalian dana (Refund). ID Pesanan: ${getOrderDisplayId(tx.reference_id)}.`;
                              } else if (tx.type === 'topup') {
                                formattedDescription = `Deposit saldo otomatis via ${formatPaymentMethod(tx.payment_method)}.`;
                              } else {
                                formattedDescription = `Mutasi saldo.`;
                              }
                            } else {
                              formattedDescription = cleanDesc(formattedDescription);
                            }

                            return (
                              <div key={tx.id} className="bg-white/60 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-850 hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-900/40 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all duration-200 shadow-sm">
                                <div className="flex items-center gap-4 min-w-0">
                                  {/* Activity Icon */}
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAddition
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/10'
                                    }`}>
                                    {isAddition ? (
                                      <ArrowUpRight className="w-4.5 h-4.5" />
                                    ) : (
                                      <ArrowDownRight className="w-4.5 h-4.5" />
                                    )}
                                  </div>

                                  {/* Keterangan & Tanggal */}
                                  <div className="min-w-0">
                                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 leading-snug">
                                      {formattedDescription}
                                    </span>
                                    <span className="block text-[10px] text-slate-400 dark:text-slate-300 font-medium mt-1">
                                      {dateStr}
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0 text-right pr-2">
                                  <span className={`block text-sm font-extrabold tracking-tight ${isAddition
                                    ? 'text-emerald-500'
                                    : 'text-rose-500'
                                    }`}>
                                    {isAddition ? '+' : '-'}{formatPrice(Math.abs(displayAmount))}
                                  </span>
                                  <span className="block text-[10px] text-slate-450 dark:text-slate-300 font-semibold mt-1">
                                    Saldo Akhir: {balanceAfterStr}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Mobile View */}
                      <div className="block md:hidden space-y-3 font-inter">
                        {mutationTxs
                          .slice((transactionsPage - 1) * itemsPerPage, transactionsPage * itemsPerPage)
                          .map(tx => {
                            const dateStr = new Date(tx.created_at).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });

                            const isAddition = tx.type === 'topup' || tx.type === 'refund';

                            let creditedAmount = Number(tx.amount);
                            let baseAmount = Number(tx.amount);

                            if (tx.type === 'topup') {
                              const bonusMin = parseInt(siteSettings.deposit_bonus_min) || 10000;
                              const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;
                              const hasBonus = baseAmount >= bonusMin && bonusPercent > 0;
                              const bonusAmount = hasBonus ? Math.round(baseAmount * bonusPercent / 100) : 0;
                              creditedAmount = baseAmount + bonusAmount;
                            }

                            const displayAmount = tx.type === 'topup' ? creditedAmount : baseAmount;

                            const balanceAfter = txBalancesMap.get(tx.id) || 0;
                            const balanceAfterStr = formatPrice(balanceAfter);

                            const getOrderDisplayId = (refId?: string) => {
                              if (refId && orderIdMap.has(refId)) {
                                return orderIdMap.get(refId)!;
                              }
                              return refId ? refId.slice(0, 8) : '';
                            };

                            const cleanDesc = (desc: string) => {
                              let res = desc;
                              const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
                              const matches = res.match(uuidRegex);
                              if (matches) {
                                for (const uuid of matches) {
                                  res = res.replace(uuid, getOrderDisplayId(uuid));
                                }
                              }
                              return res;
                            };

                            let formattedDescription = tx.description;
                            if (!formattedDescription) {
                              if (tx.type === 'order_payment') {
                                formattedDescription = `Membuat Pesanan. ID Pesanan: ${getOrderDisplayId(tx.reference_id)}.`;
                              } else if (tx.type === 'refund') {
                                formattedDescription = `Pengembalian dana. ID Pesanan: ${getOrderDisplayId(tx.reference_id)}.`;
                              } else if (tx.type === 'topup') {
                                formattedDescription = `Deposit via ${formatPaymentMethod(tx.payment_method)}.`;
                              } else {
                                formattedDescription = `Mutasi saldo.`;
                              }
                            } else {
                              formattedDescription = cleanDesc(formattedDescription);
                            }

                            return (
                              <div key={tx.id} className="bg-slate-900/40 border border-slate-855 p-4 rounded-2xl flex items-center justify-between gap-3 hover:border-slate-800 transition-all">
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Activity Icon */}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAddition
                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/10'
                                    }`}>
                                    {isAddition ? (
                                      <ArrowUpRight className="w-3.5 h-3.5" />
                                    ) : (
                                      <ArrowDownRight className="w-3.5 h-3.5" />
                                    )}
                                  </div>

                                  {/* Keterangan & Tanggal */}
                                  <div className="min-w-0">
                                    <span className="block text-[11px] font-bold text-slate-200 truncate leading-tight">
                                      {formattedDescription}
                                    </span>
                                    <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-1">
                                      {dateStr}
                                    </span>
                                  </div>
                                </div>

                                <div className="shrink-0 text-right">
                                  <span className={`block text-xs font-black ${isAddition
                                    ? 'text-emerald-500'
                                    : 'text-rose-500'
                                    }`}>
                                    {isAddition ? '+' : '-'}{formatPrice(Math.abs(displayAmount))}
                                  </span>
                                  <span className="block text-[9px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                    {balanceAfterStr}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {mutationTxs.length > itemsPerPage && (
                        <div className="flex justify-between items-center gap-2 pt-5 border-t border-slate-200 dark:border-slate-850 mt-5">
                          <button
                            type="button"
                            disabled={transactionsPage === 1}
                            onClick={() => setTransactionsPage(prev => Math.max(1, prev - 1))}
                            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:hover:border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Sebelumnya
                          </button>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Menampilkan {((transactionsPage - 1) * itemsPerPage) + 1} - {Math.min(transactionsPage * itemsPerPage, mutationTxs.length)} dari {mutationTxs.length} transaksi
                          </span>
                          <button
                            type="button"
                            disabled={transactionsPage >= Math.ceil(mutationTxs.length / itemsPerPage)}
                            onClick={() => setTransactionsPage(prev => prev + 1)}
                            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:hover:border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Selanjutnya
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* Riwayat Deposit Tab */}
            {activeTab === 'deposits' && (() => {
              // Deposit: type === 'topup'
              const baseDepositTxs = transactions.filter(tx => tx.type === 'topup');

              // Apply Search, Year, Method & Status filters
              const depositTxs = baseDepositTxs.filter(tx => {
                // Status filter
                if (txStatusFilter !== 'all') {
                  if (txStatusFilter === 'pending' && tx.status !== 'pending') return false;
                  if (txStatusFilter === 'failed' && tx.status !== 'failed') return false;
                  if (txStatusFilter === 'success' && tx.status !== 'success') return false;
                }

                // Year filter
                if (txYearFilter !== 'all') {
                  const year = new Date(tx.created_at).getFullYear().toString();
                  if (year !== txYearFilter) return false;
                }

                // Month filter
                if (depMonthFilter !== 'all') {
                  const month = (new Date(tx.created_at).getMonth() + 1).toString().padStart(2, '0');
                  if (month !== depMonthFilter) return false;
                }

                // Method filter
                if (txMethodFilter !== 'all') {
                  const methodLower = (tx.payment_method || '').toLowerCase();
                  if (txMethodFilter === 'qris') {
                    const isQris = methodLower.includes('qris') || methodLower === 'midtrans';
                    if (!isQris) return false;
                  } else if (txMethodFilter === 'bank_transfer') {
                    const isBank = methodLower.includes('bank_transfer') || methodLower.includes('va') || methodLower.includes('echannel');
                    if (!isBank) return false;
                  } else if (txMethodFilter === 'gopay') {
                    if (!methodLower.includes('gopay')) return false;
                  } else if (txMethodFilter === 'shopeepay') {
                    if (!methodLower.includes('shopeepay')) return false;
                  } else if (txMethodFilter === 'other') {
                    const isStandard = methodLower.includes('qris') || methodLower === 'midtrans' || methodLower.includes('bank_transfer') || methodLower.includes('va') || methodLower.includes('echannel') || methodLower.includes('gopay') || methodLower.includes('shopeepay');
                    if (isStandard) return false;
                  }
                }

                // Search query filter
                if (txSearchQuery.trim() !== '') {
                  const queryLower = txSearchQuery.toLowerCase().trim();
                  if (txSearchType === 'id') {
                    const queryClean = queryLower.replace('trx-', '');
                    const matchesId = tx.id.toLowerCase().includes(queryLower) ||
                      (tx.tx_id ? String(tx.tx_id).includes(queryClean) : false);
                    if (!matchesId) return false;
                  } else if (txSearchType === 'amount') {
                    if (!tx.amount.toString().includes(queryLower)) return false;
                  }
                }

                return true;
              });

              // Calculate topup stats
              const successfulDeposits = transactions.filter(tx => tx.type === 'topup' && tx.status === 'success');
              const failedDeposits = transactions.filter(tx => tx.type === 'topup' && tx.status === 'failed');

              const totalSuccessCount = successfulDeposits.length;
              const totalSuccessAmount = successfulDeposits.reduce((sum, tx) => sum + Number(tx.amount), 0);

              const totalFailedCount = failedDeposits.length;
              const totalFailedAmount = failedDeposits.reduce((sum, tx) => sum + Number(tx.amount), 0);

              return (
                <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl p-3.5 sm:p-8 backdrop-blur-md animate-in fade-in duration-300">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    <span>Riwayat Deposit & Top Up</span>
                  </h2>

                  {/* Stats Cards */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl flex items-center gap-4 transition-all hover:border-emerald-500/20">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">Total Deposit Berhasil</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{formatPrice(totalSuccessAmount)}</span>
                          <span className="text-[11px] font-medium text-slate-550 dark:text-slate-400">({totalSuccessCount} Transaksi)</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl flex items-center gap-4 transition-all hover:border-rose-500/20">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">Total Deposit Gagal</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{formatPrice(totalFailedAmount)}</span>
                          <span className="text-[11px] font-medium text-slate-550 dark:text-slate-400">({totalFailedCount} Transaksi)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Premium Filters Bar (Search, Month, Year, Method, Status) */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                    {/* Pencarian */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">Cari Deposit</label>
                      <div className="flex gap-2">
                        <select
                          value={txSearchType}
                          onChange={(e) => setTxSearchType(e.target.value)}
                          className="bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 px-3 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold shrink-0"
                        >
                          <option value="id">ID Transaksi</option>
                          <option value="amount">Jumlah</option>
                        </select>
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="cari..."
                            value={txSearchQuery}
                            onChange={(e) => setTxSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 pl-4 pr-10 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                          />
                          <button
                            type="button"
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors cursor-pointer"
                            title="Cari"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Filter Bulan */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">Bulan</label>
                      <select
                        value={depMonthFilter}
                        onChange={(e) => setDepMonthFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                      >
                        <option value="all">Semua Bulan</option>
                        <option value="01">Januari</option>
                        <option value="02">Februari</option>
                        <option value="03">Maret</option>
                        <option value="04">April</option>
                        <option value="05">Mei</option>
                        <option value="06">Juni</option>
                        <option value="07">Juli</option>
                        <option value="08">Agustus</option>
                        <option value="09">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                      </select>
                    </div>

                    {/* Filter Tahun */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">Tahun</label>
                      <select
                        value={txYearFilter}
                        onChange={(e) => setTxYearFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                      >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="all">Semua Tahun</option>
                      </select>
                    </div>

                    {/* Filter Metode */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">Metode Pembayaran</label>
                      <select
                        value={txMethodFilter}
                        onChange={(e) => setTxMethodFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                      >
                        <option value="all">Semua Metode</option>
                        <option value="qris">QRIS / E-Wallet</option>
                        <option value="bank_transfer">Bank Transfer (VA)</option>
                        <option value="gopay">GoPay</option>
                        <option value="shopeepay">ShopeePay</option>
                        <option value="other">Metode Lainnya</option>
                      </select>
                    </div>

                    {/* Filter Status */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-300 uppercase tracking-wider mb-2">Status Pembayaran</label>
                      <select
                        value={txStatusFilter}
                        onChange={(e) => setTxStatusFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-800 dark:text-slate-200 dark:bg-slate-900 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                      >
                        <option value="all">Semua Status</option>
                        <option value="pending">Belum Dibayar</option>
                        <option value="failed">Dibatalkan</option>
                        <option value="success">Sukses</option>
                      </select>
                    </div>
                  </div>

                  {depositTxs.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 font-light flex flex-col items-center justify-center gap-2">
                      <CreditCard className="w-10 h-10 text-slate-600 mb-2" />
                      <p>Tidak ada riwayat deposit dengan kriteria ini.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop View */}
                      <div className="hidden md:block overflow-x-auto scrollbar-thin font-inter">
                        <table className="w-full min-w-[750px] text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                              <th className="py-4 px-4">ID</th>
                              <th className="py-4 px-4">Tanggal</th>
                              <th className="py-4 px-4">Metode & Keterangan</th>
                              <th className="py-4 px-4">Saldo Didapat</th>
                              <th className="py-4 px-4">Total Bayar</th>
                              <th className="py-4 px-4 text-center">Status</th>
                              <th className="py-4 px-4">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850/40">
                            {depositTxs
                              .slice((transactionsPage - 1) * itemsPerPage, transactionsPage * itemsPerPage)
                              .map(tx => {
                                const dateStr = new Date(tx.created_at).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                });

                                const isAddition = tx.type === 'topup' || tx.type === 'refund';

                                let creditedAmount = Number(tx.amount);
                                let baseAmount = Number(tx.amount);

                                if (tx.type === 'topup') {
                                  const bonusMin = parseInt(siteSettings.deposit_bonus_min) || 10000;
                                  const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;
                                  const hasBonus = baseAmount >= bonusMin && bonusPercent > 0;
                                  const bonusAmount = hasBonus ? Math.round(baseAmount * bonusPercent / 100) : 0;
                                  creditedAmount = baseAmount + bonusAmount;
                                }

                                return (
                                  <tr key={tx.id} className="hover:bg-slate-900/30 transition-colors">
                                    <td className="py-4 px-4 font-mono text-slate-300">
                                      {tx.tx_id ? `TRX-${tx.tx_id}` : tx.id.slice(0, 6)}
                                    </td>
                                    <td className="py-4 px-4 text-slate-300">{dateStr}</td>
                                    <td className="py-4 px-4 font-medium text-slate-650 dark:text-slate-200">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold">{formatPaymentMethod(tx.payment_method)}</span>
                                        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-950/45 border border-slate-850 uppercase font-mono">
                                          {tx.type}
                                        </span>
                                      </div>
                                      {tx.description && (
                                        <div className="text-[10px] text-slate-400 mt-1 max-w-[320px] leading-relaxed font-light">{tx.description}</div>
                                      )}
                                    </td>
                                    <td className={`py-4 px-4 font-bold text-sm ${isAddition ? 'text-emerald-500' : 'text-red-455'}`}>
                                      {isAddition ? '+' : '-'}{formatPrice(Math.abs(creditedAmount))}
                                    </td>
                                    <td className="py-4 px-4 font-extrabold text-sm text-slate-200">
                                      {formatPrice(Math.abs(baseAmount))}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest inline-block ${tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/10' :
                                        tx.status === 'failed' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/10' :
                                          'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/10'
                                        }`}>
                                        {tx.status === 'success' ? 'Sukses' :
                                          tx.status === 'failed' ? 'Batal' :
                                            'Pending'}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                      <div className="flex gap-1.5">
                                        <button
                                          onClick={() => setSelectedTxDetail(tx)}
                                          className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/10 shadow-sm"
                                          title="Detail Transaksi"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {tx.status === 'success' && (
                                          <button
                                            onClick={() => setSelectedInvoiceDetail({
                                              type: 'topup',
                                              id: tx.tx_id ? `TRX-${tx.tx_id}` : tx.id,
                                              amount: tx.amount,
                                              date: tx.created_at,
                                              method: formatPaymentMethod(tx.payment_method),
                                              description: 'Top Up Saldo Akun',
                                              status: tx.status
                                            })}
                                            className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-600 text-sky-600 dark:text-sky-400 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center shrink-0 border border-sky-100/50 dark:border-sky-500/20 shadow-sm"
                                            title="Cetak Invoice"
                                          >
                                            <Printer className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile View */}
                      <div className="block md:hidden space-y-4 font-inter">
                        {depositTxs
                          .slice((transactionsPage - 1) * itemsPerPage, transactionsPage * itemsPerPage)
                          .map(tx => {
                            const dateStr = new Date(tx.created_at).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });

                            const isAddition = tx.type === 'topup' || tx.type === 'refund';

                            let creditedAmount = Number(tx.amount);
                            let baseAmount = Number(tx.amount);

                            if (tx.type === 'topup') {
                              const bonusMin = parseInt(siteSettings.deposit_bonus_min) || 10000;
                              const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;
                              const hasBonus = baseAmount >= bonusMin && bonusPercent > 0;
                              const bonusAmount = hasBonus ? Math.round(baseAmount * bonusPercent / 100) : 0;
                              creditedAmount = baseAmount + bonusAmount;
                            }

                            return (
                              <div key={tx.id} className="bg-white dark:bg-slate-900/40 border border-zinc-200 dark:border-slate-800 p-4 sm:p-5 rounded-[24px] space-y-4 shadow-md shadow-zinc-200/60 dark:shadow-none transition-all">
                                <div className="flex justify-between items-center text-[10px] gap-2">
                                  <span className="font-mono font-extrabold text-indigo-655 dark:text-indigo-400">
                                    {tx.tx_id ? `TRX-${tx.tx_id}` : tx.id.slice(0, 6)}
                                  </span>
                                  <span className="text-slate-400 dark:text-slate-300 font-medium">{dateStr}</span>
                                </div>

                                <div className="border-t border-b border-slate-200/60 dark:border-slate-900/40 py-3 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-extrabold text-slate-100 dark:text-slate-200">{formatPaymentMethod(tx.payment_method)}</span>
                                    <span className="text-[9px] font-bold bg-slate-855 border border-slate-200 dark:border-slate-800 text-slate-450 dark:text-slate-400 px-1.5 py-0.5 rounded-md uppercase tracking-widest font-mono">
                                      {tx.type}
                                    </span>
                                  </div>
                                  {tx.description && (
                                    <div className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed font-normal">{tx.description}</div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="text-[8px] text-slate-400 dark:text-slate-300 uppercase tracking-widest font-black block mb-0.5">Saldo Didapat</span>
                                    <span className="font-extrabold text-xs text-emerald-650 dark:text-emerald-400">
                                      +{formatPrice(Math.abs(creditedAmount))}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] text-slate-400 dark:text-slate-300 uppercase tracking-widest font-black block mb-0.5">Total Bayar</span>
                                    <span className="font-extrabold text-xs text-slate-105">
                                      {formatPrice(Math.abs(baseAmount))}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-slate-200/60 dark:border-slate-900/40 gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest inline-block ${tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-455 border border-emerald-500/10' :
                                    tx.status === 'failed' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border border-rose-500/10' :
                                      'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/10'
                                    }`}>
                                    {tx.status === 'success' ? 'Sukses' :
                                      tx.status === 'failed' ? 'Dibatalkan' :
                                        'Belum Dibayar'}
                                  </span>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setSelectedTxDetail(tx)}
                                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-md shadow-indigo-600/15"
                                    >
                                      <span>Detail</span>
                                    </button>
                                    {tx.status === 'success' && (
                                      <button
                                        onClick={() => setSelectedInvoiceDetail({
                                          type: 'topup',
                                          id: tx.tx_id ? `TRX-${tx.tx_id}` : tx.id,
                                          amount: tx.amount,
                                          date: tx.created_at,
                                          method: formatPaymentMethod(tx.payment_method),
                                          description: 'Top Up Saldo Akun',
                                          status: tx.status
                                        })}
                                        className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-850 text-slate-700 dark:text-slate-350 text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-sm border border-zinc-300 dark:border-slate-700"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Invoice</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {depositTxs.length > itemsPerPage && (
                        <div className="flex justify-between items-center gap-2 pt-5 border-t border-slate-200 dark:border-slate-850 mt-5">
                          <button
                            type="button"
                            disabled={transactionsPage === 1}
                            onClick={() => setTransactionsPage(prev => Math.max(1, prev - 1))}
                            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:hover:border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Sebelumnya
                          </button>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Menampilkan {((transactionsPage - 1) * itemsPerPage) + 1} - {Math.min(transactionsPage * itemsPerPage, depositTxs.length)} dari {depositTxs.length} transaksi
                          </span>
                          <button
                            type="button"
                            disabled={transactionsPage >= Math.ceil(depositTxs.length / itemsPerPage)}
                            onClick={() => setTransactionsPage(prev => prev + 1)}
                            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:hover:border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Selanjutnya
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {/* Support Ticket System Tab */}
            {activeTab === 'tickets' && (
              <div className="grid lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
                {/* Kirim Tiket Form */}
                {showCreateTicket && (
                  <div className="lg:col-span-4 bg-white dark:bg-slate-900/40 border border-zinc-200 dark:border-slate-800/80 p-6 rounded-3xl backdrop-blur-md relative">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-extrabold text-sm text-zinc-950 dark:text-slate-200 flex items-center gap-2">
                        <MessageSquare className="w-4.5 h-4.5 text-indigo-500" />
                        <span>Kirim Tiket</span>
                      </h3>
                      <button
                        onClick={() => setShowCreateTicket(false)}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleCreateTicket} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-zinc-500 dark:text-slate-400 uppercase tracking-wider mb-2">Subjek</label>
                        <select
                          value={ticketSubject}
                          onChange={(e) => {
                            setTicketSubject(e.target.value);
                            setTicketOrderId('');
                            setTicketRequestType('');
                            setTicketDepositId('');
                          }}
                          required
                          className="w-full force-white-bg border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                        >
                          <option value="">Pilih...</option>
                          <option value="Pesanan">Pesanan</option>
                          <option value="Deposit">Deposit</option>
                          <option value="Lain-lain">Lain-lain</option>
                        </select>
                      </div>

                      {ticketSubject === 'Pesanan' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-extrabold text-zinc-500 dark:text-slate-400 uppercase tracking-wider mb-2">order_id</label>
                            <input
                              type="text"
                              required
                              value={ticketOrderId}
                              onChange={(e) => setTicketOrderId(e.target.value)}
                              placeholder="Pisahkan dengan koma jika lebih dari satu."
                              className="w-full force-white-bg border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-zinc-500 dark:text-slate-400 uppercase tracking-wider mb-2">Permintaan</label>
                            <select
                              required
                              value={ticketRequestType}
                              onChange={(e) => setTicketRequestType(e.target.value)}
                              className="w-full force-white-bg border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                            >
                              <option value="">Pilih...</option>
                              <option value="Refill">Refill</option>
                              <option value="Batalkan">Batalkan</option>
                              <option value="Percepat">Percepat</option>
                              <option value="Lain-lain">Lain-lain</option>
                            </select>
                          </div>
                        </>
                      )}

                      {ticketSubject === 'Deposit' && (
                        <div>
                          <label className="block text-[10px] font-extrabold text-zinc-500 dark:text-slate-400 uppercase tracking-wider mb-2">ID Deposit</label>
                          <input
                            type="text"
                            required
                            value={ticketDepositId}
                            onChange={(e) => setTicketDepositId(e.target.value)}
                            placeholder="Masukkan ID Deposit"
                            className="w-full force-white-bg border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-extrabold text-zinc-500 dark:text-slate-400 uppercase tracking-wider mb-2">Pesan</label>
                        <textarea
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          required
                          rows={6}
                          placeholder="Tuliskan keluhan atau detail kendala Anda secara lengkap di sini..."
                          className="w-full force-white-bg border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-zinc-500 dark:text-slate-400 uppercase tracking-wider mb-2">Gambar <span className="text-zinc-400 dark:text-slate-400">*Tidak wajib</span></label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setTicketImage(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                            id="ticket-image-upload"
                          />
                          <label
                            htmlFor="ticket-image-upload"
                            className="bg-zinc-100 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 hover:border-indigo-500/50 text-zinc-650 dark:text-slate-355 px-4 py-2.5 rounded-2xl cursor-pointer text-xs font-semibold transition-all inline-block hover:text-indigo-600"
                          >
                            Choose File
                          </label>
                          <span className="text-[10px] text-zinc-400 dark:text-slate-500 truncate max-w-[150px]">
                            {ticketImage ? 'Gambar dipilih' : 'No file chosen'}
                          </span>
                          {ticketImage && (
                            <button
                              type="button"
                              onClick={() => setTicketImage('')}
                              className="text-[10px] text-red-500 hover:text-red-400 font-bold cursor-pointer ml-auto"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                        {ticketImage && (
                          <div className="mt-3 relative w-full h-24 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-200/20">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ticketImage} alt="Attachment Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={submittingTicket}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/15"
                      >
                        <span>Kirim</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* Tiket Saya List */}
                <div className={`${showCreateTicket ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white dark:bg-slate-900/40 border border-zinc-200 dark:border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md`}>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-950 dark:text-slate-200">
                      <MessageSquare className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                      <span>Tiket Saya</span>
                    </h2>
                    {!showCreateTicket && (
                      <button
                        onClick={() => {
                          setTicketSubject('');
                          setTicketMessage('');
                          setTicketImage('');
                          setShowCreateTicket(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Kirim Tiket</span>
                      </button>
                    )}
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="md:col-span-3 flex gap-2">
                      <div className="w-1/3">
                        <select
                          value={ticketSearchType}
                          onChange={(e) => setTicketSearchType(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-200 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                        >
                          <option value="id">ID</option>
                          <option value="subject">Subjek</option>
                        </select>
                      </div>
                      <div className="w-2/3 relative">
                        <input
                          type="text"
                          placeholder="Cari..."
                          value={ticketSearchQuery}
                          onChange={(e) => setTicketSearchQuery(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-200 dark:text-slate-200 pl-4 pr-10 py-3 rounded-2xl outline-none text-xs"
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-350">
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block overflow-x-auto rounded-2xl border border-zinc-150 dark:border-slate-850">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-slate-900 border-b border-zinc-150 dark:border-slate-850 text-zinc-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                          <th className="py-4 px-6">ID</th>
                          <th className="py-4 px-6">Subjek</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6">Pembaruan</th>
                          <th className="py-4 px-6 text-left">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150 dark:divide-slate-850">
                        {(() => {
                          const filteredTickets = tickets.filter(ticket => {
                            const q = ticketSearchQuery.toLowerCase().trim();
                            if (!q) return true;
                            if (ticketSearchType === 'id') {
                              return String(ticket.id).includes(q);
                            } else {
                              return String(ticket.subject).toLowerCase().includes(q);
                            }
                          });

                          if (filteredTickets.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-zinc-400 dark:text-slate-500 text-xs">
                                  Tidak ada tiket bantuan ditemukan.
                                </td>
                              </tr>
                            );
                          }

                          return filteredTickets.map(ticket => (
                            <tr
                              key={ticket.id}
                              className="hover:bg-zinc-50/50 dark:hover:bg-slate-900/20 transition-all text-xs text-zinc-800 dark:text-slate-300 animate-in fade-in duration-200"
                            >
                              <td className="py-4 px-6 font-mono font-bold text-zinc-550 dark:text-slate-450">
                                {ticket.id}
                              </td>
                              <td className="py-4 px-6">
                                <button
                                  onClick={() => fetchTicketDetails(ticket.id)}
                                  className="font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 hover:underline text-left cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>{ticket.subject}</span>
                                  {ticket.status === 'Pending' && (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-widest">NEW</span>
                                  )}
                                </button>
                                {(ticket.order_id || ticket.deposit_id) && (
                                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                                    {ticket.order_id && `ID Pesanan: #${ticket.order_id}`}
                                    {ticket.deposit_id && `ID Deposit: #${ticket.deposit_id}`}
                                    {ticket.request_type && ` (${ticket.request_type})`}
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider ${getTicketStatusBadgeClass(ticket.status)}`}>
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-medium text-zinc-400 dark:text-slate-500">
                                {new Date(ticket.updated_at).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </td>
                              <td className="py-4 px-6 text-left">
                                <button
                                  onClick={() => fetchTicketDetails(ticket.id)}
                                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/10 shadow-sm"
                                  title={ticket.status === 'Closed' ? 'Lihat Tiket' : 'Balas Tiket'}
                                >
                                  {ticket.status === 'Closed' ? (
                                    <Eye className="w-3.5 h-3.5" />
                                  ) : (
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View (Responsive Card List) */}
                  <div className="block md:hidden space-y-4">
                    {(() => {
                      const filteredTickets = tickets.filter(ticket => {
                        const q = ticketSearchQuery.toLowerCase().trim();
                        if (!q) return true;
                        if (ticketSearchType === 'id') {
                          return String(ticket.id).includes(q);
                        } else {
                          return String(ticket.subject).toLowerCase().includes(q);
                        }
                      });

                      if (filteredTickets.length === 0) {
                        return (
                          <div className="py-12 text-center text-zinc-400 dark:text-slate-500 text-xs bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-zinc-150 dark:border-slate-850">
                            Tidak ada tiket bantuan ditemukan.
                          </div>
                        );
                      }

                      return filteredTickets.map(ticket => {
                        const isExpanded = expandedTicketId === ticket.id;
                        const dateStr = new Date(ticket.updated_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div
                            key={ticket.id}
                            className="p-5 rounded-[24px] border border-zinc-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 shadow-md shadow-zinc-200/60 dark:shadow-none transition-all"
                          >
                            {/* Header: Clickable to expand */}
                            <div className="flex justify-between items-start text-xs cursor-pointer select-none" onClick={() => setExpandedTicketId(isExpanded ? null : ticket.id)}>
                              <div className="flex items-start gap-2 min-w-0 flex-1 flex-wrap">
                                <span className="px-2.5 py-1 font-mono text-[9px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/60 rounded-xl font-bold shrink-0">
                                  #{ticket.id}
                                </span>
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-left whitespace-normal break-words flex-1">
                                  {ticket.subject}
                                  {ticket.order_id && <span className="font-mono text-[9.5px] text-indigo-500 dark:text-indigo-400 font-bold ml-1.5 break-words">({ticket.order_id})</span>}
                                  {ticket.deposit_id && <span className="font-mono text-[9.5px] text-indigo-500 dark:text-indigo-400 font-bold ml-1.5 break-words">(#{ticket.deposit_id})</span>}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2 mt-0.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${getTicketStatusBadgeClass(ticket.status)}`}>
                                  {ticket.status}
                                </span>
                                {ticket.status === 'Pending' && (
                                  <span className="px-1.5 py-0.5 rounded-lg text-[8px] font-black bg-rose-500/10 text-indigo-500 border border-rose-500/20 uppercase tracking-widest">NEW</span>
                                )}
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>

                            {/* Collapsible content body */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-850 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1.5 text-xs">
                                  {ticket.order_id && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400 font-medium">ID Pesanan:</span>
                                      <span className="font-mono font-bold text-indigo-500 dark:text-indigo-400">#{ticket.order_id}</span>
                                    </div>
                                  )}
                                  {ticket.request_type && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400 font-medium">Tipe Permintaan:</span>
                                      <span className="font-semibold text-slate-200">{ticket.request_type}</span>
                                    </div>
                                  )}
                                  {ticket.deposit_id && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400 font-medium">ID Deposit:</span>
                                      <span className="font-mono font-bold text-indigo-500 dark:text-indigo-400">#{ticket.deposit_id}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-medium">Pembaruan Terakhir:</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-200">{dateStr}</span>
                                  </div>
                                </div>

                                <div className="pt-1 flex justify-end">
                                  <button
                                    onClick={() => fetchTicketDetails(ticket.id)}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-600/15"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Buka Tiket</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-slate-900 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-5 blur-[80px] bg-indigo-500 rounded-full"></div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                        <List className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        <span>Daftar Layanan Buzziy</span>
                      </h2>
                      <p className="text-xs text-slate-400 font-light mt-1">
                        Temukan berbagai layanan optimasi media sosial terbaik dengan harga murah.
                      </p>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 text-xs font-black tracking-wide w-fit">
                      Total: {services.length} Layanan
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="relative z-30 bg-slate-900 border border-slate-800/80 p-5 rounded-3xl backdrop-blur-md shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1">
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Cari Layanan</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={servicesSearchQuery}
                          onChange={(e) => {
                            setServicesSearchQuery(e.target.value);
                            setServicesPage(1);
                          }}
                          placeholder="Cari berdasarkan nama atau ID layanan..."
                          className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-950/40 border border-slate-805 dark:border-slate-850 focus:border-indigo-500 focus:outline-none text-xs text-slate-100 placeholder-slate-500 transition-all font-medium"
                        />
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        {servicesSearchQuery && (
                          <button
                            onClick={() => { setServicesSearchQuery(''); setServicesPage(1); }}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Categories Filter */}
                  <div className="relative">
                    <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Filter Kategori</label>
                    <button
                      type="button"
                      onClick={() => setIsServicesCategoryDropdownOpen(!isServicesCategoryDropdownOpen)}
                      className="w-full md:w-72 flex items-center justify-between bg-slate-950/40 border border-slate-805 dark:border-slate-850 focus:border-indigo-500 text-slate-100 px-4 py-3 rounded-xl outline-none transition-all text-xs text-left cursor-pointer font-semibold"
                    >
                      <span className="truncate">
                        {servicesCategoryFilter === 'all' ? 'Semua Kategori' : servicesCategoryFilter}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isServicesCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isServicesCategoryDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsServicesCategoryDropdownOpen(false)}
                        />
                        <div className="absolute left-0 mt-1.5 w-full md:w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150 max-h-[300px] flex flex-col">
                          <div className="overflow-y-auto scrollbar-thin py-1 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                setServicesCategoryFilter('all');
                                setServicesPage(1);
                                setIsServicesCategoryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs hover:bg-indigo-600/10 hover:text-indigo-500 dark:text-indigo-400 transition-colors ${servicesCategoryFilter === 'all'
                                ? 'bg-indigo-600/20 text-indigo-450 font-semibold'
                                : 'text-slate-300 dark:text-slate-300'
                                }`}
                            >
                              Semua Kategori
                            </button>
                            {categories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setServicesCategoryFilter(cat);
                                  setServicesPage(1);
                                  setIsServicesCategoryDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-indigo-600/10 hover:text-indigo-500 dark:text-indigo-400 transition-colors ${servicesCategoryFilter === cat
                                  ? 'bg-indigo-600/20 text-indigo-450 font-semibold'
                                  : 'text-slate-350 dark:text-slate-300'
                                  }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Table View (Desktop) & Card View (Mobile) */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-sm overflow-hidden">
                  {(() => {
                    const filtered = services.filter(s => {
                      const matchesCategory = servicesCategoryFilter === 'all' || s.category === servicesCategoryFilter;
                      const srvId = s.provider_service_id || s.id.split('-')[0];
                      const matchesSearch = s.name.toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
                        srvId.toLowerCase().includes(servicesSearchQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    });

                    const totalItems = filtered.length;
                    const totalPages = Math.ceil(totalItems / servicesPerPage);
                    const currentPage = Math.min(servicesPage, totalPages || 1);
                    const startIndex = (currentPage - 1) * servicesPerPage;
                    const paginated = filtered.slice(startIndex, startIndex + servicesPerPage);

                    if (paginated.length === 0) {
                      return (
                        <div className="py-20 text-center text-slate-500 font-medium">
                          Tidak ada layanan ditemukan untuk filter ini.
                        </div>
                      );
                    }

                    return (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-850 bg-slate-950/20">
                                <th className="py-4 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-16">ID</th>
                                <th className="py-4 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nama Layanan</th>
                                <th className="py-4 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-40">Kategori</th>
                                <th className="py-4 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right w-32">Harga / 1K</th>
                                <th className="py-4 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-28">Min</th>
                                <th className="py-4 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-28">Max</th>
                                <th className="py-4 px-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-24">Aksi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginated.map((srv) => {
                                const displayId = getNumericId(srv);
                                return (
                                  <tr key={srv.id} className="border-b border-slate-850 hover:bg-slate-950/20 transition-colors group">
                                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-500 dark:text-indigo-400 text-xs">#{displayId}</td>
                                    <td className="py-3.5 px-4 font-semibold text-slate-200 text-xs">
                                      <div className="flex flex-col gap-0.5">
                                        <span>{srv.name}</span>
                                        {srv.is_recommended && (
                                          <span className="w-fit px-1.5 py-0.2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-500 text-[8.5px] font-black rounded-md tracking-wider uppercase">★ Recommended</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3.5 px-4">
                                      <span className="px-2 py-0.5 rounded-full bg-slate-950/40 border border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                        {srv.category}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-500 dark:text-emerald-400 text-xs">{formatPrice(srv.price_per_k)}</td>
                                    <td className="py-3.5 px-4 text-center font-bold text-slate-300 dark:text-slate-300 text-xs">{srv.min_order.toLocaleString()}</td>
                                    <td className="py-3.5 px-4 text-center font-bold text-slate-300 dark:text-slate-300 text-xs">{srv.max_order.toLocaleString()}</td>
                                    <td className="py-3.5 px-4 text-center">
                                      <button
                                        onClick={() => handleQuickOrder(srv)}
                                        className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white transition-all duration-200 active:scale-90 cursor-pointer flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-500/10 shadow-sm"
                                        title="Pesan Layanan"
                                      >
                                        <ShoppingBag className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-slate-850">
                          {paginated.map((srv) => {
                            const displayId = getNumericId(srv);
                            return (
                              <div key={srv.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="font-mono font-bold text-indigo-500 dark:text-indigo-400 text-xs">#{displayId}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-slate-950/40 border border-slate-800 text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                                    {srv.category}
                                  </span>
                                </div>
                                <div className="font-semibold text-slate-200 text-xs">
                                  {srv.name}
                                  {srv.is_recommended && (
                                    <span className="ml-1.5 inline-block px-1 py-0.2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black rounded-md tracking-wider uppercase">★ Rec</span>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-1.5 text-[10.5px]">
                                  <div>
                                    <span className="text-slate-500 block">Harga/1K</span>
                                    <strong className="text-emerald-500 dark:text-emerald-400 font-extrabold">{formatPrice(srv.price_per_k)}</strong>
                                  </div>
                                  <div className="text-center">
                                    <span className="text-slate-500 block">Min</span>
                                    <strong className="text-slate-300 dark:text-slate-300 font-bold">{srv.min_order.toLocaleString()}</strong>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-slate-500 block">Max</span>
                                    <strong className="text-slate-300 dark:text-slate-300 font-bold">{srv.max_order.toLocaleString()}</strong>
                                  </div>
                                </div>
                                <div className="pt-2 flex">
                                  <button
                                    onClick={() => handleQuickOrder(srv)}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-indigo-50/50 hover:to-indigo-100/50 dark:from-slate-800 dark:to-slate-850 dark:hover:from-slate-750 dark:hover:to-slate-800 text-slate-855 dark:text-slate-200 border border-slate-250 dark:border-slate-700/50 font-black px-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 text-[10.5px] cursor-pointer"
                                  >
                                    Pesan Layanan
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-850 bg-slate-950/10">
                            <span className="text-slate-500 text-xs font-semibold">
                              Menampilkan {startIndex + 1} - {Math.min(startIndex + servicesPerPage, totalItems)} dari {totalItems} layanan
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setServicesPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-9 px-3.5 rounded-xl border border-slate-850 dark:border-slate-800 bg-slate-950/20 text-slate-400 dark:text-slate-300 text-xs font-black hover:bg-slate-850 hover:text-slate-200 transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                              >
                                Sebelum
                              </button>

                              {/* Pages list */}
                              {(() => {
                                const pages = [];
                                const maxVisible = 3;
                                let startPage = Math.max(1, currentPage - 1);
                                let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                                if (endPage - startPage < maxVisible - 1) {
                                  startPage = Math.max(1, endPage - maxVisible + 1);
                                }

                                for (let p = startPage; p <= endPage; p++) {
                                  pages.push(
                                    <button
                                      key={p}
                                      onClick={() => setServicesPage(p)}
                                      className={`w-9 h-9 rounded-xl border text-xs font-black transition-all cursor-pointer ${currentPage === p
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                                        : 'border-slate-855 dark:border-slate-800 bg-slate-950/20 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                                        }`}
                                    >
                                      {p}
                                    </button>
                                  );
                                }
                                return pages;
                              })()}

                              <button
                                onClick={() => setServicesPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="h-9 px-3.5 rounded-xl border border-slate-850 dark:border-slate-800 bg-slate-950/20 text-slate-400 dark:text-slate-300 text-xs font-black hover:bg-slate-850 hover:text-slate-200 transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                              >
                                Lanjut
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ===================== LEADERBOARD TAB ===================== */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Period Toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setLeaderboardPeriod('current'); fetchLeaderboard('current'); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${leaderboardPeriod === 'current'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-850 dark:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                  >
                    Bulan Ini
                  </button>
                  <button
                    onClick={() => { setLeaderboardPeriod('last'); fetchLeaderboard('last'); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${leaderboardPeriod === 'last'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                      : 'bg-slate-850 dark:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                  >
                    Lihat Bulan Lalu
                  </button>
                </div>

                {/* Sub-Tab Navigation */}
                <div className="flex gap-2 flex-wrap">
                  {([
                    { id: 'orders' as const, label: 'Top 10 Pemesanan', icon: '🛒' },
                    { id: 'deposits' as const, label: 'Top 10 Deposit', icon: '💰' },
                    { id: 'services' as const, label: 'Top 10 Layanan', icon: '🔥' },
                  ]).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setLeaderboardSubTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${leaderboardSubTab === tab.id
                        ? 'bg-indigo-500/15 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/30'
                        : 'bg-slate-850 dark:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                        }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Loading State */}
                {leaderboardLoading && (
                  <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
                    <span className="ml-3 text-sm text-slate-400 font-medium">Memuat data peringkat...</span>
                  </div>
                )}

                {/* No data */}
                {!leaderboardLoading && !leaderboardData && (
                  <div className="text-center py-20">
                    <Crown className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Klik salah satu tab untuk memuat data peringkat.</p>
                  </div>
                )}

                {/* ===== TOP ORDERS ===== */}
                {!leaderboardLoading && leaderboardData && leaderboardSubTab === 'orders' && (() => {
                  const items = leaderboardData.topOrders || [];
                  const maxVal = items[0]?.totalSpent || 1;
                  return (
                    <div className="bg-slate-850 dark:bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <h3 className="announcement-content-text text-sm font-extrabold">
                          Top Pemesanan {leaderboardPeriod === 'current' ? 'Bulan Ini' : 'Bulan Lalu'}
                        </h3>
                      </div>
                      {items.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs">Belum ada data pemesanan.</div>
                      ) : (
                        <div className="divide-y divide-slate-800/50">
                          {items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/30 dark:hover:bg-slate-950/30 transition-all group" style={{ animationDelay: `${idx * 50}ms` }}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30' :
                                idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-400/20' :
                                  idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-700/20' :
                                    'bg-slate-800 dark:bg-slate-850 text-slate-400 border border-slate-700'
                                }`}>
                                #{idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="announcement-content-text text-sm font-bold block truncate">{item.name}</span>
                                <div className="mt-1 h-1.5 bg-slate-800 dark:bg-slate-950 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${Math.max((item.totalSpent / maxVal) * 100, 5)}%` }} />
                                </div>
                              </div>
                              <span className="announcement-content-text text-sm font-extrabold tabular-nums shrink-0">
                                Rp {Number(item.totalSpent).toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ===== TOP DEPOSITS ===== */}
                {!leaderboardLoading && leaderboardData && leaderboardSubTab === 'deposits' && (() => {
                  const items = leaderboardData.topDeposits || [];
                  const maxVal = items[0]?.totalDeposit || 1;
                  return (
                    <div className="bg-slate-850 dark:bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <h3 className="announcement-content-text text-sm font-extrabold">
                          Top Deposit {leaderboardPeriod === 'current' ? 'Bulan Ini' : 'Bulan Lalu'}
                        </h3>
                      </div>
                      {items.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs">Belum ada data deposit.</div>
                      ) : (
                        <div className="divide-y divide-slate-800/50">
                          {items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-800/30 dark:hover:bg-slate-950/30 transition-all group">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/30' :
                                idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-400/20' :
                                  idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-700/20' :
                                    'bg-slate-800 dark:bg-slate-850 text-slate-400 border border-slate-700'
                                }`}>
                                #{idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="announcement-content-text text-sm font-bold block truncate">{item.name}</span>
                                <div className="mt-1 h-1.5 bg-slate-800 dark:bg-slate-950 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500" style={{ width: `${Math.max((item.totalDeposit / maxVal) * 100, 5)}%` }} />
                                </div>
                              </div>
                              <span className="announcement-content-text text-sm font-extrabold tabular-nums shrink-0">
                                Rp {Number(item.totalDeposit).toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ===== TOP SERVICES (Side-by-Side) ===== */}
                {!leaderboardLoading && leaderboardData && leaderboardSubTab === 'services' && (() => {
                  const countItems = leaderboardData.topServicesCount || [];
                  const revenueItems = leaderboardData.topServicesRevenue || [];
                  const maxCount = countItems[0]?.totalOrders || 1;
                  const maxRevenue = revenueItems[0]?.totalRevenue || 1;
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Layanan Terlaris (by count) */}
                      <div className="bg-slate-850 dark:bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-orange-500" />
                          <h3 className="announcement-content-text text-sm font-extrabold">
                            Layanan Terlaris {leaderboardPeriod === 'current' ? 'Bulan Ini' : 'Bulan Lalu'}
                          </h3>
                        </div>
                        {countItems.length === 0 ? (
                          <div className="py-12 text-center text-slate-500 text-xs">Belum ada data layanan.</div>
                        ) : (
                          <div className="divide-y divide-slate-800/50">
                            {countItems.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 dark:hover:bg-slate-950/30 transition-all">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                                  idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                                    idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                                      'bg-slate-800 dark:bg-slate-850 text-slate-400 border border-slate-700'
                                  }`}>
                                  #{idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="announcement-content-text text-[11px] font-bold block leading-tight" title={item.name}>{item.name}</span>
                                  <div className="mt-1 h-1 bg-slate-800 dark:bg-slate-950 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500" style={{ width: `${Math.max((item.totalOrders / maxCount) * 100, 5)}%` }} />
                                  </div>
                                </div>
                                <span className="text-slate-400 text-[11px] font-bold tabular-nums shrink-0">
                                  {item.totalOrders.toLocaleString('id-ID')}x dipesan
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Penjualan Tertinggi (by revenue) */}
                      <div className="bg-slate-850 dark:bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-violet-500" />
                          <h3 className="announcement-content-text text-sm font-extrabold">
                            Penjualan Tertinggi {leaderboardPeriod === 'current' ? 'Bulan Ini' : 'Bulan Lalu'}
                          </h3>
                        </div>
                        {revenueItems.length === 0 ? (
                          <div className="py-12 text-center text-slate-500 text-xs">Belum ada data penjualan.</div>
                        ) : (
                          <div className="divide-y divide-slate-800/50">
                            {revenueItems.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 dark:hover:bg-slate-950/30 transition-all">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' :
                                  idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' :
                                    idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                                      'bg-slate-800 dark:bg-slate-850 text-slate-400 border border-slate-700'
                                  }`}>
                                  #{idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="announcement-content-text text-[11px] font-bold block leading-tight" title={item.name}>{item.name}</span>
                                  <div className="mt-1 h-1 bg-slate-800 dark:bg-slate-950 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500" style={{ width: `${Math.max((item.totalRevenue / maxRevenue) * 100, 5)}%` }} />
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="announcement-content-text text-[11px] font-extrabold tabular-nums block">
                                    Rp {Number(item.totalRevenue).toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-slate-500 text-[9px] font-medium">
                                    ({item.totalOrders.toLocaleString('id-ID')}x dipesan)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Bottom Navigation Bar - Mobile only */}
      {siteSettings.show_mobile_nav !== 'false' && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 px-1 print:hidden">
          <nav className="bg-slate-900/80 dark:bg-slate-950/80 border border-slate-205 dark:border-slate-850 backdrop-blur-xl px-2.5 py-2.5 rounded-2xl flex justify-around items-center shadow-xl shadow-indigo-500/5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'order', label: 'Pesan', icon: ShoppingBag },
              { id: 'services', label: 'Layanan', icon: List },
              { id: 'history', label: 'Pesanan', icon: History, action: () => fetchOrders(user?.id) },
              { id: 'deposits', label: 'Deposit', icon: Wallet, action: () => fetchProfileAndTransactions(user?.id) },
              { id: 'tickets', label: 'Tiket', icon: MessageSquare, action: () => fetchTickets() },
              { id: 'leaderboard', label: 'Peringkat', icon: Crown, action: () => fetchLeaderboard(leaderboardPeriod) },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'order') {
                      clearOrderForm();
                    }
                    setActiveTab(item.id as any);
                    if (item.action && user?.id) item.action();
                  }}
                  className={`flex flex-col items-center gap-0.5 py-0.5 px-0.5 sm:px-3 rounded-xl transition-all cursor-pointer ${isActive
                    ? 'text-indigo-600 dark:text-indigo-500 dark:text-indigo-400 font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  <span className="text-[8px] sm:text-[9px] tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Top Up Modal */}
      {showTopupModal && (() => {
        const bonusMinLimit = parseInt(siteSettings.deposit_bonus_min) || 10000;
        const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;

        const calculatedReceivedBalance = topupAmount >= bonusMinLimit
          ? Math.round(topupAmount + (topupAmount * bonusPercent / 100))
          : topupAmount;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
            <div className="w-full max-w-[520px] bg-slate-900 border border-slate-800 p-6 sm:p-10 rounded-[24px] sm:rounded-[32px] shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setShowTopupModal(false);
                  setTopupAmount(0);
                }}
                className="absolute top-6 right-6 text-slate-500 hover:text-slate-355 transition-colors p-2 hover:bg-slate-850 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-extrabold mb-2 flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
                <Wallet className="w-6 h-6 text-indigo-500 dark:text-indigo-500 dark:text-indigo-400" />
                <span>Top Up Saldo Akun</span>
              </h3>
              <div className="flex items-center gap-1.5 mb-8 text-sm text-slate-400 font-light">
                <span>Isi ulang saldo, minimal topup Rp 10.000</span>
                <button
                  type="button"
                  onClick={() => setShowDepositGuide(!showDepositGuide)}
                  className="p-1 rounded-md bg-white hover:bg-indigo-50 hover:text-indigo-500 dark:text-indigo-400 transition-all cursor-pointer text-slate-500 shrink-0 border border-slate-200 shadow-sm"
                  title="Lihat Panduan & Ketentuan"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>

              {/* Deposit Guide / Terms Dropdown Card */}
              {showDepositGuide && (
                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-350 space-y-4 mb-6 animate-fade-in">
                  <div>
                    <h4 className="font-extrabold text-[11px] uppercase text-indigo-500 dark:text-indigo-400 tracking-wider mb-1">Langkah Pembayaran:</h4>
                    <ol className="list-decimal list-inside space-y-1 pl-0 text-slate-450 font-light">
                      <li>Masukkan nominal deposit yang Anda inginkan.</li>
                      <li>Klik tombol <strong className="text-slate-300 font-semibold">"Bayar Sekarang"</strong>.</li>
                      <li>Pilih metode pembayaran (QRIS, e-wallet, atau Bank Transfer).</li>
                      <li>Selesaikan pembayaran sebelum batas waktu berakhir.</li>
                    </ol>
                  </div>
                  <div className="border-t border-slate-800/80 pt-3">
                    <h4 className="font-extrabold text-[11px] uppercase text-amber-500 tracking-wider mb-1">Penting:</h4>
                    <ul className="list-disc list-inside space-y-1 pl-0 text-slate-455 font-light">
                      <li>Anda hanya dapat memiliki maksimal <strong className="text-amber-500/90 font-bold">3 permintaan deposit Pending</strong>, jangan melakukan spam dan segera lunasi pembayaran.</li>
                      <li>Jika permintaan deposit tidak dibayar dalam waktu lebih dari <strong className="text-slate-350 font-semibold"> 120 menit </strong>, maka permintaan deposit akan <strong className="text-red-400/90 font-bold">otomatis dibatalkan (Failed)</strong>.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Redesigned Bonus Deposit Box */}
              {bonusPercent > 0 && (
                <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/15 rounded-2xl p-5 mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 uppercase font-extrabold tracking-wider block">Minimal Deposit Bonus</span>
                      <span className="block text-base font-extrabold text-slate-900 dark:text-slate-200 mt-1">{formatPrice(bonusMinLimit)}</span>
                    </div>
                    <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 uppercase font-extrabold tracking-wider block">Bonus Saldo</span>
                      <span className="block text-base font-extrabold text-emerald-500 mt-1">+{bonusPercent}%</span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleInitiateTopup} className="space-y-8">
                {/* Two input fields side-by-side or stacked on mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">Jumlah Deposit</label>
                    <div className="relative group">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-455 dark:text-slate-500 text-sm transition-colors group-focus-within:text-indigo-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="Contoh: 50.000"
                        value={formatNumberWithDots(topupAmount)}
                        onChange={(e) => setTopupAmount(parseNumberFromDots(e.target.value))}
                        className="w-full force-white-bg border border-slate-200 dark:border-slate-800 text-slate-200 dark:text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 px-5 pl-12 py-4 rounded-2xl outline-none transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">Saldo Didapat</label>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-455 dark:text-slate-500 text-sm">Rp</span>
                      <input
                        type="text"
                        disabled
                        readOnly
                        value={calculatedReceivedBalance === 0 ? '' : calculatedReceivedBalance.toLocaleString('id-ID')}
                        placeholder="0"
                        className="w-full force-white-bg border border-slate-200 dark:border-slate-800 text-slate-200 dark:text-slate-200 pl-12 pr-5 py-4 rounded-2xl outline-none text-sm font-extrabold"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset quick buttons */}
                <div>
                  <div className="grid grid-cols-3 gap-3">
                    {[20000, 50000, 100000].map(amount => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setTopupAmount(amount)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-500/5 py-3.5 rounded-2xl text-xs font-extrabold transition-all text-slate-800 dark:text-slate-200 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer text-center flex items-center justify-center hover:scale-102 active:scale-98"
                      >
                        +{formatPrice(amount).replace('Rp', '').trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 text-xs text-slate-400 dark:text-slate-200 flex items-start gap-3 leading-relaxed">
                  <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                  <span>Pembayaran Anda akan diproses secara instan & aman. QRIS, e-wallet, dan Bank Transfer didukung oleh payment gateway kami.</span>
                </div>

                <button
                  type="submit"
                  disabled={submittingTopup || topupAmount < 10000}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4.5 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  {submittingTopup ? 'Menghubungkan...' : 'Bayar Sekarang'}
                </button>
              </form>
            </div>
          </div>
        );
      })()}


      {/* Premium Toast Notification */}
      {notification.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-[90vw] sm:max-w-md w-max">
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />}
          <span className="text-xs font-semibold text-slate-200 break-words leading-relaxed">{notification.message}</span>
          <button
            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
            className="text-slate-500 hover:text-slate-355 transition-colors ml-2 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Premium Confirmation Dialog */}
      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 text-zinc-900 dark:text-slate-100 border border-zinc-200 dark:border-slate-800/80 p-5 sm:p-8 rounded-2xl sm:rounded-[32px] shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-start mb-4 shrink-0">
              <div className="flex items-center gap-2">
                {selectedAnnouncement.badge && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/20">
                    {selectedAnnouncement.badge}
                  </span>
                )}
                <span className="text-[10px] text-zinc-400 dark:text-slate-400 font-bold">
                  {new Date(selectedAnnouncement.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 p-1.5 hover:bg-zinc-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body content container */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-4 min-h-0 scrollbar-thin scrollbar-thumb-zinc-250 dark:scrollbar-thumb-slate-800">
              {/* Title */}
              <h3 className="announcement-content-text text-base sm:text-xl font-extrabold tracking-tight leading-snug">{selectedAnnouncement.title}</h3>

              {/* Image Banner if exists */}
              {selectedAnnouncement.image_url && (
                <div
                  className="w-full h-40 sm:h-64 relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-200/80 dark:border-slate-800 mb-2 cursor-zoom-in group"
                  onClick={() => setShowImageZoom(selectedAnnouncement.image_url || null)}
                  title="Klik untuk memperbesar gambar"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedAnnouncement.image_url}
                    alt={selectedAnnouncement.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                  {/* Overlay hint on hover */}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-white text-[9px] font-bold bg-black/75 px-3.5 py-2 rounded-full border border-white/10 tracking-widest">KLIK UNTUK MEMPERBESAR</span>
                  </div>
                </div>
              )}

              {/* Body Content Text */}
              <div className="announcement-content-text text-xs sm:text-sm font-normal leading-relaxed whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-zinc-150 dark:border-slate-850 flex justify-end shrink-0 mt-4">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="w-full sm:w-auto text-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* News & Announcements Modal */}
      {showNewsModal && announcements.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 bg-slate-950/60 animate-in fade-in duration-200">
          <div className="w-[92%] sm:w-full sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[50vh] sm:max-h-[480px] overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-center px-4 sm:px-6 pt-3.5 sm:pt-5 pb-2.5 border-b border-slate-100 dark:border-slate-850">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-7.5 h-7.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Megaphone className="w-3.5 h-3.5 animate-bounce" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 border border-white dark:border-slate-900 rounded-full animate-ping" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 border border-white dark:border-slate-900 rounded-full" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    Berita &amp; Informasi!
                  </h3>
                  <p className="text-[8.5px] sm:text-[9.5px] text-slate-500 dark:text-white font-medium">Update terbaru layanan kami</p>
                </div>
              </div>

              <button
                onClick={() => setShowNewsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 hover:bg-slate-900 dark:hover:bg-slate-850 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Content List - Unified Scrollable Area (displays up to 30 items) */}
            <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 py-3">
              <div className="flex-1 bg-[#e0f2fe]/45 dark:bg-slate-950/20 border border-[#bae6fd]/60 dark:border-slate-850 rounded-xl p-3 sm:p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-sky-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent space-y-3">
                {[...announcements]
                  .sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                  })
                  .slice(0, 30)
                  .map((ann, index, arr) => {
                    return (
                      <div
                        key={ann.id}
                        className={`pb-3.5 ${index !== arr.length - 1 ? 'border-b border-[#bae6fd]/50 dark:border-slate-800' : ''} hover:bg-sky-100/30 dark:hover:bg-slate-900/10 px-2 rounded-lg transition-all cursor-pointer group`}
                        onClick={() => setSelectedAnnouncement(ann)}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                            {new Date(ann.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {ann.badge && (
                              <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase tracking-wider inline-block ${getAnnouncementBadgeClass(ann.badge)}`}>
                                {ann.badge}
                              </span>
                            )}
                            {ann.is_pinned && (
                              <div className="flex items-center justify-center p-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0" title="Disematkan">
                                <Pin className="w-2.5 h-2.5 fill-amber-500 transform rotate-45" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-3 mt-1.5">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-[13px] font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-455 transition-colors leading-tight">
                              {ann.title}
                            </h4>
                            <p className="text-slate-700 dark:text-slate-300 text-[10.5px] font-medium leading-relaxed mt-1 line-clamp-3">
                              {ann.content}
                            </p>
                            <div className="text-[9.5px] text-indigo-650 dark:text-indigo-400 font-extrabold flex items-center gap-0.5 hover:underline mt-1.5">
                              <span>Detail Selengkapnya</span>
                              <span>&rarr;</span>
                            </div>
                          </div>

                          {ann.image_url && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#bae6fd] dark:border-slate-800 shrink-0 bg-white dark:bg-slate-950 relative mt-0.5 shadow-sm">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={ann.image_url} alt="Thumbnail" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 w-full">
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-bold text-center sm:text-left">
                {Math.min(announcements.length, 30)} Update Terbaru
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowNewsModal(false)}
                  className="flex-1 sm:flex-initial text-center px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-xl transition-all cursor-pointer border border-slate-200/40 dark:border-slate-800/50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (user && announcements.length > 0) {
                      const sortedAnnouncements = [...announcements].sort(
                        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      );
                      const latestAnnId = sortedAnnouncements[0]?.id;
                      localStorage.setItem(`last_read_announcement_id_${user.id}`, latestAnnId);
                    }
                    setShowNewsModal(false);
                    showToast('Pengumuman ditandai sebagai sudah dibaca', 'success');
                  }}
                  className="flex-1 sm:flex-initial text-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-[11px] font-extrabold rounded-xl transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3 shrink-0" />
                  <span>Saya sudah membaca</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Image Lightbox Zoom Overlay */}
      {showImageZoom && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setShowImageZoom(null)}
        >
          <button
            className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-md border border-white/10 transition-all cursor-pointer"
            onClick={() => setShowImageZoom(null)}
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={showImageZoom}
            alt="Zoomed Banner"
            className="max-w-[92%] max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
          />
        </div>
      )}

      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-200 mb-2">Konfirmasi Tindakan</h4>
            <p className="text-xs text-slate-400 mb-6 font-light leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
                className="flex-1 bg-slate-950 hover:bg-slate-900 text-slate-300 border border-slate-800 py-3 rounded-xl text-xs font-semibold transition-all active:scale-98 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, show: false }));
                }}
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 active:scale-98 cursor-pointer"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTxDetail && (() => {
        const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;
        const txDateStr = new Date(selectedTxDetail.created_at).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-bold mb-6 flex items-center gap-2 border-b border-slate-850 pb-3 text-slate-100">
                <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>Detail {selectedTxDetail.type === 'topup' ? 'Deposit' : 'Transaksi'} #{selectedTxDetail.tx_id || selectedTxDetail.id.slice(0, 8)}</span>
              </h3>

              <div className="space-y-3.5 text-xs text-slate-305">
                <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                  <span className="text-slate-450 font-light">ID {selectedTxDetail.type === 'topup' ? 'Deposit' : 'Transaksi'}</span>
                  <span className="font-mono font-semibold text-slate-300">#{selectedTxDetail.tx_id || selectedTxDetail.id.slice(0, 8)}</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                  <span className="text-slate-450 font-light">Status</span>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-block ${selectedTxDetail.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-500/20' :
                    selectedTxDetail.status === 'failed' ? 'bg-rose-50 dark:bg-red-500/10 text-rose-700 dark:text-red-400 border-rose-200/60 dark:border-red-500/20' :
                      'bg-amber-600 dark:bg-amber-700 text-white'
                    }`}>
                    {selectedTxDetail.status === 'success' ? 'Sukses' :
                      selectedTxDetail.status === 'failed' ? 'Dibatalkan' :
                        'Belum Dibayar'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                  <span className="text-slate-450 font-light">Dibuat</span>
                  <span className="font-medium text-slate-300">{txDateStr}</span>
                </div>

                <div className="flex justify-between items-start py-2.5 border-b border-slate-850/60 gap-4">
                  <span className="text-slate-450 font-light shrink-0">Metode Pembayaran</span>
                  <span className="font-medium text-slate-400 text-right text-[11px] leading-relaxed">
                    {formatPaymentMethod(selectedTxDetail.payment_method)}
                  </span>
                </div>

                {selectedTxDetail.type === 'topup' ? (() => {
                  const baseAmount = Number(selectedTxDetail.amount);
                  const bonusMin = parseInt(siteSettings.deposit_bonus_min) || 10000;
                  const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;
                  const hasBonus = baseAmount >= bonusMin && bonusPercent > 0;
                  const bonusAmount = hasBonus ? Math.round(baseAmount * bonusPercent / 100) : 0;
                  const creditedAmount = baseAmount + bonusAmount;

                  return (
                    <>
                      <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                        <span className="text-slate-450 font-light">Jumlah Deposit</span>
                        <span className="font-medium text-slate-300">{formatPrice(baseAmount)}</span>
                      </div>

                      <div className="flex justify-between items-start py-2.5 border-b border-slate-850/60 flex-col">
                        <div className="flex justify-between w-full items-center">
                          <span className="text-slate-450 font-light flex flex-col">
                            <span>Total</span>
                            <span className="text-[9px] text-slate-500 font-light">*Jumlah yang harus dibayar</span>
                          </span>
                          <span className="font-extrabold text-rose-400 text-sm">{formatPrice(baseAmount)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-start py-2.5 border-b border-slate-850/60 flex-col">
                        <div className="flex justify-between w-full items-center">
                          <span className="text-slate-450 font-light flex flex-col">
                            <span>Bonus</span>
                            <span className="text-[9px] text-slate-500 font-light">*Bonus untuk deposit lebih dari atau sama dengan {formatPrice(bonusMin)}</span>
                          </span>
                          <span className="font-medium text-slate-300">{formatPrice(bonusAmount)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-start py-2.5 border-b border-slate-850/60 flex-col">
                        <div className="flex justify-between w-full items-center">
                          <span className="text-slate-450 font-light flex flex-col">
                            <span>Saldo</span>
                            <span className="text-[9px] text-slate-500 font-light">*Jumlah saldo yang didapatkan</span>
                          </span>
                          <span className="font-bold text-emerald-400 text-sm">{formatPrice(creditedAmount)}</span>
                        </div>
                      </div>
                    </>
                  );
                })() : (
                  <>
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                      <span className="text-slate-450 font-light">Total Bayar</span>
                      <span className={`font-extrabold text-sm ${selectedTxDetail.type === 'refund' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {selectedTxDetail.type === 'refund' ? '+' : '-'}{formatPrice(selectedTxDetail.amount)}
                      </span>
                    </div>
                  </>
                )}

                {selectedTxDetail.description && (
                  <div className="flex justify-between items-start py-2.5 border-b border-slate-850/60 gap-4">
                    <span className="text-slate-450 font-light shrink-0">Keterangan</span>
                    <span className="font-medium text-slate-300 text-right text-[11px] leading-relaxed max-w-[200px]">
                      {selectedTxDetail.description}
                    </span>
                  </div>
                )}
              </div>

              {selectedTxDetail.status === 'pending' && (
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => {
                      handlePayPendingTopup(selectedTxDetail);
                      setSelectedTxDetail(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 rounded-2xl transition-all shadow-lg text-xs cursor-pointer"
                  >
                    Bayar Sekarang
                  </button>
                  <button
                    onClick={() => {
                      handleCancelPendingTopup(selectedTxDetail);
                      setSelectedTxDetail(null);
                    }}
                    className="flex-1 bg-slate-950 border border-slate-850 hover:bg-rose-600/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 font-bold py-3 rounded-2xl transition-all text-xs cursor-pointer"
                  >
                    Batalkan Deposit
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Order Detail Modal with Progress Tracker */}
      {selectedOrderDetail && (() => {
        const orderDateStr = new Date(selectedOrderDetail.created_at).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Status mapping to progress step
        const getStatusStep = (status: string) => {
          if (status === 'success') return 4;
          if (status === 'inprogress') return 3;
          if (status === 'processing') return 2;
          return 1; // pending
        };
        const activeStep = getStatusStep(selectedOrderDetail.status);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-[32px] shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="absolute top-6 right-6 text-slate-500 hover:text-slate-350 transition-colors p-2 hover:bg-slate-850 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-850 pb-3 text-slate-100">
                <Clock className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <span>Pelacakan Detail Pesanan</span>
              </h3>

              {/* Progress Tracker */}
              <div className="mb-8 pt-2">
                <div className="relative flex justify-between items-center w-full">
                  {/* Progress Line */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-800 -z-10 rounded-full">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${((activeStep - 1) / 3) * 100}%` }}
                    />
                  </div>

                  {/* Steps */}
                  {[
                    { step: 1, label: 'Dibuat' },
                    { step: 2, label: 'Proses' },
                    { step: 3, label: 'Berjalan' },
                    { step: 4, label: 'Selesai' }
                  ].map(s => {
                    const isPassed = activeStep >= s.step;
                    const isActive = activeStep === s.step;
                    return (
                      <div key={s.step} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isPassed
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'bg-slate-950 text-slate-500 border border-slate-800'
                          } ${isActive ? 'ring-4 ring-indigo-500/20' : ''}`}>
                          {s.step}
                        </div>
                        <span className={`text-[10px] font-bold mt-2 tracking-wide uppercase ${isPassed ? 'text-slate-350 dark:text-slate-400' : 'text-slate-500'}`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex justify-between items-start py-2.5 border-b border-slate-850/60 gap-4">
                  <span className="text-slate-550 dark:text-slate-500 font-light shrink-0">Order ID</span>
                  <span className="font-mono font-semibold text-slate-200 break-all text-right select-all">{selectedOrderDetail.id}</span>
                </div>

                <div className="flex justify-between items-start py-2.5 border-b border-slate-850/60 gap-4">
                  <span className="text-slate-550 dark:text-slate-500 font-light shrink-0">Layanan</span>
                  <span className="font-bold text-slate-200 text-right break-words max-w-[70%]">{selectedOrderDetail.service_name}</span>
                </div>

                <div className="flex justify-between items-start py-2.5 border-b border-slate-850/60 gap-4">
                  <span className="text-slate-550 dark:text-slate-500 font-light shrink-0">Target URL</span>
                  <span className="font-mono text-slate-300 break-all text-right select-all">{selectedOrderDetail.target_url}</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                  <span className="text-slate-550 dark:text-slate-500 font-light">Jumlah Order</span>
                  <span className="font-extrabold text-slate-200">{selectedOrderDetail.quantity.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                  <span className="text-slate-550 dark:text-slate-500 font-light">Harga Total</span>
                  <span className="font-extrabold text-slate-100 text-sm">{formatPrice(selectedOrderDetail.total_price)}</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                  <span className="text-slate-550 dark:text-slate-500 font-light">Start Count</span>
                  <span className="font-mono font-bold text-slate-200">{selectedOrderDetail.start_count !== null ? selectedOrderDetail.start_count.toLocaleString() : 'Menunggu update...'}</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                  <span className="text-slate-550 dark:text-slate-500 font-light">Waktu Pembelian</span>
                  <span className="font-medium text-slate-300">{orderDateStr}</span>
                </div>
              </div>


            </div>
          </div>
        );
      })()}

      {/* Invoice Receipt Modal */}
      {selectedInvoiceDetail && (() => {
        const invDateStr = new Date(selectedInvoiceDetail.date).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:z-0">
            <div className="w-full max-w-lg bg-white text-zinc-900 border border-zinc-200 p-8 sm:p-10 rounded-[32px] shadow-2xl relative animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:rounded-none">

              {/* Print CSS Override */}
              <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #print-area, #print-area * {
                    visibility: visible;
                  }
                  #print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                  }
                }
              `}} />

              {/* Close Button - hidden during print */}
              <button
                onClick={() => setSelectedInvoiceDetail(null)}
                className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-600 transition-colors p-2 hover:bg-zinc-100 rounded-xl print:hidden"
              >
                <X className="w-5 h-5" />
              </button>
              {/* Invoice Layout */}
              <div id="print-area">
                <div className="flex justify-between items-start border-b border-zinc-200 pb-6 pr-10">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                        <Zap className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-lg tracking-tight text-zinc-950">Buzzify</span>
                    </div>
                    <p className="text-[10px] text-zinc-550">Platform SMM & Buzzer Terbaik Indonesia</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold tracking-wider text-emerald-600 uppercase bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-md">KUITANSI RESMI</span>
                    <p className="text-xs font-mono font-bold text-zinc-800 mt-2">
                      {selectedInvoiceDetail.id.startsWith('TRX-') || /^\d+$/.test(selectedInvoiceDetail.id)
                        ? selectedInvoiceDetail.id
                        : `#${selectedInvoiceDetail.id.slice(0, 8).toUpperCase()}`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-b border-zinc-100 text-xs">
                  <div>
                    <span className="text-zinc-500 block mb-1">Diterbitkan Untuk:</span>
                    <strong className="text-zinc-900 font-bold block">{user?.email}</strong>
                    <span className="text-zinc-500 text-[10px] block mt-0.5">User ID: {user?.id.slice(0, 12)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 block mb-1">Tanggal Transaksi:</span>
                    <strong className="text-zinc-900 block">{invDateStr}</strong>
                    <span className="text-zinc-500 text-[10px] block mt-0.5">Metode: {selectedInvoiceDetail.method}</span>
                  </div>
                </div>

                <div className="py-6">
                  <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block mb-3">Rincian Pembayaran</span>
                  <div className="rounded-2xl border border-zinc-200 overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 text-zinc-650 font-semibold border-b border-zinc-200">
                          <th className="p-3 pl-4">Deskripsi Layanan / Item</th>
                          <th className="p-3 text-right pr-4">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        <tr className="text-zinc-800 bg-white">
                          <td className="p-4 pl-4 font-medium max-w-[280px] break-words">{selectedInvoiceDetail.description}</td>
                          <td className="p-4 text-right pr-4 font-bold text-zinc-900">{formatPrice(selectedInvoiceDetail.amount)}</td>
                        </tr>
                        <tr className="bg-indigo-50/40 font-bold text-zinc-900 border-t border-zinc-200">
                          <td className="p-4 pl-4 text-right text-[10px] uppercase tracking-wider text-zinc-500">TOTAL BAYAR (LUNAS):</td>
                          <td className="p-4 text-right pr-4 text-slate-900 dark:text-slate-100 text-sm font-extrabold">{formatPrice(selectedInvoiceDetail.amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-zinc-100">
                  <p className="text-[10px] text-zinc-500 leading-relaxed">Kuitansi ini dibuat secara otomatis oleh sistem Buzzify dan sah sebagai bukti pembayaran yang valid. Terima kasih atas kepercayaan Anda!</p>
                </div>
              </div>

              {/* Actions - hidden during print */}
              <div className="mt-8 pt-4 border-t border-zinc-200 flex gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoiceDetail(null)}
                  className="flex-1 bg-zinc-100 hover:bg-zinc-250 text-zinc-700 font-bold py-3.5 rounded-2xl transition-all text-xs cursor-pointer text-center"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-[32px] shadow-2xl relative my-auto animate-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-slate-800">

            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200 transition-colors p-2 hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6 border-b border-slate-800 pb-4 pr-12">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                <User className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <span>Pengaturan Profil & Keamanan</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Ubah data profil Anda atau lakukan pembaruan kata sandi</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column: Update Profile Info */}
              <div>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Informasi Akun</h3>
                  {profileError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  {profileSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}
                  {/* Email (Non-editable) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Email (Akun)</label>
                    <input
                      type="text"
                      disabled
                      value={user?.email || ''}
                      className="w-full bg-slate-950/60 border border-slate-850/50 text-slate-400 px-4 py-2.5 rounded-xl outline-none text-xs cursor-not-allowed font-medium"
                    />
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                      <span>* Hubungi Admin jika ingin mengubah alamat email.</span>
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap Anda"
                      value={profileFullName}
                      onChange={(e) => setProfileFullName(e.target.value)}
                      className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl outline-none transition-all text-xs"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan username Anda"
                      value={profileUsername}
                      onChange={(e) => setProfileUsername(e.target.value)}
                      className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl outline-none transition-all text-xs"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Nomor WhatsApp</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 08123456789"
                      value={profileWhatsApp}
                      onChange={(e) => setProfileWhatsApp(e.target.value)}
                      className="w-full bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl outline-none transition-all text-xs"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all text-xs cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {profileLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Perubahan Profil</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Change Password */}
              <div className="border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Ganti Password</h3>                  {changePasswordError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
                      <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>{changePasswordError}</span>
                    </div>
                  )}
                  {changePasswordSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{changePasswordSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Password Saat Ini</label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        required
                        placeholder="Masukkan password sekarang"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full force-white-bg border border-slate-850 text-slate-900 dark:text-slate-100 focus:border-indigo-500 pl-4 pr-10 py-2.5 rounded-xl outline-none transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Password Baru</label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        placeholder="Password baru (min. 6 karakter)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full force-white-bg border border-slate-850 text-slate-900 dark:text-slate-100 focus:border-indigo-500 pl-4 pr-10 py-2.5 rounded-xl outline-none transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Konfirmasi Password Baru</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="Ulangi password baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full force-white-bg border border-slate-850 text-slate-900 dark:text-slate-100 focus:border-indigo-500 pl-4 pr-10 py-2.5 rounded-xl outline-none transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold py-3 rounded-xl transition-all text-xs cursor-pointer text-center"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={changePasswordLoading}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all text-xs cursor-pointer text-center disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {changePasswordLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <span>Perbarui Password</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Ticket Detail & Chat Modal */}
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
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${selectedTicket.status === 'Answered' ? 'bg-emerald-600 dark:bg-emerald-700 text-white' :
                    selectedTicket.status === 'Closed' ? 'bg-slate-600 dark:bg-slate-700 text-white' :
                      'bg-amber-50 text-amber-600 border border-amber-200/50'
                    }`}>
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
                className="text-zinc-400 hover:text-zinc-650 p-1.5 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer animate-in fade-in"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 scrollbar-thin scrollbar-thumb-zinc-200">
              {ticketMessages.map((msg) => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-bold mb-1 px-1">
                      <span>{isAdmin ? `Admin (${msg.full_name || 'CS'})` : 'Anda'}</span>
                      <span>•</span>
                      <span>{new Date(msg.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>

                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm font-light leading-relaxed whitespace-pre-wrap shadow-sm text-left ${isAdmin
                      ? 'bg-zinc-100 text-zinc-800 rounded-tl-none border border-zinc-200/50'
                      : 'bg-indigo-600 text-white rounded-tr-none'
                      }`}>
                      {msg.message}

                      {msg.image_url && (
                        <div
                          className="mt-3 relative rounded-xl overflow-hidden border border-black/10 cursor-zoom-in max-h-48"
                          onClick={() => setShowImageZoom(msg.image_url)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    placeholder="Tulis balasan pesan Anda..."
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
                      id="ticket-reply-image-upload"
                    />
                    <label
                      htmlFor="ticket-reply-image-upload"
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newTicketMessageImage} alt="Reply Attachment" className="h-16 w-16 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setNewTicketMessageImage('')}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-650 text-white p-1 rounded-full shadow-md scale-75 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <div className="border-t border-zinc-150 pt-4 text-center text-xs text-zinc-400 italic">
                Tiket ini telah ditutup. Anda tidak dapat mengirim balasan pesan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Dribbble-style Order Confirmation Modal */}
      {showOrderConfirmModal && selectedService && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowOrderConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition-colors p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-3 shadow-md shadow-indigo-500/5">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                Konfirmasi Detail Pesanan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 font-medium leading-relaxed max-w-[320px]">
                Mohon periksa kembali detail pesanan Anda sebelum saldo terpotong untuk pembayaran.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850/80 rounded-2xl p-4.5 space-y-3.5 mb-6 text-xs text-slate-650 dark:text-slate-350">
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">Layanan:</span>
                <span className="font-extrabold text-slate-850 dark:text-slate-100 text-right break-words max-w-[240px]">
                  [#{selectedService.id}] {selectedService.name}
                </span>
              </div>
              <div className="h-px bg-slate-200/60 dark:bg-slate-800/60" />
              <div className="flex justify-between items-start gap-4">
                <span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">Target URL:</span>
                <span className="font-mono font-bold text-slate-750 dark:text-slate-200 text-right break-all">
                  {targetUrl}
                </span>
              </div>
              <div className="h-px bg-slate-200/60 dark:bg-slate-800/60" />
              <div className="flex justify-between items-center">
                <span className="text-slate-400 dark:text-slate-500 font-semibold">Jumlah:</span>
                <span className="font-black text-slate-850 dark:text-slate-100">
                  {quantity.toLocaleString()}
                </span>
              </div>
              <div className="h-px bg-slate-200/60 dark:bg-slate-800/60" />
              <div className="flex justify-between items-center bg-indigo-500/5 dark:bg-indigo-500/10 -mx-4.5 -mb-4.5 p-4.5 rounded-b-2xl border-t border-indigo-500/10">
                <span className="text-indigo-650 dark:text-indigo-400 font-black">Total Pembayaran:</span>
                <span className="font-black text-base text-indigo-650 dark:text-indigo-400">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowOrderConfirmModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 py-3.5 rounded-2xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer text-center"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executePlaceOrder}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl text-xs font-black transition-all active:scale-[0.97] cursor-pointer text-center shadow-lg shadow-indigo-600/15"
              >
                Konfirmasi & Bayar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
