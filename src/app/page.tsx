'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dbClient as supabase } from '@/lib/db-client';
import { Service } from '@/lib/types';
import PremiumThemeToggle from '@/components/PremiumThemeToggle';
import { useBrand } from '@/components/DynamicBrandProvider';
import {
  Zap,
  ShieldCheck,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Activity,
  Heart,
  Eye,
  MessageSquare,
  Wallet,
  Headphones,
  Smartphone
} from 'lucide-react';

export default function LandingPage() {
  const { logoUrl, brandName } = useBrand();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [servicesPage, setServicesPage] = useState(1);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev === 3 ? 1 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchServicesAndSettings() {
      try {
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true);

        if (servicesError) throw servicesError;
        setServices(servicesData || []);
      } catch (err: any) {
        // eslint-disable-next-line no-console
        console.error('Error fetching services:', err?.message || err);
        // Add some mock services in case database tables are not yet created
        setServices([
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
            name: 'TikTok Views Video [Proses Cepat]',
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
          },
          {
            id: '6',
            category: 'YouTube',
            name: 'YouTube Watch Time hours [Safe 100%]',
            price_per_k: 180000,
            min_order: 100,
            max_order: 4000,
            is_active: true,
            created_at: ''
          }
        ]);
      }

      try {
        // Fetch site settings from server-side API
        const response = await fetch('/api/site-settings');
        if (response.ok) {
          const loaded = await response.json();
          setSettings(prev => ({ ...prev, ...loaded }));
        }
      } catch (err) {
        console.error('Error fetching site settings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchServicesAndSettings();
  }, []);

  useEffect(() => {
    setServicesPage(1);
  }, [selectedCategory]);

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))];

  const filteredServices = selectedCategory === 'All'
    ? services
    : services.filter(s => s.category === selectedCategory);

  const servicesItemsPerPage = 10;
  const totalPages = Math.ceil(filteredServices.length / servicesItemsPerPage);
  const displayedServices = filteredServices.slice((servicesPage - 1) * servicesItemsPerPage, servicesPage * servicesItemsPerPage);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'instagram':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'tiktok':
        return <Activity className="w-5 h-5 text-cyan-400" />;
      case 'youtube':
        return <Eye className="w-5 h-5 text-red-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-500" />;
    }
  };


  const renderRichText = (text: string) => {
    const parts = text.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <span key={index} className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden relative">
      {/* Background Glows (Mesh Gradients) */}
      <div className="absolute top-[-10%] left-[10%] w-[350px] h-[350px] rounded-full pointer-events-none opacity-[0.12] dark:opacity-[0.15] blur-[120px] bg-indigo-500 animate-pulse-glow"></div>
      <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] rounded-full pointer-events-none opacity-[0.08] dark:opacity-[0.12] blur-[140px] bg-purple-500"></div>
      <div className="absolute top-[45%] left-[-10%] w-[300px] h-[300px] rounded-full pointer-events-none opacity-[0.05] dark:opacity-[0.08] blur-[110px] bg-pink-500"></div>

      {/* Floating Header Navbar */}
      <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
        <header className="backdrop-blur-md bg-slate-950/60 dark:bg-slate-950/65 border border-slate-900/60 rounded-2xl shadow-xl transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 w-9 h-9 flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Zap className="w-5 h-5 text-white animate-pulse" />
                )}
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-250 to-indigo-400">
                {brandName === 'Buzzify' ? (
                  <>Buzz<span className="text-indigo-400">ify</span></>
                ) : (
                  brandName
                )}
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
              <a href="#features" className="hover:text-slate-100 transition-colors">Keunggulan</a>
              <a href="#services" className="hover:text-slate-100 transition-colors">Daftar Layanan</a>
              <a href="#how-it-works" className="hover:text-slate-100 transition-colors">Cara Kerja</a>
            </nav>

            <div className="flex items-center gap-3">
              <PremiumThemeToggle />
              <Link
                href="/login"
                className="text-xs sm:text-sm font-extrabold bg-white dark:bg-slate-900 hover:bg-zinc-55 dark:hover:bg-slate-800 border border-zinc-300 dark:border-slate-800 text-zinc-800 dark:text-slate-200 px-4 py-2 rounded-xl transition-all shadow-sm hover:-translate-y-0.5 active:scale-95 select-none"
              >
                Masuk
              </Link>
              <Link
                href="/login?tab=register"
                className="hidden sm:inline-flex text-xs sm:text-sm font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </header>
      </div>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 md:pt-24 md:pb-32 grid lg:grid-cols-12 gap-12 items-center">

        {/* Left side: Premium Call-to-Action Content */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {settings.hero_badge && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 backdrop-blur-md text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-indigo-400 mb-8 animate-float shadow-lg shadow-indigo-500/5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{settings.hero_badge}</span>
            </div>
          )}

          {settings.hero_title && (
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1] sm:leading-none animate-fade-in-up">
              {renderRichText(settings.hero_title)}
            </h1>
          )}

          {settings.hero_subtitle && (
            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl font-light leading-relaxed animate-fade-in-up animation-delay-100">
              {settings.hero_subtitle}
            </p>
          )}

          {(settings.hero_cta_text || settings.hero_cta_sub_text) && (
            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up animation-delay-200">
              {settings.hero_cta_text && (
                <Link
                  href="/login"
                  className="shimmer-btn flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1"
                >
                  <span>{settings.hero_cta_text}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              {settings.hero_cta_sub_text && (
                <a
                  href="#services"
                  style={{ color: 'var(--color-slate-50)' }}
                  className="flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-zinc-50 dark:hover:bg-slate-800/80 border-2 border-zinc-300 dark:border-slate-800 hover:text-black dark:hover:text-white font-black px-8 py-4 rounded-2xl transition-all shadow-sm active:scale-[0.98] select-none"
                >
                  {settings.hero_cta_sub_text}
                </a>
              )}
            </div>
          )}

          {(() => {
            const statsList = [
              { key: 'stats_orders', value: settings.stats_orders, label: 'Pesanan Sukses', colorClass: 'text-slate-100' },
              { key: 'stats_clients', value: settings.stats_clients, label: 'Pelanggan Aktif', colorClass: 'text-slate-100' },
              { key: 'stats_success', value: settings.stats_success, label: 'Keberhasilan', colorClass: 'text-indigo-400' },
              { key: 'stats_speed', value: services.length > 0 ? `${services.length}+` : (settings.stats_speed || '100+'), label: 'Total Layanan', colorClass: 'text-purple-400' }
            ].filter(stat => !!stat.value);

            if (statsList.length === 0) return null;

            return (
              <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 w-full bg-slate-900/30 backdrop-blur-sm border border-slate-900/60 p-6 sm:p-8 rounded-3xl premium-card-glow">
                {statsList.map((stat, idx) => (
                  <div
                    key={stat.key}
                    className="text-left"
                  >
                    <div className={`text-2xl sm:text-3xl font-extrabold ${stat.colorClass}`}>{stat.value}</div>
                    <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">{stat.label}</div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Right side: Modern Dribbble Mockups & SaaS Visualizations */}
        <div className="lg:col-span-5 relative w-full h-[350px] sm:h-[400px] lg:h-[480px] flex items-center justify-center mt-12 lg:mt-0 select-none">
          {/* Circular Glow Blobs */}
          <div className="absolute w-72 h-72 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl -top-10 -right-10 pointer-events-none"></div>
          <div className="absolute w-60 h-60 rounded-full bg-purple-500/10 dark:bg-purple-500/10 blur-3xl -bottom-10 -left-10 pointer-events-none"></div>

          {/* Core Mockup Container */}
          <div className="relative w-full max-w-sm sm:max-w-md h-full flex flex-col justify-center gap-4">

            {/* Card 1: Active Order Status Tracker (Premium Glassmorphism) */}
            <div className="absolute top-12 left-0 right-4 sm:right-8 z-20 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-4 rounded-2xl shadow-2xl hover:scale-[1.02] transition-transform duration-300">
              <div className="flex items-center justify-between mb-3 border-b border-slate-850 pb-2">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Live Order Booster</span>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Processing</span>
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-200">Instagram Followers</div>
                      <div className="text-[10px] text-slate-500">@creative_digital</div>
                    </div>
                  </div>
                  <span className="font-mono text-indigo-400 font-extrabold">84%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full w-[84%]"></div>
                </div>
              </div>
            </div>

            {/* Card 2: Interactive Statistics Growth Card */}
            <div className="absolute bottom-16 right-0 left-8 sm:left-12 z-10 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-5 rounded-3xl shadow-xl hover:scale-[1.02] transition-transform duration-300">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300">Monthly Interaction</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">+148.2%</span>
              </div>

              {/* Micro bar chart visualization */}
              <div className="flex items-end justify-between gap-2 h-16 pt-2">
                <div className="w-full bg-slate-800/50 rounded-md h-[40%] hover:bg-indigo-500 transition-colors duration-200"></div>
                <div className="w-full bg-slate-800/50 rounded-md h-[55%] hover:bg-indigo-500 transition-colors duration-200"></div>
                <div className="w-full bg-slate-800/50 rounded-md h-[70%] hover:bg-indigo-500 transition-colors duration-200"></div>
                <div className="w-full bg-slate-800/50 rounded-md h-[50%] hover:bg-indigo-500 transition-colors duration-200"></div>
                <div className="w-full bg-slate-850 rounded-md h-[80%] bg-gradient-to-t from-indigo-600 to-purple-500"></div>
                <div className="w-full bg-slate-800/50 rounded-md h-[60%] hover:bg-indigo-500 transition-colors duration-200"></div>
                <div className="w-full bg-slate-800/50 rounded-md h-[95%] hover:bg-indigo-500 transition-colors duration-200"></div>
              </div>
            </div>

            {/* Glowing platforms bubbles */}
            <div className="absolute top-1/2 left-[38%] -translate-y-1/2 w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg shadow-indigo-500/5 animate-bounce-slow">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>

          </div>
        </div>

      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-slate-900 bg-slate-950/40 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-[10%] right-[-10%] w-[350px] h-[350px] rounded-full pointer-events-none opacity-[0.04] dark:opacity-[0.06] blur-[120px] bg-indigo-500"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
              Kenapa Harus Kami?
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold mt-4 tracking-tight">Mengapa Memilih <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Buzzify</span>?</h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg font-light leading-relaxed">Kami mengutamakan kualitas, kecepatan, keamanan, dan kepuasan Anda dalam setiap transaksi.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Bento Card 1: Large (Processes) */}
            <div className="md:col-span-2 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-indigo-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-indigo-400 transition-colors">Proses Serba Otomatis</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed max-w-lg">
                  Pesanan Anda diproses langsung dalam hitungan detik setelah transaksi diverifikasi secara otomatis oleh sistem kecerdasan terintegrasi kami. Tanpa delay, tanpa manual.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-900/60 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average Dispatch Time: &lt; 2 Minutes</span>
              </div>
            </div>

            {/* Bento Card 2: Small (Security) */}
            <div className="md:col-span-1 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-purple-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-purple-400 transition-colors">Aman & Rahasia</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Keamanan privasi Anda prioritas utama. Kami sama sekali tidak memerlukan kata sandi akun sosial media Anda. Hanya username / URL target saja!
                </p>
              </div>
            </div>

            {/* Bento Card 3: Small (Quality) */}
            <div className="md:col-span-1 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-emerald-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-emerald-400 transition-colors">Buzzer Berkualitas</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Kami menyediakan optimasi promosi menggunakan jaringan buzzer dengan tingkat kestabilan tinggi untuk menjaga kualitas promosi jangka panjang.
                </p>
              </div>
            </div>

            {/* Bento Card 4: Large (Interface) */}
            <div className="md:col-span-2 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-pink-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/25 flex items-center justify-center text-pink-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-100 group-hover:text-pink-400 transition-colors">Interaksi Transparan</h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed max-w-lg">
                  Semua kemajuan kampanye buzzer terintegrasi langsung ke halaman dashboard Anda secara interaktif. Riwayat lengkap dan status dapat dikontrol kapan saja secara real-time.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-900/60 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">All-in-One Dashboard Monitor</span>
              </div>
            </div>

            {/* Bento Card 5: Small (Support) */}
            <div className="md:col-span-1 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-blue-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-blue-400 transition-colors">Pelayanan Bantuan</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Kami selalu siap membantu jika Anda membutuhkan bantuan atau mengalami kendala dalam penggunaan layanan kami.
                </p>
              </div>
            </div>

            {/* Bento Card 6: Small (Ease of Use) */}
            <div className="md:col-span-1 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-amber-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-amber-400 transition-colors">Kemudahan Penggunaan</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Kami menyediakan antarmuka pengguna dan fitur-fitur pemesanan yang sangat mudah dimengerti bahkan oleh pengguna pemula sekalipun.
                </p>
              </div>
            </div>

            {/* Bento Card 7: Small (Responsive) */}
            <div className="md:col-span-1 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-teal-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-teal-400 transition-colors">Desain Web Responsive</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Website kami dirancang responsif sehingga sangat nyaman diakses dari berbagai perangkat, baik ponsel pintar Android, iOS, maupun komputer desktop.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Services List Section */}
      <section id="services" className="py-20 border-t border-slate-900 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mb-8 gap-6">
          <div>
            <h2 className="text-3xl font-bold">Daftar Layanan Kami</h2>
            <p className="text-slate-400 mt-2 font-light">Kami menawarkan harga buzzer media sosial terbaik yang sangat bersaing.</p>
          </div>

          {/* Categories Tab - Scrollable without scrollbar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full scrollbar-none whitespace-nowrap flex-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0 cursor-pointer ${selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Table Card */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-md">
          {loading ? (
            <div className="py-20 text-center text-slate-400">Loading layanan...</div>
          ) : filteredServices.length === 0 ? (
            <div className="py-20 text-center text-slate-400">Belum ada layanan tersedia.</div>
          ) : (
            <>
              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850 bg-slate-900/50 text-slate-300 text-sm font-medium">
                      <th className="py-5 px-6">Kategori</th>
                      <th className="py-5 px-6">Nama Layanan</th>
                      <th className="py-5 px-6">Harga / 1K</th>
                      <th className="py-5 px-6">Min Order</th>
                      <th className="py-5 px-6">Max Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-sm">
                    {displayedServices.map(service => (
                      <tr key={service.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-200">
                          <div className="flex items-center gap-2.5">
                            {(() => {
                              const categoryIcon = services.find(s => s.category === service.category && s.icon_url)?.icon_url;
                              if (categoryIcon) {
                                return (
                                  <div className="w-6 h-6 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={categoryIcon} alt="icon" className="w-full h-full object-cover" />
                                  </div>
                                );
                              }
                              return getCategoryIcon(service.category);
                            })()}
                            {service.category}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          <div className="font-medium text-slate-200">{service.name}</div>
                          {service.description && (
                            <div className="text-xs text-slate-500 mt-1 font-light leading-relaxed max-w-sm">{service.description}</div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-indigo-400 font-bold">{formatPrice(service.price_per_k)}</td>
                        <td className="py-4 px-6 text-slate-400">{service.min_order.toLocaleString()}</td>
                        <td className="py-4 px-6 text-slate-400">{service.max_order.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Service Cards */}
              <div key={selectedCategory} className="block md:hidden divide-y divide-zinc-200 dark:divide-slate-800 bg-white dark:bg-slate-900/40 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                {displayedServices.map(service => {
                  const isExpanded = expandedServiceId === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                      className="p-5 space-y-4 shadow-sm cursor-pointer transition-all duration-200 hover:bg-zinc-50/50 dark:hover:bg-slate-900/30"
                    >
                      {/* Header: Category Icon & Price */}
                      <div className="flex justify-between items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const categoryIcon = services.find(s => s.category === service.category && s.icon_url)?.icon_url;
                            if (categoryIcon) {
                              return (
                                <div className="w-5 h-5 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={categoryIcon} alt="icon" className="w-full h-full object-cover" />
                                </div>
                              );
                            }
                            return getCategoryIcon(service.category);
                          })()}
                          <span className="text-xs font-extrabold text-slate-100 dark:text-slate-200">{service.category}</span>
                        </div>

                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/15">
                          {formatPrice(service.price_per_k)} / 1K
                        </span>
                      </div>

                      {/* Service Name & Chevron Indicator */}
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-slate-100 leading-snug flex-1">{service.name}</h4>
                        <div className="pt-0.5 shrink-0">
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''}`} />
                        </div>
                      </div>

                      {/* Expandable Section */}
                      {isExpanded && (
                        <div className="space-y-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                          {service.description && (
                            <div className="space-y-1.5">
                              <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-black block">Deskripsi Layanan</span>
                              <p className="text-[11px] text-zinc-550 dark:text-slate-450 leading-relaxed font-normal border-t border-zinc-150/80 dark:border-slate-850/40 pt-2.5">{service.description}</p>
                            </div>
                          )}

                          {/* Min / Max details in a clean sub-box */}
                          <div className="flex justify-between items-center text-[10px] text-zinc-550 dark:text-slate-400 font-medium bg-zinc-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-zinc-150/80 dark:border-slate-850/60">
                            <span>Min Order: <strong className="text-zinc-800 dark:text-slate-200">{service.min_order.toLocaleString()}</strong></span>
                            <span>Max Order: <strong className="text-zinc-800 dark:text-slate-200">{service.max_order.toLocaleString()}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-zinc-200 dark:border-slate-850/60 bg-zinc-50/50 dark:bg-slate-950/20 flex justify-between items-center text-xs px-6">
                  <button
                    type="button"
                    disabled={servicesPage === 1}
                    onClick={() => setServicesPage(prev => Math.max(1, prev - 1))}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-zinc-750 dark:text-slate-300 font-bold transition-all cursor-pointer border border-zinc-200 dark:border-slate-700"
                  >
                    &larr; Prev
                  </button>
                  <span className="text-zinc-600 dark:text-slate-400 font-semibold">Halaman {servicesPage} dari {totalPages}</span>
                  <button
                    type="button"
                    disabled={servicesPage >= totalPages}
                    onClick={() => setServicesPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-zinc-750 dark:text-slate-300 font-bold transition-all cursor-pointer border border-zinc-200 dark:border-slate-700"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Cara Kerja Section */}
      <section id="how-it-works" className="py-24 border-t border-slate-900 bg-slate-950 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-72 h-72 pointer-events-none opacity-5 blur-[120px] bg-purple-500 rounded-full"></div>
        <div className="absolute bottom-10 left-10 w-72 h-72 pointer-events-none opacity-5 blur-[120px] bg-indigo-500 rounded-full"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
              Sangat Mudah & Praktis
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold mt-4 tracking-tight">
              Cara Kerja <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">Buzzify</span>
            </h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg font-light leading-relaxed">
              Hanya butuh 3 langkah mudah untuk melipatgandakan popularitas profil sosial media Anda secara otomatis 24 jam non-stop.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">

            {/* Left side: Interactive Steps Trigger List */}
            <div className="lg:col-span-6 space-y-4">
              {[
                {
                  step: 1,
                  title: "Daftar Akun",
                  desc: "Lengkapi formulir pendaftaran dengan Nama, Username, Email, dan nomor WhatsApp aktif Anda untuk langsung mengakses dasbor utama.",
                  icon: <Users className="w-5 h-5" />,
                  glowColor: "group-hover:border-indigo-500/30"
                },
                {
                  step: 2,
                  title: "Top Up Saldo",
                  desc: "Isi saldo akun Anda melalui deposit cepat otomatis menggunakan QRIS, e-wallet, atau transfer bank. Saldo akan langsung bertambah dalam hitungan detik.",
                  icon: <Wallet className="w-5 h-5" />,
                  glowColor: "group-hover:border-purple-500/30"
                },
                {
                  step: 3,
                  title: "Pilih Layanan & Order",
                  desc: "Gunakan saldo Anda untuk memesan layanan media sosial yang diinginkan. Sistem cerdas kami akan langsung memproses pesanan Anda secara otomatis dan cepat!",
                  icon: <Zap className="w-5 h-5" />,
                  glowColor: "group-hover:border-pink-500/30"
                }
              ].map((s) => {
                const isActive = activeStep === s.step;
                return (
                  <div
                    key={s.step}
                    onClick={() => setActiveStep(s.step)}
                    className={`group relative z-10 flex gap-4 p-6 rounded-3xl border transition-all duration-300 cursor-pointer text-left ${isActive
                        ? "bg-slate-900/60 dark:bg-slate-900/50 border-indigo-500/40 shadow-xl shadow-indigo-500/5"
                        : "bg-slate-900/10 border-slate-900/80 hover:bg-slate-900/20 hover:border-slate-800"
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                        : "bg-slate-950 text-slate-400 group-hover:text-slate-200"
                      }`}>
                      {s.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-bold text-base transition-colors ${isActive ? "text-slate-100" : "text-slate-350"}`}>
                          {s.title}
                        </h3>
                        <span className={`text-xs font-mono font-black ${isActive ? "text-indigo-400" : "text-slate-600"}`}>
                          0{s.step}
                        </span>
                      </div>
                      <p className={`text-xs mt-2 leading-relaxed font-light transition-colors ${isActive ? "text-slate-350" : "text-slate-500"}`}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right side: Modern Dynamic Preview Area */}
            <div className="lg:col-span-6 bg-slate-900/20 backdrop-blur-xl border border-slate-900/85 p-6 sm:p-8 rounded-[36px] min-h-[340px] flex items-center justify-center relative overflow-hidden transition-all duration-500 premium-card-glow h-full">
              {/* Dynamic screen changes depending on activeStep */}

              {/* Step 1 Preview Screen */}
              <div className={`w-full max-w-sm space-y-4 transition-all duration-500 ${activeStep === 1 ? "opacity-100 translate-y-0 relative z-10" : "opacity-0 translate-y-4 absolute pointer-events-none"}`}>
                <div className="bg-slate-950/85 border border-slate-850 p-4 rounded-2xl shadow-xl space-y-3">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Buzzify Registration</div>
                  <div className="space-y-2">
                    <div className="h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center px-3 text-[11px] text-slate-300 font-semibold">User: rizki</div>
                    <div className="h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center px-3 text-[11px] text-slate-300 font-semibold">Email: rizki@domain.com</div>
                    <div className="h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center px-3 text-[11px] text-slate-300 font-semibold">WhatsApp: +62 812-3456-XXXX</div>
                  </div>
                  <div className="h-9 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-600/20">
                    Registering...
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 py-2 rounded-xl border border-emerald-500/15 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Registrasi Berhasil! Akses Terbuka.</span>
                </div>
              </div>

              {/* Step 2 Preview Screen */}
              <div className={`w-full max-w-xs space-y-4 transition-all duration-500 ${activeStep === 2 ? "opacity-100 translate-y-0 relative z-10" : "opacity-0 translate-y-4 absolute pointer-events-none"}`}>
                <div className="bg-slate-950/85 border border-slate-850 p-5 rounded-2xl shadow-xl text-center space-y-4">
                  <div className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Quick QRIS Deposit</div>
                  <div className="mx-auto w-32 h-32 bg-white p-2.5 rounded-xl border border-slate-850 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent animate-scan h-full"></div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BuzzifyQRISDemo" alt="QRIS Demo" className="w-full h-full opacity-90" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 font-semibold">Virtual Account / QRIS</div>
                    <div className="text-sm font-bold text-slate-200">Amount: Rp 100.000</div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 font-bold bg-indigo-500/10 py-2 rounded-xl border border-indigo-500/15 animate-bounce">
                  <span>Balance Update: +Rp 100.000</span>
                </div>
              </div>

              {/* Step 3 Preview Screen */}
              <div className={`w-full max-w-sm space-y-4 transition-all duration-500 ${activeStep === 3 ? "opacity-100 translate-y-0 relative z-10" : "opacity-0 translate-y-4 absolute pointer-events-none"}`}>
                <div className="bg-slate-950/85 border border-slate-850 p-4 rounded-2xl shadow-xl space-y-3">
                  <div className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Instant Order Form</div>
                  <div className="space-y-2">
                    <div className="h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between px-3 text-[10px] text-slate-400 font-semibold">
                      <span>Service Category</span>
                      <span className="text-slate-200 font-bold">TikTok Followers</span>
                    </div>
                    <div className="h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between px-3 text-[10px] text-slate-400 font-semibold">
                      <span>Target Profile URL</span>
                      <span className="text-slate-200 font-bold">tiktok.com/@creative_mind</span>
                    </div>
                    <div className="h-8 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between px-3 text-[10px] text-slate-400 font-semibold">
                      <span>Order Quantity</span>
                      <span className="text-slate-200 font-bold">1,000</span>
                    </div>
                  </div>
                  <div className="h-9 bg-gradient-to-r from-pink-500 to-indigo-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-lg shadow-pink-600/20">
                    Confirm Order
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 font-bold bg-indigo-500/10 py-2 rounded-xl border border-indigo-500/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
                  <span>Order #9201 Diproses Otomatis!</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 border-t border-slate-900 relative overflow-hidden bg-slate-950/40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-[0.06] dark:opacity-[0.1] blur-[150px] bg-indigo-500 rounded-full animate-pulse-glow"></div>

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="bg-slate-900/35 backdrop-blur-xl border border-slate-900 p-12 sm:p-16 rounded-[40px] text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-purple-500/5 to-transparent pointer-events-none"></div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Siap Tingkatkan Media Sosial Anda?</h2>
            <p className="text-slate-400 mt-4 text-base sm:text-lg max-w-xl mx-auto font-light leading-relaxed">
              Daftar akun gratis sekarang dan nikmati layanan order otomatis 24/7 proses cepat.
            </p>
            <div className="mt-10 flex justify-center">
              <Link
                href="/login?tab=register"
                className="shimmer-btn inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:-translate-y-1"
              >
                <span>Daftar Sekarang</span>
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} {brandName}. All Rights Reserved.</p>
          <div className="flex gap-4">
            <Link href="/syarat-ketentuan" className="hover:text-indigo-400 transition-colors">
              Syarat & Ketentuan
            </Link>
          </div>
          <p className="text-slate-600">Platform Optimasi Media Sosial Terpercaya & Terlengkap</p>
        </div>
      </footer>
    </div>
  );
}
