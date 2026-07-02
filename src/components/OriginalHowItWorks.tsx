'use client';

import { useState, useEffect } from 'react';
import { Users, Wallet, Zap, ShieldCheck } from 'lucide-react';

export default function OriginalHowItWorks() {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev === 3 ? 1 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
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
              className={`group relative z-10 flex gap-4 p-6 rounded-3xl border transition-all duration-300 cursor-pointer text-left ${
                isActive
                  ? "bg-white dark:bg-slate-900/50 border-indigo-500/40 shadow-xl shadow-indigo-500/5"
                  : "bg-slate-900/10 border-slate-900/80 hover:bg-slate-900/20 hover:border-slate-850"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105"
                  : "bg-slate-950 text-slate-400 group-hover:text-slate-200"
              }`}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-400">
                    Langkah {s.step}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-100 dark:text-slate-100 group-hover:text-white transition-colors">
                    {s.title}
                  </h3>
                </div>
                <p className="text-slate-400 text-xs mt-2 font-light leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right side: Mockup visuals */}
      <div className="lg:col-span-6 relative w-full h-[280px] sm:h-[320px] flex items-center justify-center select-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-purple-500/5 to-transparent rounded-full blur-2xl"></div>

        {/* Dynamic mockup content */}
        <div className="relative w-full max-w-sm bg-white dark:bg-slate-900/40 border border-slate-850 p-6 rounded-3xl shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Buzzify Registration</span>
                <span className="text-[9px] text-slate-400">Step 1 of 3</span>
              </div>
              <div className="space-y-2.5">
                <div className="h-7 bg-slate-950 rounded-xl border border-slate-850/60 w-full flex items-center px-3 text-[10px] text-slate-450">
                  Full Name: febry bramantyo
                </div>
                <div className="h-7 bg-slate-950 rounded-xl border border-slate-850/60 w-full flex items-center px-3 text-[10px] text-slate-455">
                  Username: febry24
                </div>
                <div className="h-7 bg-slate-950 rounded-xl border border-slate-850/60 w-full flex items-center px-3 text-[10px] text-slate-455">
                  WhatsApp: 08123456789
                </div>
              </div>
              <div className="h-8.5 rounded-xl bg-indigo-605 text-white font-extrabold text-[10px] flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Submit & Create Account</span>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Fast Deposit E-Wallet</span>
                <span className="text-[9px] text-slate-450">Step 2 of 3</span>
              </div>
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-850/60 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Nominal Top Up</span>
                  <div className="text-base font-black text-slate-100 mt-0.5">Rp 50.000</div>
                </div>
                <span className="text-[8px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  Instant QRIS
                </span>
              </div>
              <div className="flex items-center gap-3 bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl">
                <div className="bg-indigo-500/15 p-2 rounded-lg text-indigo-400 shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <span className="text-[9.5px] text-slate-450 leading-relaxed font-light">
                  Pembayaran diverifikasi secara otomatis dalam 5-10 detik menggunakan gateway Midtrans.
                </span>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Create New Order</span>
                <span className="text-[9px] text-slate-450">Step 3 of 3</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Service Category</label>
                  <div className="h-7.5 bg-slate-950 rounded-xl border border-slate-850/60 w-full flex items-center px-3 text-[10px] text-slate-205">
                    TikTok Followers [Real & Permanent]
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Target URL / Link</label>
                  <div className="h-7.5 bg-slate-950 rounded-xl border border-slate-850/60 w-full flex items-center px-3 text-[10px] text-slate-350 truncate">
                    https://tiktok.com/@febry24
                  </div>
                </div>
              </div>
              <div className="h-9 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-extrabold text-[10px] flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/10">
                <Zap className="w-3.5 h-3.5" />
                <span>Submit Order Sekarang</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
