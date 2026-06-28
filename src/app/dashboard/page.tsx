'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Upload,
  Eye,
  EyeOff,
  Pin
} from 'lucide-react';
import confetti from 'canvas-confetti';

const formatNumberWithDots = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined || num === 0 || num === '0' || num === '') return '';
  const clean = String(num).replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(clean, 10));
};

const parseNumberFromDots = (str: string): number => {
  const clean = str.replace(/\D/g, '');
  return parseInt(clean, 10) || 0;
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
  if (s === 'success') return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold shadow-sm shadow-emerald-500/30';
  if (s === 'inprogress') return 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-extrabold shadow-sm shadow-blue-500/30';
  if (s === 'processing') return 'bg-gradient-to-r from-sky-400 to-cyan-400 text-slate-950 font-extrabold shadow-sm shadow-sky-400/30';
  if (s === 'failed' || s === 'error' || s === 'dibatalkan') return 'bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold shadow-sm shadow-rose-500/30';
  if (s === 'partial') return 'bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold shadow-sm shadow-rose-500/30';
  if (s === 'pending') return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/30';
  return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/30';
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

  useEffect(() => {
    setIsMounted(true);
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'order' | 'history' | 'transactions' | 'tickets'>('dashboard');
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
  const [txMethodFilter, setTxMethodFilter] = useState('all');
  const [txSearchType, setTxSearchType] = useState('id');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [selectedTxDetail, setSelectedTxDetail] = useState<Transaction | null>(null);
  const [isExamplesExpanded, setIsExamplesExpanded] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [chartDataType, setChartDataType] = useState<'spending' | 'orders'>('spending');
  const itemsPerPage = 10;

  useEffect(() => {
    setTransactionsPage(1);
  }, [txStatusFilter, txYearFilter, txMethodFilter, txSearchQuery]);

  useEffect(() => {
    setOrdersPage(1);
  }, [searchTerm, statusFilter, orderYearFilter]);

  const clearOrderForm = () => {
    setSelectedCategory('');
    setSelectedService(null);
    setTargetUrl('');
    setQuantity(0);
    setTotalPrice(0);
    setFormError(null);
  };

  // Refetch data automatically on tab navigation
  useEffect(() => {
    if (user) {
      fetchProfileAndTransactions(user.id);
      fetchOrders(user.id);
    }
  }, [activeTab]);

  // Clear form when user changes or logs in
  useEffect(() => {
    clearOrderForm();
  }, [user]);

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
        .eq('is_active', true);

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

    setSubmittingOrder(true);
    const orderPayload = {
      user_id: user.id,
      service_id: selectedService.id,
      category: selectedService.category,
      service_name: selectedService.name,
      target_url: targetUrl,
      quantity: quantity,
      price_per_k: selectedService.price_per_k,
      total_price: totalPrice,
      status: 'pending' as const,
      start_count: 0,
      payment_status: 'paid' as const,
      payment_method: 'wallet',
    };

    try {
      // 1. Deduct balance immediately in local state & localStorage fallback
      const newBalance = balance - totalPrice;
      localStorage.setItem(`balance_${user.id}`, String(newBalance));
      setBalance(newBalance);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', user.id);

      const txPayload = {
        user_id: user.id,
        amount: -totalPrice,
        type: 'order_payment' as const,
        status: 'success' as const,
        payment_method: 'wallet',
      };

      let createdOrder: Order;

      const { data, error } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select()
        .single();

      if (error || profileError) {
        // Handle client fallback if supabase table does not exist
        console.warn('Database insert failed, using localStorage fallback');
        const fallbackOrderId = Math.random().toString(36).substring(2, 9);
        const fallbackOrder: Order = {
          id: fallbackOrderId,
          ...orderPayload,
          created_at: new Date().toISOString()
        };
        const currentOrders = [fallbackOrder, ...orders];
        setOrders(currentOrders);
        localStorage.setItem(`orders_${user.id}`, JSON.stringify(currentOrders));
        createdOrder = fallbackOrder;

        const localTx = {
          id: `TX-${Math.random().toString(36).substring(2, 9)}`,
          user_id: user.id,
          amount: -totalPrice,
          type: 'order_payment' as const,
          status: 'success' as const,
          reference_id: fallbackOrderId,
          payment_method: 'wallet',
          created_at: new Date().toISOString()
        };
        const updatedTxs = [localTx, ...transactions];
        setTransactions(updatedTxs);
        localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTxs));
      } else {
        createdOrder = data;

        // Create transaction log
        const localTxId = `TX-${Math.random().toString(36).substring(2, 9)}`;
        const localTx = {
          id: localTxId,
          user_id: user.id,
          amount: -totalPrice,
          type: 'order_payment' as const,
          status: 'success' as const,
          reference_id: createdOrder.id,
          payment_method: 'wallet',
          created_at: new Date().toISOString()
        };
        const updatedTxs = [localTx, ...transactions];
        setTransactions(updatedTxs);
        localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTxs));

        await supabase
          .from('transactions')
          .insert({
            ...txPayload,
            reference_id: createdOrder.id
          });

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

            await supabase
              .from('transactions')
              .update({ status: 'success', payment_method: snapResult.payment_type || 'midtrans' })
              .eq('id', dbTxId);

            const { data: profile } = await supabase
              .from('profiles')
              .select('balance')
              .eq('id', user.id)
              .single();

            if (profile) {
              const currentBalance = Number(profile.balance || 0);
              const newBalance = currentBalance + topupAmount;
              await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', user.id);
            }

            // Always sync local storage fallback
            const localTx = {
              id: dbTxId,
              ...txPayload,
              status: 'success' as const,
              payment_method: snapResult.payment_type || 'midtrans',
              created_at: new Date().toISOString()
            };
            const updatedTxs = [localTx, ...transactions.filter(t => t.id !== dbTxId)];
            setTransactions(updatedTxs);
            localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updatedTxs));

            const newLocalBalance = balance + topupAmount;
            setBalance(newLocalBalance);
            localStorage.setItem(`balance_${user.id}`, String(newLocalBalance));

            await fetchProfileAndTransactions(user.id);

            setShowTopupModal(false);
            setTopupAmount(0);
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.5 }
            });
            showToast('Top Up berhasil! Saldo Anda telah ditambahkan.', 'success');
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
            await supabase
              .from('transactions')
              .update({ status: 'success', payment_method: snapResult.payment_type || 'midtrans' })
              .eq('id', tx.id);

            const { data: profile } = await supabase
              .from('profiles')
              .select('balance')
              .eq('id', user.id)
              .single();

            if (profile) {
              const currentBalance = Number(profile.balance || 0);
              const newBalance = currentBalance + tx.amount;
              await supabase
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', user.id);
            }

            await fetchProfileAndTransactions(user.id);

            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.5 }
            });
            showToast('Top Up berhasil! Saldo Anda telah ditambahkan.', 'success');
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
    const monthlyData: Record<string, { spending: number; count: number }> = {};
    const monthsOrder = [];

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1); // avoid month overflow issues
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('id-ID', { month: 'short' });
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyData[key] = { spending: 0, count: 0 };
      monthsOrder.push({ key, label });
    }

    // Aggregate orders
    orders.forEach(o => {
      if (o.payment_status === 'paid' && o.status !== 'failed') {
        const od = new Date(o.created_at);
        const key = `${od.getFullYear()}-${od.getMonth()}`;
        if (monthlyData[key]) {
          monthlyData[key].spending += Number(o.total_price);
          monthlyData[key].count += 1;
        }
      }
    });

    return monthsOrder.map(m => ({
      label: m.label,
      spending: monthlyData[m.key].spending,
      count: monthlyData[m.key].count
    }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatPaymentMethod = (method?: string | null) => {
    if (!method) return 'Payment Gateway (Midtrans)';
    const lower = method.toLowerCase();
    if (lower === 'qris') return 'QRIS';
    if (lower === 'bank_transfer') return 'Bank Transfer';
    if (lower === 'gopay') return 'GoPay';
    if (lower === 'shopeepay') return 'ShopeePay';
    if (lower === 'cstore') return 'Convenience Store (Indomaret/Alfamart)';
    if (lower === 'credit_card') return 'Credit Card';
    if (lower === 'wallet') return 'Saldo Akun';
    if (lower === 'midtrans') return 'Payment Gateway (Midtrans)';
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
    <div className="min-h-screen bg-slate-955 text-slate-100 selection:bg-indigo-500 selection:text-white font-sans transition-colors duration-300">

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
        />
      )}

      <div className="flex min-h-screen">

        {/* Left Sidebar */}
        <aside className={`fixed top-0 left-0 z-50 w-68 h-screen bg-slate-900 border-r border-slate-800/80 p-6 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 overflow-hidden md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
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
                    onClick={() => {
                      setActiveTab('dashboard');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'dashboard'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-950/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => {
                      clearOrderForm();
                      setActiveTab('order');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'order'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-950/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Buat Pesanan</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('history');
                      fetchOrders(user.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'history'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-950/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Riwayat Pesanan</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('transactions');
                      fetchProfileAndTransactions(user.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'transactions'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-955/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Log Saldo / Topup</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('tickets');
                      fetchTickets();
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'tickets'
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400'
                      : 'text-slate-400 hover:bg-slate-850 dark:hover:bg-slate-955/40 hover:text-slate-200 dark:hover:text-slate-200'
                      }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Tiket Bantuan</span>
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
        <div className="flex-1 flex flex-col min-w-0 font-sans md:pl-68">

          {/* Top Navbar */}
          <header className="h-16 bg-slate-900 border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Mobile Burger Toggle */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 hover:bg-slate-800 rounded-xl text-slate-450 transition-colors"
              >
                <Zap className="w-5 h-5 text-indigo-500" />
              </button>

              <h1 className="text-xs font-black text-slate-100 uppercase tracking-wider hidden sm:block">
                {activeTab === 'dashboard' && 'Statistik & Ringkasan Akun'}
                {activeTab === 'order' && 'Buat Pesanan Baru'}
                {activeTab === 'history' && 'Riwayat Pesanan Anda'}
                {activeTab === 'transactions' && 'Log Mutasi Saldo & Topup'}
                {activeTab === 'tickets' && 'Tiket Bantuan Pelanggan'}
              </h1>
            </div>

            {/* Profile Info, Balance & Theme Toggle */}
            <div className="flex items-center gap-3">
              <div className="h-10 px-4 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 font-extrabold border border-slate-200 dark:border-slate-800/80 text-xs tracking-tight flex items-center gap-2 shadow-sm" title="Saldo Wallet Anda">
                <Wallet className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <span>Saldo: {formatPrice(balance)}</span>
              </div>

              <button
                onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setChangePasswordError('');
                  setChangePasswordSuccess('');
                  setShowProfileModal(true);
                }}
                className="h-10 w-10 lg:w-auto lg:px-4 flex items-center justify-center gap-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs font-extrabold text-slate-900 dark:text-slate-200 shadow-sm transition-all cursor-pointer shrink-0"
                title="Ganti Password"
              >
                <User className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                <span className="hidden lg:inline">{user?.email}</span>
              </button>

              <PremiumThemeToggle />
            </div>
          </header>

          {/* Main Dashboard Container */}
          <main className="p-6 md:p-8 pb-28 md:pb-8 space-y-6 flex-1 overflow-y-auto bg-slate-955">

            {/* Dashboard Overview Tab */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Wallet and Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Balance Card */}
                  <div className="relative overflow-hidden bg-slate-900 border border-slate-800/80 shadow-sm p-4 sm:p-6 rounded-3xl flex flex-col justify-between backdrop-blur-md">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-slate-500/5 blur-3xl rounded-full"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Anda</span>
                        <div className="text-3xl font-extrabold text-slate-100 mt-1">{formatPrice(balance)}</div>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-2xl border border-slate-800/80 text-slate-400 shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-5">
                      <button
                        onClick={() => setShowTopupModal(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Top Up Saldo</span>
                      </button>
                    </div>
                  </div>

                  {/* Total Orders Card */}
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-4 sm:p-6 rounded-3xl flex items-center justify-between backdrop-blur-md">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pesanan</span>
                      <div className="text-3xl font-extrabold text-slate-100 mt-1">{orders.length}</div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-2xl border border-slate-800/80 text-slate-400 shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Active Orders Card */}
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-4 sm:p-6 rounded-3xl flex items-center justify-between backdrop-blur-md">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Layanan Aktif</span>
                      <div className="text-3xl font-extrabold text-slate-100 mt-1">
                        {orders.filter(o => o.status === 'processing' || o.status === 'inprogress').length}
                      </div>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-2xl border border-slate-800/80 text-slate-400 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                {/* SVG Line Chart Card */}
                <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-4 sm:p-6 lg:p-8 rounded-3xl backdrop-blur-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                        <span>Statistik Akun Anda</span>
                      </h3>
                      <p className="text-slate-400 text-xs mt-1">Analisis pengeluaran belanja dan riwayat order 6 bulan terakhir</p>
                    </div>
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 self-start">
                      <button
                        onClick={() => setChartDataType('spending')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartDataType === 'spending'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        Pengeluaran
                      </button>
                      <button
                        onClick={() => setChartDataType('orders')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${chartDataType === 'orders'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        Jumlah Order Berhasil
                      </button>
                    </div>
                  </div>

                  {/* Responsive SVG Chart */}
                  {(() => {
                    const chartData = getChartData();
                    const maxValue = Math.max(...chartData.map(d => chartDataType === 'spending' ? d.spending : d.count), 1);
                    const height = 150;
                    const width = 600;
                    const padding = 40;

                    // Generate points
                    const points = chartData.map((d, index) => {
                      const val = chartDataType === 'spending' ? d.spending : d.count;
                      const x = padding + (index * (width - 2 * padding)) / (chartData.length - 1);
                      const y = height - padding - (val / maxValue) * (height - 2 * padding);
                      return { x, y, label: d.label, rawVal: val };
                    });

                    const pathD = points.reduce((acc, p, i) => {
                      return acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
                    }, '');

                    const areaD = points.length > 0
                      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
                      : '';

                    return (
                      <div className="w-full max-w-full overflow-x-auto scrollbar-none">
                        <div className="relative h-[180px] min-w-[300px] sm:min-w-[555px] w-full">
                          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                            {/* Gradients */}
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                              </linearGradient>
                            </defs>

                            {/* Y Grid Lines & Labels */}
                            {[0, 0.5, 1].map((ratio, idx) => {
                              const y = padding + ratio * (height - 2 * padding);
                              const gridVal = maxValue * (1 - ratio);
                              return (
                                <g key={idx} className="opacity-40">
                                  <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#1e293b" strokeDasharray="4 4" />
                                  <text x={padding - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">
                                    {chartDataType === 'spending' ? formatPrice(gridVal) : Math.round(gridVal)}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Area Fill */}
                            {areaD && <path d={areaD} fill="url(#chartGrad)" />}

                            {/* Line Path */}
                            {pathD && <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" />}

                            {/* Data Points */}
                            {points.map((p, idx) => (
                              <g key={idx} className="group/dot cursor-pointer">
                                <circle cx={p.x} cy={p.y} r="4" className="fill-indigo-500 stroke-slate-950 stroke-2" />
                                <circle cx={p.x} cy={p.y} r="8" className="fill-indigo-500/20 opacity-0 group-hover/dot:opacity-100 transition-opacity" />
                                <text x={p.x} y={p.y - 12} textAnchor="middle" className="fill-slate-100 dark:fill-slate-100 text-[10px] font-bold opacity-0 group-hover/dot:opacity-100 transition-opacity bg-slate-955 dark:bg-slate-950 px-1.5 py-0.5 rounded shadow-lg border border-slate-850">
                                  {chartDataType === 'spending' ? formatPrice(p.rawVal) : `${p.rawVal} order`}
                                </text>
                              </g>
                            ))}

                            {/* X Axis Labels */}
                            {points.map((p, idx) => (
                              <text key={idx} x={p.x} y={height - 12} textAnchor="middle" className="fill-slate-400 text-[10px] font-bold">
                                {p.label}
                              </text>
                            ))}
                          </svg>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Grid 2-Column: Left (Info) & Right (Recommendations) */}
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  {/* Left Column: Info & Pengumuman Penting */}
                  {announcements.length > 0 ? (
                    <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-4 sm:p-6 rounded-3xl backdrop-blur-md space-y-4 min-w-0 w-full">
                      <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                        <Megaphone className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Info & Pengumuman Penting</span>
                      </div>
                      <div className="space-y-3">
                        {(() => {
                          const announcementsItemsPerPage = 5;
                          const paginatedAnnouncements = announcements.slice((announcementsPage - 1) * announcementsItemsPerPage, announcementsPage * announcementsItemsPerPage);
                          const announcementsTotalPages = Math.ceil(announcements.length / announcementsItemsPerPage);

                          return (
                            <>
                              {paginatedAnnouncements.map(ann => (
                                <div key={ann.id} className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 flex items-start justify-between gap-3.5 hover:border-slate-800 transition-all">
                                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                    <div className="bg-indigo-600 p-2 rounded-xl text-white shrink-0 mt-0.5">
                                      <Award className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {ann.badge && (
                                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide inline-block ${getAnnouncementBadgeClass(ann.badge)}`}>
                                            {ann.badge}
                                          </span>
                                        )}
                                        <h4 className="text-xs font-extrabold text-slate-200 truncate flex items-center gap-1.5">
                                          {ann.title}
                                          {ann.is_pinned && (
                                            <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0 transform rotate-45" />
                                          )}
                                        </h4>
                                      </div>
                                      <p className="text-slate-400 text-xs leading-relaxed font-light line-clamp-2">{ann.content}</p>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedAnnouncement(ann)}
                                        className="text-[10px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-300 font-bold mt-1.5 flex items-center gap-1 cursor-pointer transition-colors"
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
                                      className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 shrink-0 bg-slate-950 hover:opacity-80 transition-opacity cursor-pointer"
                                      title="Klik untuk memperbesar gambar"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={ann.image_url} alt="Thumbnail Banner" className="w-full h-full object-cover" />
                                    </button>
                                  )}
                                </div>
                              ))}

                              {announcementsTotalPages > 1 && (
                                <div className="flex justify-between items-center pt-4 border-t border-slate-850/60 mt-4 text-[10px]">
                                  <button
                                    type="button"
                                    disabled={announcementsPage === 1}
                                    onClick={() => setAnnouncementsPage(prev => Math.max(1, prev - 1))}
                                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-850 text-slate-300 hover:text-white rounded-lg font-bold transition-all cursor-pointer"
                                  >
                                    &larr; Prev
                                  </button>
                                  <span className="text-slate-500 font-medium">Page {announcementsPage} of {announcementsTotalPages}</span>
                                  <button
                                    type="button"
                                    disabled={announcementsPage >= announcementsTotalPages}
                                    onClick={() => setAnnouncementsPage(prev => Math.min(announcementsTotalPages, prev + 1))}
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
                  ) : (
                    <div className="bg-slate-900 border border-slate-800/80 shadow-sm p-6 rounded-3xl backdrop-blur-md flex flex-col items-center justify-center py-12 text-center text-slate-500 text-xs min-w-0 w-full">
                      <Megaphone className="w-8 h-8 text-slate-650 mb-2" />
                      <span>Belum ada pengumuman terbaru.</span>
                    </div>
                  )}

                  {/* Right Column: Layanan Rekomendasi */}
                  <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl overflow-hidden backdrop-blur-md min-w-0 w-full">
                    <button
                      type="button"
                      onClick={() => setIsRecomExpanded(!isRecomExpanded)}
                      className="w-full flex items-center justify-between p-6 sm:p-7 hover:bg-slate-900/10 dark:hover:bg-slate-900/30 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <ThumbsUp className="w-5 h-5 text-indigo-500 dark:text-indigo-400 dark:text-indigo-500 dark:text-indigo-400 shrink-0" />
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
                                      className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 flex items-center justify-between gap-4 hover:border-indigo-500/30 transition-all group min-w-0 w-full"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                          <span className="text-[9px] font-extrabold text-white uppercase bg-indigo-600 dark:bg-indigo-700 px-2 py-0.5 rounded shadow-sm">
                                            #{actualIndex + 1}
                                          </span>
                                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                            {service.category}
                                          </span>
                                        </div>
                                        <h4 className="text-xs font-bold text-slate-355 dark:text-slate-350 whitespace-normal break-words leading-relaxed group-hover:text-indigo-500 dark:text-indigo-400 transition-colors" title={service.name}>
                                          {service.name}
                                        </h4>
                                        <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-extrabold mt-1">
                                          {formatPrice(service.price_per_k)} <span className="text-[9px] text-slate-500 font-normal">/ 1K</span>
                                        </p>
                                      </div>
                                      <button
                                        onClick={() => {
                                          clearOrderForm();
                                          setSelectedCategory(service.category);
                                          setSelectedService(service);
                                          setActiveTab('order');
                                          showToast(`Layanan '${service.name}' dipilih.`, 'success');
                                        }}
                                        className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all active:scale-95 cursor-pointer shrink-0"
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
                          className="w-full flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 dark:text-slate-100 px-4 py-3.5 rounded-2xl outline-none transition-all text-sm text-left cursor-pointer min-w-0 max-w-full"
                        >
                          <span className="truncate block w-full">{selectedCategory || 'Pilih Kategori...'}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Custom Category Dropdown List */}
                        {isCategoryDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150 max-h-[300px] flex flex-col">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950/80 sticky top-0 backdrop-blur-md">
                              <input
                                type="text"
                                placeholder="Cari Kategori..."
                                value={categorySearchQuery}
                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-xl outline-none text-xs"
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
                            className="flex-1 flex items-center justify-between bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 dark:text-slate-100 px-4 py-3.5 rounded-2xl outline-none transition-all text-sm text-left cursor-pointer min-w-0 max-w-[calc(100vw-140px)] sm:max-w-none"
                          >
                            <span className="truncate block w-full">{selectedService?.name || 'Pilih Layanan...'}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {selectedService && (
                            <button
                              type="button"
                              onClick={() => toggleFavorite(selectedService.id)}
                              className={`p-3.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer ${favorites.includes(selectedService.id)
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                                : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                              title={favorites.includes(selectedService.id) ? 'Hapus dari Layanan Favorit' : 'Simpan ke Layanan Favorit'}
                            >
                              <Star className={`w-5 h-5 ${favorites.includes(selectedService.id) ? 'fill-current' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Custom Service Dropdown List */}
                        {isServiceDropdownOpen && (
                          <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1 duration-150 max-h-[300px] flex flex-col">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950/80 sticky top-0 backdrop-blur-md">
                              <input
                                type="text"
                                placeholder="Cari Layanan..."
                                value={serviceSearchQuery}
                                onChange={(e) => setServiceSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 text-slate-900 dark:text-slate-100 px-3 py-2 rounded-xl outline-none text-xs"
                                autoFocus
                              />
                            </div>
                            <div className="overflow-y-auto scrollbar-thin flex-1 py-1">
                              {services
                                .filter(s => s.category === selectedCategory && s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase()))
                                .map(service => (
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
                                    <span className="block truncate">{service.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {formatPrice(service.price_per_k)} / 1K | Min: {service.min_order.toLocaleString()} - Max: {service.max_order.toLocaleString()}
                                    </span>
                                  </button>
                                ))}
                              {services.filter(s => s.category === selectedCategory && s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 && (
                                <div className="px-4 py-3 text-xs text-slate-500 text-center">Layanan tidak ditemukan</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Target URL */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Data Target / URL Profil / Link Video</label>
                      <input
                        type="url"
                        required
                        placeholder="https://instagram.com/username atau link video"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 dark:text-slate-100 px-4 py-3.5 rounded-2xl outline-none transition-all text-sm"
                      />
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
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-slate-900 dark:text-slate-100 px-4 py-3.5 rounded-2xl outline-none transition-all text-sm font-semibold"
                        />
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

                        {selectedService.description && (
                          <div className="relative overflow-hidden p-4 rounded-2xl bg-slate-950/40 border border-indigo-500/20 dark:border-indigo-500/30 text-xs shadow-md w-full max-w-full break-words">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-xl pointer-events-none" />
                            <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-850">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                              <span className="font-extrabold text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Deskripsi Layanan</span>
                            </div>
                            <div
                              className="text-slate-200 leading-relaxed font-normal text-xs pl-0.5 whitespace-pre-wrap select-text [&_a]:text-indigo-500 dark:text-slate-400 [&_a]:underline [&_a]:hover:text-indigo-300 tracking-wide font-sans break-words"
                              dangerouslySetInnerHTML={{ __html: selectedService.description }}
                            />
                          </div>
                        )}

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

                        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-400 flex items-start gap-2.5 w-full max-w-full break-words">
                          <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                          <div className="w-full min-w-0">
                            <p>Aturan batas order untuk layanan ini:</p>
                            <ul className="list-disc list-inside mt-1 space-y-0.5">
                              <li>Minimal Order: <strong className="text-slate-200">{selectedService.min_order.toLocaleString()}</strong></li>
                              <li>Maksimal Order: <strong className="text-slate-200">{selectedService.max_order.toLocaleString()}</strong></li>
                            </ul>
                          </div>
                        </div>
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
                      className="w-full bg-slate-950 dark:bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 dark:border-slate-800 focus:border-indigo-500 text-slate-900 dark:text-slate-100 pl-11 pr-4 py-2.5 rounded-xl outline-none transition-colors text-sm shadow-sm"
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
                      <span>Copy ID Pesanan</span>
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
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 font-semibold px-4 py-2.5 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-500 shadow-sm"
                    >
                      <option value="all">Semua Tahun</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-855 text-slate-900 dark:text-slate-100 font-semibold px-4 py-2.5 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-500 shadow-sm"
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
                        <span>Copy ID Pesanan</span>
                      </button>

                      <select
                        value={orderYearFilter}
                        onChange={(e) => setOrderYearFilter(e.target.value)}
                        className="w-full bg-slate-950 dark:bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold px-4 py-3 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-500 shadow-sm transition-all"
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
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-200 dark:text-slate-350'
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
                        className="w-full bg-slate-950 dark:bg-slate-950 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold px-4 py-3 rounded-xl text-xs outline-none cursor-pointer focus:border-indigo-500 shadow-sm transition-all"
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
                                <th className="py-4 px-4 text-center">Start Count</th>
                                <th className="py-4 px-4">Tanggal & Waktu</th>
                                <th className="py-4 px-4 text-left">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850/40 text-xs">
                              {currentPageOrders.map(order => {
                                const isSelected = selectedOrderIds.includes(order.id);
                                return (
                                  <tr key={order.id} className={`transition-colors ${isSelected ? 'bg-indigo-500/5 dark:bg-rose-50/80 dark:bg-rose-950/15' : 'hover:bg-slate-900/30'}`}>
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
                                          className="bg-slate-800 hover:bg-slate-700 text-slate-400 p-1 transition-colors cursor-pointer flex items-center justify-center border-l border-slate-750 w-7 h-7"
                                          title="Salin ID Pesanan"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                    <td className="py-4 px-4">
                                      <span className="font-semibold text-slate-200">{order.service_name}</span>
                                      <span className="block text-[10px] text-slate-500 mt-0.5">{order.category}</span>
                                    </td>
                                    <td className="py-4 px-4 font-mono text-slate-400 max-w-xs truncate">
                                      <a href={order.target_url} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-rose-400 hover:underline">
                                        {order.target_url}
                                      </a>
                                    </td>
                                    <td className="py-4 px-4 text-right font-medium text-slate-300">{order.quantity.toLocaleString()}</td>
                                    <td className="py-4 px-4 text-right font-semibold text-slate-200">{formatPrice(order.total_price)}</td>
                                    <td className="py-4 px-4 text-center">
                                      <div className="flex flex-col items-center gap-1.5 justify-center">
                                        <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wide inline-block ${getOrderStatusBadgeClass(order.status)}`}>
                                          {order.status === 'failed' ? 'ERROR' : order.status}
                                        </span>
                                        {order.payment_status === 'unpaid' && (
                                          <button
                                            onClick={() => handlePayOrderWithBalance(order)}
                                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold text-white transition-all shadow-sm shadow-indigo-600/25 active:scale-95 cursor-pointer whitespace-nowrap"
                                          >
                                            Bayar via Saldo
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-4 px-4 text-center font-mono text-slate-400">
                                      {order.start_count ? order.start_count.toLocaleString() : '-'}
                                    </td>
                                    <td className="py-4 px-4 text-slate-500">
                                      {new Date(order.created_at).toLocaleString('id-ID', {
                                        dateStyle: 'medium',
                                        timeStyle: 'short'
                                      })}
                                    </td>
                                    <td className="py-4 px-4 text-left">
                                      <div className="flex items-center justify-start gap-2">
                                        <button
                                          onClick={() => setSelectedOrderDetail(order)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-md shadow-indigo-600/15"
                                        >
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
                                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                            >
                                              <Printer className="w-3 h-3" />
                                              <span>Invoice</span>
                                            </button>
                                            <button
                                              onClick={() => handleReorder(order)}
                                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-md shadow-emerald-500/10"
                                            >
                                              <RefreshCw className="w-3 h-3" />
                                              <span>Pesan Lagi</span>
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
                                      <span className="font-mono text-slate-500 dark:text-slate-450">{order.start_count ? order.start_count.toLocaleString() : '-'}</span>
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
                        <span className="text-xs text-slate-500 font-medium">
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
            {/* Transaction History Tab */}
            {activeTab === 'transactions' && (() => {
              const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;

              // Calculate topup stats
              const successfulDeposits = transactions.filter(tx => tx.type === 'topup' && tx.status === 'success');
              const failedDeposits = transactions.filter(tx => tx.type === 'topup' && tx.status === 'failed');

              const totalSuccessCount = successfulDeposits.length;
              const totalSuccessAmount = successfulDeposits.reduce((sum, tx) => sum + Number(tx.amount), 0);

              const totalFailedCount = failedDeposits.length;
              const totalFailedAmount = failedDeposits.reduce((sum, tx) => sum + Number(tx.amount), 0);

              return (
                <div className="bg-slate-900 border border-slate-800/80 shadow-sm rounded-3xl p-3.5 sm:p-8 backdrop-blur-md">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    <span>Riwayat Transaksi</span>
                  </h2>

                  {/* Stats Cards */}
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    {/* Successful Deposit Card */}
                    <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl flex items-center gap-4 transition-all hover:border-emerald-500/20">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">Total Deposit Berhasil</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-extrabold text-emerald-450">{formatPrice(totalSuccessAmount)}</span>
                          <span className="text-[11px] font-medium text-slate-500">({totalSuccessCount} Transaksi)</span>
                        </div>
                      </div>
                    </div>

                    {/* Failed Deposit Card */}
                    <div className="bg-slate-950/30 border border-slate-850 p-5 rounded-2xl flex items-center gap-4 transition-all hover:border-rose-500/20">
                      <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-0.5">Total Deposit Gagal</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-extrabold text-rose-400">{formatPrice(totalFailedAmount)}</span>
                          <span className="text-[11px] font-medium text-slate-500">({totalFailedCount} Transaksi)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Redesigned Premium Filters Bar (Matching User Screenshot with Labels) */}
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    {/* Pencarian */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Cari Transaksi</label>
                      <div className="flex gap-2">
                        <select
                          value={txSearchType}
                          onChange={(e) => setTxSearchType(e.target.value)}
                          className="bg-slate-950 border border-slate-805 focus:border-indigo-500 text-slate-200 px-3 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold shrink-0"
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
                            className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-200 pl-4 pr-10 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
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

                    {/* Filter Tahun */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Tahun</label>
                      <select
                        value={txYearFilter}
                        onChange={(e) => setTxYearFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                      >
                        <option value="2026">2026</option>
                        <option value="2025">2025</option>
                        <option value="2024">2024</option>
                        <option value="all">Semua Tahun</option>
                      </select>
                    </div>

                    {/* Filter Metode Pembayaran */}
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Metode Pembayaran</label>
                      <select
                        value={txMethodFilter}
                        onChange={(e) => setTxMethodFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
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
                      <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Status Pembayaran</label>
                      <select
                        value={txStatusFilter}
                        onChange={(e) => setTxStatusFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-855 focus:border-indigo-500 text-slate-200 px-4 py-2.5 rounded-xl outline-none transition-colors text-xs font-semibold"
                      >
                        <option value="all">Semua Status</option>
                        <option value="pending">Belum Dibayar</option>
                        <option value="failed">Dibatalkan</option>
                        <option value="success">Sukses</option>
                      </select>
                    </div>
                  </div>

                  {filteredTxs.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 font-light flex flex-col items-center justify-center gap-2">
                      <CreditCard className="w-10 h-10 text-slate-600 mb-2" />
                      <p>Tidak ada riwayat transaksi dengan kriteria ini.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop View */}
                      <div className="hidden md:block overflow-x-auto scrollbar-thin">
                        <table className="w-full min-w-[750px] text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 text-slate-450 text-xs font-semibold uppercase tracking-wider">
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
                            {filteredTxs
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

                                // Calculate credited amount with potential bonus for topup
                                let creditedAmount = Number(tx.amount);
                                let baseAmount = Number(tx.amount);

                                if (tx.type === 'topup') {
                                  const bonusMin = parseInt(siteSettings.deposit_bonus_min) || 10000;
                                  const bonusPercent = parseInt(siteSettings.deposit_bonus_percent) || 0;
                                  const hasBonus = tx.status === 'success' && baseAmount >= bonusMin && bonusPercent > 0;
                                  const bonusAmount = hasBonus ? Math.round(baseAmount * bonusPercent / 100) : 0;
                                  creditedAmount = baseAmount + bonusAmount;
                                }

                                return (
                                  <tr key={tx.id} className="hover:bg-slate-900/30 transition-colors">
                                    <td className="py-4 px-4 font-mono text-slate-400">
                                      {tx.tx_id ? `TRX-${tx.tx_id}` : tx.id.slice(0, 6)}
                                    </td>
                                    <td className="py-4 px-4 text-slate-500">{dateStr}</td>
                                    <td className="py-4 px-4 font-medium text-slate-600 dark:text-slate-400">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold">{formatPaymentMethod(tx.payment_method)}</span>
                                        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-950/45 border border-slate-850 uppercase font-mono">
                                          {tx.type}
                                        </span>
                                      </div>
                                      {tx.description && (
                                        <div className="text-[10px] text-slate-500 mt-1 max-w-[320px] leading-relaxed font-light">{tx.description}</div>
                                      )}
                                    </td>
                                    {/* SALDO DIDAPAT */}
                                    <td className={`py-4 px-4 font-bold text-sm ${isAddition ? 'text-emerald-500' : 'text-red-450'
                                      }`}>
                                      {isAddition ? '+' : '-'}{formatPrice(Math.abs(tx.type === 'topup' ? creditedAmount : baseAmount))}
                                    </td>
                                    {/* TOTAL BAYAR */}
                                    <td className="py-4 px-4 font-extrabold text-sm text-slate-100">

                                      {tx.type === 'topup' ? formatPrice(Math.abs(baseAmount)) :
                                        tx.type === 'refund' ? 'Rp 0' :
                                          `-${formatPrice(Math.abs(baseAmount))}`}
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider inline-block ${tx.status === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold shadow-sm shadow-emerald-500/30' :
                                        tx.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold shadow-sm shadow-rose-500/30' :
                                          'bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/30'
                                        }`}>
                                        {tx.status === 'success' ? 'Sukses' :
                                          tx.status === 'failed' ? 'Dibatalkan' :
                                            'Belum Dibayar'}
                                      </span>
                                    </td>
                                    <td className="py-4 px-4">
                                      <div className="flex items-center justify-start gap-2">
                                        <button
                                          onClick={() => setSelectedTxDetail(tx)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                                        >
                                          <span>Detail</span>
                                        </button>
                                        {tx.status === 'success' && (
                                          <button
                                            onClick={() => setSelectedInvoiceDetail({
                                              type: tx.type === 'topup' ? 'topup' : 'order',
                                              id: tx.tx_id ? `TRX-${tx.tx_id}` : tx.id,
                                              amount: tx.amount,
                                              date: tx.created_at,
                                              method: formatPaymentMethod(tx.payment_method),
                                              description: tx.type === 'topup' ? 'Top Up Saldo Akun' : tx.type === 'refund' ? 'Refund Saldo Pesanan' : 'Pembayaran Layanan SMM',
                                              status: tx.status
                                            })}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-[10px] font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                          >
                                            <Printer className="w-3 h-3" />
                                            <span>Invoice</span>
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

                      {/* Mobile View (Responsive Card List) */}
                      <div className="block md:hidden space-y-3.5">
                        {filteredTxs
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
                              const hasBonus = tx.status === 'success' && baseAmount >= bonusMin && bonusPercent > 0;
                              const bonusAmount = hasBonus ? Math.round(baseAmount * bonusPercent / 100) : 0;
                              creditedAmount = baseAmount + bonusAmount;
                            }

                            return (
                              <div key={tx.id} className="bg-white dark:bg-slate-900/40 border border-zinc-200 dark:border-slate-800 p-4 sm:p-5 rounded-[24px] space-y-4 shadow-md shadow-zinc-200/60 dark:shadow-none transition-all">
                                <div className="flex justify-between items-center text-[10px] gap-2">
                                  <span className="font-mono font-extrabold text-indigo-600 dark:text-indigo-500 dark:text-indigo-400">
                                    {tx.tx_id ? `TRX-${tx.tx_id}` : tx.id.slice(0, 6)}
                                  </span>
                                  <span className="text-slate-400 dark:text-slate-500 font-medium">{dateStr}</span>
                                </div>

                                <div className="border-t border-b border-slate-200/60 dark:border-slate-900/40 py-3 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-extrabold text-slate-100 dark:text-slate-200">{formatPaymentMethod(tx.payment_method)}</span>
                                    <span className="text-[8px] font-extrabold bg-rose-50/80 dark:bg-rose-950/15 text-rose-600 dark:text-rose-455 dark:text-indigo-500 dark:text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded-lg uppercase tracking-widest font-mono">
                                      {tx.type}
                                    </span>
                                  </div>
                                  {tx.description && (
                                    <div className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed font-normal">{tx.description}</div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black block mb-0.5">Saldo Didapat</span>
                                    <span className={`font-extrabold text-xs ${isAddition ? 'text-emerald-600' : 'text-indigo-500'}`}>
                                      {isAddition ? '+' : '-'}{formatPrice(Math.abs(tx.type === 'topup' ? creditedAmount : baseAmount))}
                                    </span>
                                  </div>                              <div>
                                    <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black block mb-0.5">Total Bayar</span>
                                    <span className="font-extrabold text-xs text-slate-100">
                                      {tx.type === 'topup' ? formatPrice(Math.abs(baseAmount)) :
                                        tx.type === 'refund' ? 'Rp 0' :
                                          `-${formatPrice(Math.abs(baseAmount))}`}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-slate-200/60 dark:border-slate-900/40 gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest inline-block ${tx.status === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold shadow-sm shadow-emerald-500/30' :
                                    tx.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold shadow-sm shadow-rose-500/30' :
                                      'bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/30'
                                    }`}>
                                    {tx.status === 'success' ? 'Sukses' :
                                      tx.status === 'failed' ? 'Dibatalkan' :
                                        'Belum Dibayar'}
                                  </span>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setSelectedTxDetail(tx)}
                                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-white text-[10px] font-black transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-md shadow-indigo-600/10"
                                    >
                                      <span>Detail</span>
                                    </button>
                                    {tx.status === 'success' && (
                                      <button
                                        onClick={() => setSelectedInvoiceDetail({
                                          type: tx.type === 'topup' ? 'topup' : 'order',
                                          id: tx.tx_id ? `TRX-${tx.tx_id}` : tx.id,
                                          amount: tx.amount,
                                          date: tx.created_at,
                                          method: formatPaymentMethod(tx.payment_method),
                                          description: tx.type === 'topup' ? 'Top Up Saldo Akun' : tx.type === 'refund' ? 'Refund Saldo Pesanan' : 'Pembayaran Layanan SMM',
                                          status: tx.status
                                        })}
                                        className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-zinc-50 dark:hover:bg-slate-700 text-black dark:text-slate-200 text-[10px] font-extrabold transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-sm border border-zinc-300 dark:border-slate-700"
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

                      {filteredTxs.length > itemsPerPage && (
                        <div className="flex justify-between items-center gap-2 pt-5 border-t border-slate-850 mt-5">
                          <button
                            type="button"
                            disabled={transactionsPage === 1}
                            onClick={() => setTransactionsPage(prev => Math.max(1, prev - 1))}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-850 text-slate-350 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Sebelumnya
                          </button>
                          <span className="text-xs text-slate-500 font-medium">
                            Menampilkan {((transactionsPage - 1) * itemsPerPage) + 1} - {Math.min(transactionsPage * itemsPerPage, filteredTxs.length)} dari {filteredTxs.length} transaksi
                          </span>
                          <button
                            type="button"
                            disabled={transactionsPage >= Math.ceil(filteredTxs.length / itemsPerPage)}
                            onClick={() => setTransactionsPage(prev => prev + 1)}
                            className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 disabled:opacity-40 disabled:hover:border-slate-850 text-slate-350 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
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
                          className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
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
                              className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-zinc-500 dark:text-slate-400 uppercase tracking-wider mb-2">Permintaan</label>
                            <select
                              required
                              value={ticketRequestType}
                              onChange={(e) => setTicketRequestType(e.target.value)}
                              className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
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
                            className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
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
                          className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold text-zinc-500 dark:text-slate-400 uppercase tracking-wider mb-2">Gambar <span className="text-zinc-400 dark:text-slate-500">*Tidak wajib</span></label>
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
                          className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 px-4 py-3 rounded-2xl outline-none text-xs"
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
                          className="w-full bg-zinc-50 dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 focus:border-indigo-500 text-zinc-800 dark:text-slate-200 pl-4 pr-10 py-3 rounded-2xl outline-none text-xs"
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
                        <tr className="bg-zinc-50 dark:bg-slate-955 border-b border-zinc-150 dark:border-slate-850 text-zinc-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
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
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-md shadow-indigo-600/15"
                                >
                                  <span>{ticket.status === 'Closed' ? 'Lihat' : 'Balas'}</span>
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
          </main>
        </div>
      </div>

      {/* Floating Bottom Navigation Bar - Mobile only */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 px-1 print:hidden">
        <nav className="bg-slate-900/80 dark:bg-slate-950/80 border border-slate-205 dark:border-slate-850 backdrop-blur-xl px-2.5 py-2.5 rounded-2xl flex justify-around items-center shadow-xl shadow-indigo-500/5">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'order', label: 'Pesan', icon: ShoppingBag },
            { id: 'history', label: 'Pesanan', icon: History, action: () => fetchOrders(user?.id) },
            { id: 'transactions', label: 'Deposit', icon: CreditCard, action: () => fetchProfileAndTransactions(user?.id) },
            { id: 'tickets', label: 'Tiket', icon: MessageSquare, action: () => fetchTickets() },
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
                onClick={() => setShowTopupModal(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-slate-350 transition-colors p-2 hover:bg-slate-850 rounded-xl"
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
                  className="p-1 rounded-md bg-slate-950 hover:bg-rose-50/80 dark:bg-rose-950/15 hover:text-indigo-500 dark:text-indigo-400 transition-all cursor-pointer text-slate-500 shrink-0"
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
                      <li>Jika permintaan deposit tidak dibayar dalam waktu lebih dari <strong className="text-slate-350 font-semibold">24 jam</strong>, maka permintaan deposit akan <strong className="text-red-400/90 font-bold">otomatis dibatalkan (Failed)</strong>.</li>
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
                        className="w-full bg-slate-950/40 border border-slate-800 text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 px-5 pl-12 py-4 rounded-2xl outline-none transition-all text-sm font-semibold"
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
                        className="w-full bg-slate-950/40 border border-slate-800 text-slate-200 pl-12 pr-5 py-4 rounded-2xl outline-none text-sm font-extrabold"
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
                        className="bg-slate-950/40 dark:bg-slate-955 border border-slate-850 hover:border-indigo-500/40 hover:bg-indigo-500/5 py-3.5 rounded-2xl text-xs font-extrabold transition-all text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 cursor-pointer text-center flex items-center justify-center hover:scale-102 active:scale-98"
                      >
                        +{formatPrice(amount).replace('Rp', '').trim()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 text-xs text-indigo-800 dark:text-slate-350 flex items-start gap-3 leading-relaxed">
                  <Info className="w-5 h-5 text-indigo-500 dark:text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white text-zinc-900 border border-zinc-200 p-6 sm:p-8 rounded-[32px] shadow-2xl relative animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                {selectedAnnouncement.badge && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-200/50">
                    {selectedAnnouncement.badge}
                  </span>
                )}
                <span className="text-[10px] text-zinc-400 font-bold">
                  {new Date(selectedAnnouncement.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-extrabold text-zinc-950 mb-4 tracking-tight leading-snug">{selectedAnnouncement.title}</h3>

            {/* Image Banner if exists */}
            {selectedAnnouncement.image_url && (
              <div
                className="w-full h-48 sm:h-64 md:h-72 relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-200/80 mb-4 cursor-zoom-in group"
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

            {/* Body Content */}
            <div className="max-h-56 overflow-y-auto pr-2 text-zinc-700 text-xs sm:text-sm font-light leading-relaxed whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-200 mb-6">
              {selectedAnnouncement.content}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-zinc-150 flex justify-end">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                Tutup
              </button>
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
                  const hasBonus = selectedTxDetail.status === 'success' && baseAmount >= bonusMin && bonusPercent > 0;
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
                <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                  <span className="text-slate-550 dark:text-slate-500 font-light">Order ID</span>
                  <span className="font-mono font-semibold text-slate-200">{selectedOrderDetail.id}</span>
                </div>

                <div className="flex justify-between items-center py-2.5 border-b border-slate-850/60">
                  <span className="text-slate-550 dark:text-slate-500 font-light">Layanan</span>
                  <span className="font-bold text-slate-200">{selectedOrderDetail.service_name}</span>
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
                        className="w-full bg-slate-950 dark:bg-slate-955 border border-slate-850 text-slate-900 dark:text-slate-100 focus:border-indigo-500 pl-4 pr-10 py-2.5 rounded-xl outline-none transition-all text-xs"
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
                        className="w-full bg-slate-955 dark:bg-slate-955 border border-slate-850 text-slate-900 dark:text-slate-100 focus:border-indigo-500 pl-4 pr-10 py-2.5 rounded-xl outline-none transition-all text-xs"
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
                        className="w-full bg-slate-955 dark:bg-slate-955 border border-slate-850 text-slate-900 dark:text-slate-100 focus:border-indigo-500 pl-4 pr-10 py-2.5 rounded-xl outline-none transition-all text-xs"
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
    </div>
  );
}
