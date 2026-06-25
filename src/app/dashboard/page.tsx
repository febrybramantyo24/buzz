'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import { Service, Order, Announcement, Transaction } from '@/lib/types';
import PremiumThemeToggle from '@/components/PremiumThemeToggle';
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
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function UserDashboard() {
  const router = useRouter();
  
  // User state
  const [user, setUser] = useState<any>(null);
  
  // Data state
  const [services, setServices] = useState<Service[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
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
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [activeTab, setActiveTab] = useState<'order' | 'history' | 'transactions'>('order');
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
    onConfirm: () => {}
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ show: true, message, type });
    // Clear notification after 4 seconds
    setTimeout(() => {
      setNotification(prev => prev.message === message ? { ...prev, show: false } : prev);
    }, 4500);
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

      // Fetch Services, Announcements, Orders, Wallet Profile
      await Promise.all([
        fetchServices(),
        fetchAnnouncements(),
        fetchOrders(session.user.id),
        fetchProfileAndTransactions(session.user.id)
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
      } else {
        const localBalance = localStorage.getItem(`balance_${userId}`);
        setBalance(localBalance ? Number(localBalance) : 100000);
      }

      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      const dbTxs = (txData || []).filter((t: any) => t.status !== 'failed');
      const storedTx = localStorage.getItem(`transactions_${userId}`);
      const localTxs = (storedTx ? JSON.parse(storedTx) : []).filter((t: any) => t.status !== 'failed');

      if (dbTxs.length === 0 && localTxs.length === 0) {
        const initialMock: Transaction[] = [
          {
            id: 'TX-1',
            user_id: userId,
            amount: 100000,
            type: 'topup',
            status: 'success',
            payment_method: 'qris',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString()
          }
        ];
        setTransactions(initialMock);
        localStorage.setItem(`transactions_${userId}`, JSON.stringify(initialMock));
      } else {
        const mergedTxs = [...dbTxs];
        localTxs.forEach((ltx: Transaction) => {
          if (!mergedTxs.some(t => t.id === ltx.id)) {
            mergedTxs.push(ltx);
          }
        });
        mergedTxs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTransactions(mergedTxs);
      }
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
        setServices(data);
        const uniqueCategories = Array.from(new Set(data.map((s: Service) => s.category)));
        setCategories(uniqueCategories);
        if (uniqueCategories.length > 0) {
          setSelectedCategory(uniqueCategories[0]);
        }
      } else {
        // Fallback Mock services if empty or no tables
        const mock = getMockServices();
        setServices(mock);
        const uniqueCategories = Array.from(new Set(mock.map(s => s.category)));
        setCategories(uniqueCategories);
        if (uniqueCategories.length > 0) {
          setSelectedCategory(uniqueCategories[0]);
        }
      }
    } catch (err) {
      console.error(err);
      const mock = getMockServices();
      setServices(mock);
      const uniqueCategories = Array.from(new Set(mock.map(s => s.category)));
      setCategories(uniqueCategories);
      if (uniqueCategories.length > 0) {
        setSelectedCategory(uniqueCategories[0]);
      }
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error(err);
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

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error(err);
      // Retrieve mock orders if DB not complete
      const stored = localStorage.getItem(`orders_${userId}`);
      if (stored) {
        setOrders(JSON.parse(stored));
      }
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

  // Top Up Wallet via Midtrans
  const handleInitiateTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topupAmount < 10000) {
      showToast('Minimal top up adalah Rp 10.000', 'error');
      return;
    }

    // Check if there is already a pending top up to prevent clutter
    const dbPending = transactions.some(t => t.type === 'topup' && t.status === 'pending');
    if (dbPending) {
      showToast('Anda masih memiliki transaksi top-up yang pending. Silakan bayar melalui Riwayat Transaksi atau batalkan terlebih dahulu.', 'info');
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
          onPending: function (snapResult: any) {
            console.log('Topup payment pending', snapResult);
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

            const storedTx = localStorage.getItem(`transactions_${user.id}`);
            if (storedTx) {
              const txList = JSON.parse(storedTx);
              const updated = txList.map((t: any) => t.id === tx.id ? { ...t, status: 'success' } : t);
              setTransactions(updated);
              localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updated));
              
              const newLocalBalance = balance + tx.amount;
              setBalance(newLocalBalance);
              localStorage.setItem(`balance_${user.id}`, String(newLocalBalance));
            } else {
              await fetchProfileAndTransactions(user.id);
            }

            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.5 }
            });
            showToast('Top Up berhasil! Saldo Anda telah ditambahkan.', 'success');
          },
          onPending: function () {
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
      message: 'Apakah Anda yakin ingin membatalkan transaksi top-up ini? Data transaksi akan dihapus secara permanen.',
      onConfirm: async () => {
        setLoading(true);
        try {
          // Delete from DB directly instead of marking as failed
          await supabase
            .from('transactions')
            .delete()
            .eq('id', tx.id);

          // Update Local
          const storedTx = localStorage.getItem(`transactions_${user.id}`);
          if (storedTx) {
            const txList = JSON.parse(storedTx);
            const updated = txList.filter((t: any) => t.id !== tx.id);
            setTransactions(updated.filter((t: any) => t.status !== 'failed'));
            localStorage.setItem(`transactions_${user.id}`, JSON.stringify(updated));
          } else {
            await fetchProfileAndTransactions(user.id);
          }
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
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

  // Filter & Search Logic
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.service_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.target_url.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
        <span className="mt-4 text-slate-400 text-sm">Menyiapkan dashboard Anda...</span>
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
              Sosial<span className="text-indigo-400">Buzz</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <PremiumThemeToggle />
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 font-medium">{user?.email}</span>
            </div>
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

        {/* Wallet and Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Balance Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/50 to-slate-900/90 border border-indigo-500/20 p-6 rounded-3xl flex flex-col justify-between backdrop-blur-md">
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 blur-3xl rounded-full"></div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold text-indigo-300/80 uppercase tracking-wider">Saldo Anda</span>
                <div className="text-3xl font-extrabold text-slate-100 mt-1">{formatPrice(balance)}</div>
              </div>
              <div className="bg-indigo-500/15 p-3 rounded-2xl border border-indigo-500/20 text-indigo-400 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-5">
              <button
                onClick={() => setShowTopupModal(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Top Up Saldo</span>
              </button>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl flex items-center justify-between backdrop-blur-md">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pesanan</span>
              <div className="text-3xl font-extrabold text-slate-150 mt-1">{orders.length}</div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-750 text-slate-400 shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          {/* Active Orders Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl flex items-center justify-between backdrop-blur-md">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Layanan Aktif</span>
              <div className="text-3xl font-extrabold text-slate-150 mt-1">
                {orders.filter(o => o.status === 'processing' || o.status === 'inprogress').length}
              </div>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-750 text-slate-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>
        
        {/* Recommendation announcements cards */}
        {announcements.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {announcements.map(ann => (
              <div key={ann.id} className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 p-6 rounded-3xl flex gap-4 items-start">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl rounded-full"></div>
                <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20 text-indigo-400 mt-1 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {ann.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-500 text-white uppercase tracking-wider">
                        {ann.badge}
                      </span>
                    )}
                    <h3 className="font-bold text-sm text-slate-100">{ann.title}</h3>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-light mt-1.5">{ann.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex gap-2 mb-8 border-b border-slate-900 pb-4">
          <button
            onClick={() => setActiveTab('order')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'order'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Pesan Orderan</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              fetchOrders(user.id);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Orderan</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('transactions');
              fetchProfileAndTransactions(user.id);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'transactions'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Riwayat Transaksi</span>
          </button>
        </div>

        {/* Order Form Tab */}
        {activeTab === 'order' && (
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            
            {/* Form Card */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 p-6 sm:p-8 rounded-3xl backdrop-blur-md">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                <span>Formulir Pemesanan</span>
              </h2>

              {formError && (
                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kategori</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3.5 rounded-2xl outline-none transition-colors text-sm"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Service Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Layanan</label>
                    <select
                      value={selectedService?.id || ''}
                      onChange={(e) => {
                        const found = services.find(s => s.id === e.target.value);
                        setSelectedService(found || null);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3.5 rounded-2xl outline-none transition-colors text-sm"
                    >
                      {services
                        .filter(s => s.category === selectedCategory)
                        .map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                    </select>
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
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3.5 rounded-2xl outline-none transition-colors text-sm"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Quantity Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jumlah Pesanan</label>
                    <input
                      type="number"
                      required
                      min={selectedService?.min_order || 1}
                      max={selectedService?.max_order || 1000000}
                      value={quantity || ''}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                      placeholder="Contoh: 1000"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 px-4 py-3.5 rounded-2xl outline-none transition-colors text-sm"
                    />
                  </div>

                  {/* Calculations Display */}
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Harga per 1.000 (1K)</span>
                      <div className="text-base font-bold text-slate-200">
                        {selectedService ? formatPrice(selectedService.price_per_k) : 'IDR 0'}
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-900 flex justify-between items-end">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Harga</span>
                      <span className="text-lg font-extrabold text-indigo-400">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Validation helper info */}
                {selectedService && (
                  <div className="space-y-4">
                    {selectedService.description && (
                      <div className="relative overflow-hidden p-4 rounded-2xl bg-slate-950/40 border border-indigo-500/20 dark:border-indigo-500/30 text-xs shadow-md">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-xl pointer-events-none" />
                        <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-850">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="font-extrabold text-[10px] text-indigo-400 uppercase tracking-wider">Deskripsi Layanan</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed font-light whitespace-pre-wrap pl-0.5">{selectedService.description}</p>
                      </div>
                    )}
                    
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-400 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                      <div>
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
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
                >
                  {submittingOrder ? 'Membuat Permintaan...' : 'Buat Permintaan & Bayar'}
                </button>
              </form>
            </div>

            {/* Sidebar Guidelines */}
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl">
                <h3 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <span>Petunjuk Penting</span>
                </h3>
                <ul className="space-y-3.5 text-xs text-slate-400 font-light leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>Pastikan akun target atau postingan Anda dalam kondisi <strong>publik</strong> (tidak dikunci/private).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>Jangan melakukan order ganda untuk satu target/link yang sama sebelum order sebelumnya dinyatakan sukses.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>Pengisian data jumlah awal (start count) dilakukan otomatis oleh system / admin pada awal proses buzzer berjalan.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* History Order List Tab */}
        {activeTab === 'history' && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
            
            {/* Table Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan ID, Layanan, atau URL Target..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 pl-11 pr-4 py-3 rounded-2xl outline-none transition-colors text-sm"
                />
              </div>

              {/* Status selectors */}
              <div className="flex flex-wrap gap-1.5">
                {['all', 'pending', 'processing', 'inprogress', 'success'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      statusFilter === status
                        ? 'bg-slate-800 text-white border border-slate-700'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {status === 'all' ? 'Semua' : status}
                  </button>
                ))}
              </div>
            </div>

            {/* List Table */}
            {filteredOrders.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-light flex flex-col items-center justify-center gap-2">
                <History className="w-10 h-10 text-slate-600 mb-2" />
                <p>Tidak ada riwayat orderan ditemukan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-450 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-4">Order ID</th>
                      <th className="py-4 px-4">Layanan</th>
                      <th className="py-4 px-4">Target URL</th>
                      <th className="py-4 px-4 text-right">Jumlah</th>
                      <th className="py-4 px-4 text-right">Harga</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4 text-right">Start Count</th>
                      <th className="py-4 px-4">Tanggal & Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-xs">
                    {filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-4 px-4 font-mono text-slate-400">#{order.id.slice(0, 8)}</td>
                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-200">{order.service_name}</span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">{order.category}</span>
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-400 max-w-xs truncate">
                          <a href={order.target_url} target="_blank" rel="noreferrer" className="hover:text-indigo-400 hover:underline">
                            {order.target_url}
                          </a>
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-slate-300">{order.quantity.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right font-semibold text-indigo-400">{formatPrice(order.total_price)}</td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide inline-block ${
                              order.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              order.status === 'inprogress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              order.status === 'processing' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {order.status}
                            </span>
                            {order.payment_status === 'unpaid' && (
                              <button
                                onClick={() => handlePayOrderWithBalance(order)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold text-white transition-all shadow-sm shadow-indigo-600/25 active:scale-95 cursor-pointer whitespace-nowrap"
                              >
                                Bayar via Saldo
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-slate-400">
                          {order.start_count ? order.start_count.toLocaleString() : '-'}
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {new Date(order.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Transaction History Tab */}
        {activeTab === 'transactions' && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <span>Daftar Transaksi Akun</span>
            </h2>

            {transactions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-light flex flex-col items-center justify-center gap-2">
                <CreditCard className="w-10 h-10 text-slate-600 mb-2" />
                <p>Belum ada riwayat transaksi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-850 text-slate-450 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-4">Transaction ID</th>
                      <th className="py-4 px-4">Tipe</th>
                      <th className="py-4 px-4">Jumlah</th>
                      <th className="py-4 px-4">Metode</th>
                      <th className="py-4 px-4">Referensi</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4">Tanggal & Waktu</th>
                      <th className="py-4 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="py-4 px-4 font-mono text-slate-400">#{tx.id.slice(0, 8)}</td>
                        <td className="py-4 px-4 font-medium">
                          {tx.type === 'topup' ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Top Up Saldo
                            </span>
                          ) : tx.type === 'refund' ? (
                            <span className="text-blue-400 flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Refund
                            </span>
                          ) : (
                            <span className="text-slate-350 flex items-center gap-1">
                              <ArrowDownRight className="w-3.5 h-3.5" /> Pembayaran Order
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-bold">
                          <span className={tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}>
                            {tx.amount > 0 ? '+' : ''}{formatPrice(tx.amount)}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-400 uppercase">{tx.payment_method || '-'}</td>
                        <td className="py-4 px-4 font-mono text-slate-550">
                          {tx.reference_id ? `#${tx.reference_id.slice(0, 8)}` : '-'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block ${
                            tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            tx.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500">
                          {new Date(tx.created_at).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {tx.type === 'topup' && tx.status === 'pending' ? (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handlePayPendingTopup(tx)}
                                className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-[10px] font-extrabold text-white transition-all shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                              >
                                Bayar
                              </button>
                              <button
                                onClick={() => handleCancelPendingTopup(tx)}
                                className="px-3 py-1 rounded-xl bg-slate-950 hover:bg-red-600/20 text-slate-400 hover:text-red-400 border border-slate-850 hover:border-red-500/20 text-[10px] font-extrabold transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-600 font-mono">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Top Up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative">
            <button
              onClick={() => setShowTopupModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-400" />
              <span>Top Up Saldo Akun</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6 font-light">
              Isi ulang saldo instan melalui gerbang pembayaran Midtrans. Minimal top up Rp 10.000.
            </p>

            <form onSubmit={handleInitiateTopup} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Jumlah Nominal (IDR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">Rp</span>
                  <input
                    type="number"
                    required
                    min={10000}
                    placeholder="Contoh: 50000"
                    value={topupAmount || ''}
                    onChange={(e) => setTopupAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-200 pl-11 pr-4 py-3.5 rounded-2xl outline-none transition-colors text-sm font-semibold"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[20000, 50000, 100000].map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTopupAmount(amount)}
                      className="bg-slate-950 border border-slate-850 hover:border-indigo-500/50 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-slate-900/60"
                    >
                      +{formatPrice(amount).replace('Rp', '')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-slate-450 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Pembayaran Anda akan diproses secara instan & aman. QRIS, e-wallet, dan Bank Transfer didukung.</span>
              </div>

              <button
                type="submit"
                disabled={submittingTopup || topupAmount < 10000}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                {submittingTopup ? 'Menghubungkan...' : 'Bayar Sekarang'}
              </button>
            </form>
          </div>
        </div>
      )}

      <Script
        src={
          process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
            ? 'https://app.midtrans.com/snap/snap.js'
            : (process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'false'
                ? 'https://app.sandbox.midtrans.com/snap/snap.js'
                : ((process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '').startsWith('SB-Mid-')
                    ? 'https://app.sandbox.midtrans.com/snap/snap.js'
                    : 'https://app.midtrans.com/snap/snap.js'))
        }
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      {/* Premium Toast Notification */}
      {notification.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
          {notification.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
          <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">{notification.message}</span>
          <button 
            onClick={() => setNotification(prev => ({ ...prev, show: false }))} 
            className="text-slate-500 hover:text-slate-350 transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Premium Confirmation Dialog */}
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
    </div>
  );
}
