'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Service } from '@/lib/types';
import PremiumThemeToggle from '@/components/PremiumThemeToggle';
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
  Activity,
  Heart,
  Eye,
  MessageSquare
} from 'lucide-react';

export default function LandingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    async function fetchServices() {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true);
        
        if (error) throw error;
        setServices(data || []);
      } catch (err) {
        console.error('Error fetching services:', err);
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
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, []);

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category)))];

  const filteredServices = selectedCategory === 'All'
    ? services
    : services.filter(s => s.category === selectedCategory);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-20 blur-[150px] bg-gradient-to-b from-indigo-600 via-purple-600 to-transparent"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white animate-pulse" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-400">
              Sosial<span className="text-indigo-400">Buzz</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Keunggulan</a>
            <a href="#services" className="hover:text-white transition-colors">Daftar Layanan</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Cara Kerja</a>
          </nav>

          <div className="flex items-center gap-4">
            <PremiumThemeToggle />
            <Link 
              href="/login" 
              className="text-sm font-semibold hover:text-white transition-colors text-slate-300 px-4 py-2"
            >
              Masuk
            </Link>
            <Link 
              href="/login?tab=register" 
              className="text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-32 md:pb-36 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-6 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Platform Buzzer Terpercaya & Tercepat di Indonesia</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight sm:leading-none">
          Tingkatkan <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">Popularitas Medsos</span> Anda Instan!
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl font-light">
          SosialBuzz menyediakan layanan optimasi media sosial terbaik. Followers, Likes, Views, dan Subscribers berkualitas tinggi dengan harga termurah.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1"
          >
            <span>Mulai Order Sekarang</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a 
            href="#services" 
            className="flex items-center justify-center bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-2xl transition-all"
          >
            Lihat Layanan
          </a>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl bg-slate-900/40 backdrop-blur-sm border border-slate-800/80 p-8 rounded-3xl">
          <div className="text-center border-r border-slate-800 last:border-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-white">100K+</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Pesanan Sukses</div>
          </div>
          <div className="text-center md:border-r border-slate-800 last:border-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-white">15K+</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Pelanggan Aktif</div>
          </div>
          <div className="text-center border-r border-slate-800 last:border-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">99.9%</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Tingkat Keberhasilan</div>
          </div>
          <div className="text-center last:border-0">
            <div className="text-3xl sm:text-4xl font-extrabold text-purple-400">&lt; 5 Menit</div>
            <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Proses Instant</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Mengapa Memilih SosialBuzz?</h2>
            <p className="text-slate-400 mt-4 font-light">Kami mengutamakan kualitas, kecepatan, keamanan, dan kepuasan Anda dalam setiap transaksi.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Proses Cepat</h3>
              <p className="text-slate-400 font-light leading-relaxed">
                Pesanan Anda akan diproses secara instan atau dalam hitungan menit secara otomatis setelah pembayaran sukses diterima.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">100% Aman</h3>
              <p className="text-slate-400 font-light leading-relaxed">
                Kami tidak membutuhkan password akun media sosial Anda. Cukup masukkan URL target atau username profil Anda saja.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/40 border border-slate-850 hover:border-slate-800 p-8 rounded-3xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Layanan Berkualitas</h3>
              <p className="text-slate-400 font-light leading-relaxed">
                Kami menyediakan buzzer real dan permanent dengan tingkat drop rate sangat rendah demi kepuasan promosi Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services List Section */}
      <section id="services" className="py-20 border-t border-slate-900 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-bold">Daftar Layanan Kami</h2>
            <p className="text-slate-400 mt-2 font-light">Kami menawarkan harga buzzer media sosial terbaik yang sangat bersaing.</p>
          </div>

          {/* Categories Tab */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  selectedCategory === cat
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
            <div className="overflow-x-auto">
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
                  {filteredServices.map(service => (
                    <tr key={service.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-200">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(service.category)}
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
          )}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 border-t border-slate-900 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none opacity-10 blur-[120px] bg-indigo-500 rounded-full"></div>
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold">Siap Tingkatkan Media Sosial Anda?</h2>
          <p className="text-slate-400 mt-4 text-lg max-w-xl mx-auto font-light">
            Daftar akun gratis sekarang dan nikmati layanan order otomatis 24/7 super instan.
          </p>
          <div className="mt-8 flex justify-center">
            <Link 
              href="/login?tab=register" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1"
            >
              <span>Daftar Sekarang</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} SosialBuzz. All Rights Reserved.</p>
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
