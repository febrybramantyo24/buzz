'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Service } from '@/lib/types';
import { Heart, Activity, Eye, Sparkles, ChevronDown, ArrowRight } from 'lucide-react';

const cleanDescription = (raw: string): string => {
  if (!raw) return '';
  let text = raw.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n');
  text = text.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, (_, href, label) => {
    const cleanLabel = label.replace(/<[^>]*>/g, '').trim();
    return cleanLabel && cleanLabel !== href ? `${cleanLabel} (${href})` : href;
  });
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
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

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(price);
};

interface OriginalServicesListProps {
  initialServices: Service[];
}

export default function OriginalServicesList({ initialServices }: OriginalServicesListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [servicesPage, setServicesPage] = useState(1);
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(initialServices.map(s => s.category)))];

  const filteredServices = selectedCategory === 'All'
    ? initialServices
    : initialServices.filter(s => s.category === selectedCategory);

  // Limit pool to top 20 items to prevent lag
  const limit20Services = filteredServices.slice(0, 20);

  // Paginate the 20 items with 10 items per page
  const servicesItemsPerPage = 10;
  const totalPages = Math.ceil(limit20Services.length / servicesItemsPerPage);
  const displayedServices = limit20Services.slice(
    (servicesPage - 1) * servicesItemsPerPage,
    servicesPage * servicesItemsPerPage
  );

  return (
    <>
      <div className="flex flex-col mb-8 gap-6">
        {/* Categories Tab - Responsive wrapping for many categories */}
        <div className="flex flex-wrap items-center gap-2 w-full">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setServicesPage(1);
                setExpandedServiceId(null);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
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
        {initialServices.length === 0 ? (
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
                  {displayedServices.map(service => {
                    const isExpanded = expandedServiceId === service.id;
                    return (
                      <tr 
                        key={service.id} 
                        onClick={() => setExpandedServiceId(isExpanded ? null : service.id)}
                        className="hover:bg-slate-900/40 transition-colors cursor-pointer"
                      >
                        <td className="py-4 px-6 font-medium text-slate-200 align-top">
                          <div className="flex items-center gap-2.5">
                            {(() => {
                              const categoryIcon = initialServices.find(s => s.category === service.category && s.icon_url)?.icon_url;
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
                          <div className="flex items-start justify-between gap-4">
                            <div className="font-medium text-slate-200">{service.name}</div>
                            {service.description && (
                              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 mt-0.5 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`} />
                            )}
                          </div>
                          {isExpanded && service.description && (
                            <div className="text-xs text-slate-500 mt-2.5 font-light leading-relaxed max-w-xl whitespace-pre-wrap border-t border-slate-800/60 pt-2.5 animate-in fade-in duration-200">
                              {cleanDescription(service.description)}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-indigo-400 font-bold align-top">{formatPrice(service.price_per_k)}</td>
                        <td className="py-4 px-6 text-slate-450 align-top">{service.min_order.toLocaleString('id-ID')}</td>
                        <td className="py-4 px-6 text-slate-450 align-top">{service.max_order.toLocaleString('id-ID')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Service Cards */}
            <div className="block md:hidden divide-y divide-zinc-200 dark:divide-slate-800 bg-white dark:bg-slate-900/40">
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
                          const categoryIcon = initialServices.find(s => s.category === service.category && s.icon_url)?.icon_url;
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
                            <p className="text-[11px] text-zinc-550 dark:text-slate-450 leading-relaxed font-normal border-t border-zinc-150/80 dark:border-slate-850/40 pt-2.5 whitespace-pre-wrap">{cleanDescription(service.description)}</p>
                          </div>
                        )}

                        {/* Min / Max details in a clean sub-box */}
                        <div className="flex justify-between items-center text-[10px] text-zinc-550 dark:text-slate-450 font-medium bg-zinc-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-zinc-150/80 dark:border-slate-850/60">
                          <span>Min Order: <strong className="text-zinc-800 dark:text-slate-200">{service.min_order.toLocaleString('id-ID')}</strong></span>
                          <span>Max Order: <strong className="text-zinc-800 dark:text-slate-200">{service.max_order.toLocaleString('id-ID')}</strong></span>
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
                  className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-200 disabled:shadow-none dark:disabled:bg-slate-900 dark:disabled:border-slate-800 dark:disabled:text-slate-600 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-600/10"
                >
                  &larr; Prev
                </button>
                <span className="text-zinc-650 dark:text-slate-400 font-extrabold">Halaman {servicesPage} dari {totalPages}</span>
                <button
                  type="button"
                  disabled={servicesPage >= totalPages}
                  onClick={() => setServicesPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border select-none disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-200 disabled:shadow-none dark:disabled:bg-slate-900 dark:disabled:border-slate-800 dark:disabled:text-slate-600 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:border-indigo-600 shadow-md shadow-indigo-600/10"
                >
                  Next &rarr;
                </button>
              </div>
            )}

            {/* Login Call-To-Action Banner */}
            {initialServices.length > 20 && (
              <div className="p-8 border-t border-zinc-200 dark:border-slate-850/60 bg-zinc-50/50 dark:bg-slate-950/20 text-center flex flex-col items-center justify-center gap-3">
                <p className="text-xs text-zinc-650 dark:text-slate-400 font-medium max-w-md">
                  Menampilkan 20 layanan terpopuler. Silakan masuk atau mendaftar untuk melihat detail lengkap {initialServices.length}+ layanan kami di dashboard.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-extrabold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-600/10 active:scale-95 cursor-pointer mt-1"
                >
                  <span>Lihat Semua Layanan (Silakan Login)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
