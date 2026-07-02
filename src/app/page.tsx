import Link from 'next/link';
import { query } from '@/lib/db';
import { Service } from '@/lib/types';
import PremiumThemeToggle from '@/components/PremiumThemeToggle';
import OriginalServicesList from '@/components/OriginalServicesList';
import OriginalHowItWorks from '@/components/OriginalHowItWorks';
import {
  Zap,
  ShieldCheck,
  Users,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Heart,
  Eye,
  Activity,
  Headphones,
  Smartphone
} from 'lucide-react';

const renderRichText = (text: string) => {
  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <span key={index} className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 font-extrabold">
          {part}
        </span>
      );
    }
    return part;
  });
};

export default async function LandingPage() {
  // Fetch services and site settings from Database (Server-Side Rendering for fast load times)
  let services: Service[] = [];
  let settings: Record<string, string> = {};

  try {
    const servicesRes = await query('SELECT * FROM services WHERE is_active = true');
    services = servicesRes.rows || [];

    const settingsRes = await query('SELECT key, value FROM site_settings');
    if (settingsRes.rows.length > 0) {
      settingsRes.rows.forEach((row: any) => {
        settings[row.key] = row.value;
      });
    }
  } catch (err) {
    console.error('Error fetching landing data on server:', err);
  }

  const logoUrl = settings.site_logo_url || null;
  const brandName = settings.site_title || 'Buzzify';

  const statsList = [
    { key: 'stats_orders', value: settings.stats_orders, label: 'Pesanan Sukses', icon: <ShieldCheck className="w-5 h-5" />, lightIconBg: 'bg-emerald-50', darkIconBg: 'dark:bg-emerald-500/15', lightBorder: 'border-emerald-200', darkBorder: 'dark:border-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400', numColor: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'stats_clients', value: settings.stats_clients, label: 'Pelanggan Aktif', icon: <Users className="w-5 h-5" />, lightIconBg: 'bg-blue-50', darkIconBg: 'dark:bg-blue-500/15', lightBorder: 'border-blue-200', darkBorder: 'dark:border-blue-500/20', iconColor: 'text-blue-600 dark:text-blue-400', numColor: 'text-blue-600 dark:text-blue-400' },
    { key: 'stats_success', value: settings.stats_success, label: 'Keberhasilan', icon: <TrendingUp className="w-5 h-5" />, lightIconBg: 'bg-indigo-50', darkIconBg: 'dark:bg-indigo-500/15', lightBorder: 'border-indigo-200', darkBorder: 'dark:border-indigo-500/20', iconColor: 'text-indigo-600 dark:text-indigo-400', numColor: 'text-indigo-600 dark:text-indigo-400' },
    { key: 'stats_speed', value: services.length > 0 ? `${services.length}+` : (settings.stats_speed || '100+'), label: 'Total Layanan', icon: <Layers className="w-5 h-5" />, lightIconBg: 'bg-purple-50', darkIconBg: 'dark:bg-purple-500/15', lightBorder: 'border-purple-200', darkBorder: 'dark:border-purple-500/20', iconColor: 'text-purple-600 dark:text-purple-400', numColor: 'text-purple-600 dark:text-purple-400' }
  ].filter(stat => !!stat.value);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden relative">
      {/* Background Glows (Mesh Gradients) */}
      <div className="absolute top-[-10%] left-[10%] w-[350px] h-[350px] rounded-full pointer-events-none opacity-[0.06] dark:opacity-[0.15] blur-[120px] bg-indigo-500 animate-pulse-glow"></div>
      <div className="absolute top-[20%] right-[5%] w-[400px] h-[400px] rounded-full pointer-events-none opacity-[0.04] dark:opacity-[0.12] blur-[140px] bg-purple-500"></div>
      <div className="absolute top-[45%] left-[-10%] w-[300px] h-[300px] rounded-full pointer-events-none opacity-[0.03] dark:opacity-[0.08] blur-[110px] bg-pink-500"></div>

      {/* Floating Header Navbar */}
      <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 w-full max-w-7xl mx-auto">
        <header className="backdrop-blur-xl bg-white/70 dark:bg-slate-950/65 border border-slate-200 dark:border-slate-900/60 rounded-2xl shadow-lg dark:shadow-xl transition-all duration-300">
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
              <span className="font-extrabold text-xl tracking-tight text-slate-100">
                {brandName === 'Buzzify' ? (
                  <>Buzz<span className="text-indigo-600 dark:text-indigo-400">ify</span></>
                ) : (
                  brandName
                )}
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500 dark:text-slate-300">
              <a href="#features" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Keunggulan</a>
              <a href="#services" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Daftar Layanan</a>
              <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Cara Kerja</a>
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

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 md:pt-24 md:pb-32 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">

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
            <p className="mt-4 sm:mt-6 text-base sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl font-light leading-relaxed animate-fade-in-up animation-delay-100">
              {settings.hero_subtitle}
            </p>
          )}

          {(settings.hero_cta_text || settings.hero_cta_sub_text) && (
            <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto animate-fade-in-up animation-delay-200">
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
                  className="flex items-center justify-center bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 dark:text-slate-300 hover:text-slate-100 dark:hover:text-white font-black px-8 py-4 rounded-2xl transition-all shadow-sm active:scale-[0.98] select-none"
                >
                  {settings.hero_cta_sub_text}
                </a>
              )}
            </div>
          )}

          {statsList.length > 0 && (
            <div className="mt-8 sm:mt-14 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
              {statsList.map((stat) => (
                <div
                  key={stat.key}
                  className="group relative bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-885 p-4 sm:p-5 rounded-2xl transition-all duration-305 hover:border-indigo-200 dark:hover:border-slate-700/80 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
                >
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${stat.lightIconBg} ${stat.darkIconBg} border ${stat.lightBorder} ${stat.darkBorder} flex items-center justify-center ${stat.iconColor} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                  <div className={`text-xl sm:text-2xl font-black ${stat.numColor} leading-tight`}>
                    {stat.value}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider font-bold">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side: Modern Dribbble Mockups & SaaS Visualizations */}
        <div className="lg:col-span-5 relative w-full h-[350px] sm:h-[400px] lg:h-[480px] flex items-center justify-center mt-12 lg:mt-0 select-none">
          <div className="absolute w-72 h-72 rounded-full bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl -top-10 -right-10 pointer-events-none"></div>
          <div className="absolute w-60 h-60 rounded-full bg-purple-500/10 dark:bg-purple-500/10 blur-3xl -bottom-10 -left-10 pointer-events-none"></div>

          <div className="relative w-full max-w-sm sm:max-w-md h-full flex flex-col justify-center gap-4">
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

            <div className="absolute top-1/2 left-[38%] -translate-y-1/2 w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg shadow-indigo-500/5 animate-bounce-slow">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </div>

      </section>

      {/* Features Section */}
      <section id="features" className="py-24 border-t border-slate-900 bg-slate-950/40 relative overflow-hidden">
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
            <div className="md:col-span-2 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-indigo-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-650 dark:text-indigo-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
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

            <div className="md:col-span-1 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-purple-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-650 dark:text-purple-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-purple-400 transition-colors">Aman & Rahasia</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Keamanan privasi Anda prioritas utama. Kami sama sekali tidak memerlukan kata sandi akun sosial media Anda. Hanya username / URL target saja!
                </p>
              </div>
            </div>

            <div className="md:col-span-1 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-emerald-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-650 dark:text-emerald-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-emerald-400 transition-colors">Buzzer Berkualitas</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Kami menyediakan optimasi promosi menggunakan jaringan buzzer dengan tingkat kestabilan tinggi untuk menjaga kualitas promosi jangka panjang.
                </p>
              </div>
            </div>

            <div className="md:col-span-2 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-pink-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/25 flex items-center justify-center text-pink-600 dark:text-pink-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
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

            <div className="md:col-span-1 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-blue-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-blue-400 transition-colors">Pelayanan Bantuan</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Kami selalu siap membantu jika Anda membutuhkan bantuan atau mengalami kendala dalam penggunaan layanan kami.
                </p>
              </div>
            </div>

            <div className="md:col-span-1 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-amber-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-amber-400 transition-colors">Kemudahan Penggunaan</h3>
                <p className="text-slate-400 text-xs font-light leading-relaxed">
                  Kami menyediakan antarmuka pengguna dan fitur-fitur pemesanan yang sangat mudah dimengerti bahkan oleh pengguna pemula sekalipun.
                </p>
              </div>
            </div>

            <div className="md:col-span-1 premium-card-glow bg-slate-900/10 backdrop-blur-xl border border-slate-900/60 p-8 rounded-3xl transition-all duration-300 hover:border-teal-500/30 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-650 dark:text-teal-400 mb-6 shadow-inner group-hover:scale-110 transition-transform">
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
        <div className="flex flex-col mb-4">
          <h2 className="text-3xl font-bold">Daftar Layanan Kami</h2>
          <p className="text-slate-450 mt-2 font-light text-sm">Kami menawarkan harga buzzer media sosial terbaik yang sangat bersaing.</p>
        </div>

        {/* Render Original Services List with SSR data */}
        <OriginalServicesList initialServices={services} />
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

          {/* Render Original How It Works dynamic client mockup slider */}
          <OriginalHowItWorks />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg w-7 h-7 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm text-slate-350">{brandName}</span>
          </div>

          <div className="flex gap-6 font-bold text-slate-450">
            <Link href="/syarat-ketentuan" className="hover:text-slate-200 transition-colors">Syarat & Ketentuan</Link>
            <a href="#features" className="hover:text-slate-200 transition-colors">Keunggulan</a>
            <a href="#services" className="hover:text-slate-200 transition-colors">Daftar Layanan</a>
          </div>

          <span className="font-medium">&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
