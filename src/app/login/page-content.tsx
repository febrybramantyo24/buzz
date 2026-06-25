'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Zap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Loader2, 
  User, 
  Phone, 
  UserCheck, 
  ShieldCheck, 
  ArrowLeft 
} from 'lucide-react';
import PremiumThemeToggle from '@/components/PremiumThemeToggle';

export default function LoginPage({ isAdminFlow = false }: { isAdminFlow?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    if (isAdminFlow) {
      setIsRegister(false);
      return;
    }
    const tab = searchParams.get('tab');
    const token = searchParams.get('token');
    
    // Check url verification status
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');
    if (verified === 'true') {
      setMessage({ type: 'success', text: 'Email berhasil diverifikasi! Silakan login.' });
    } else if (error) {
      const errMsgs: Record<string, string> = {
        missing_token: 'Token verifikasi tidak ditemukan.',
        invalid_token: 'Token verifikasi tidak valid atau kedaluwarsa.',
        system_error: 'Terjadi kesalahan sistem saat melakukan verifikasi.'
      };
      setMessage({ type: 'error', text: errMsgs[error] || 'Gagal memproses verifikasi.' });
    }

    if (tab === 'register') {
      setIsRegister(true);
      setIsResetPassword(false);
    } else if (tab === 'reset' && token) {
      setIsResetPassword(true);
      setResetToken(token);
      setIsRegister(false);
      setIsForgotPassword(false);
    } else {
      setIsRegister(false);
      setIsResetPassword(false);
    }
  }, [searchParams, isAdminFlow]);

  // Check if user is already logged in
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch role from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'admin') {
          router.push('/sb-admin-panel');
        } else {
          router.push('/dashboard');
        }
      }
    }
    checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isRegister) {
        // Validation
        if (password !== confirmPassword) {
          throw new Error('Password dan Ketik Ulang Password tidak cocok.');
        }
        if (!agreeTerms) {
          throw new Error('Anda harus menyetujui Syarat dan Ketentuan.');
        }

        // Check if username is already taken
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();

        if (existingUser) {
          throw new Error('Username sudah digunakan oleh orang lain.');
        }

        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Create user profile in profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: email,
              role: 'user', // Default role
              full_name: fullName,
              username: username,
              whatsapp: whatsapp,
              balance: 100000 // Give 100K demo balance
            });

          if (profileError) {
            console.warn('Error creating profile:', profileError);
          }

          // Local fallback balance setting
          localStorage.setItem(`balance_${data.user.id}`, '100000');

          setMessage({
            type: 'success',
            text: 'Registrasi berhasil! Silakan login dengan akun Anda.',
          });
          setIsRegister(false);
          // Clear registration fields
          setConfirmPassword('');
          setFullName('');
          setWhatsapp('');
        }
      } else {
        // Sign In
        let loginEmail = email;

        // If email field does not contain '@', treat it as username
        if (!email.includes('@')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', email)
            .maybeSingle();

          if (!profile) {
            throw new Error('Username tidak terdaftar.');
          }
          loginEmail = profile.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

        if (error) throw error;

        if (data.session?.user) {
          // Fetch role and redirect
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();

          // Auto-generate profile if missing (resilience)
          if (profileErr || !profile) {
            await supabase.from('profiles').insert({
              id: data.session.user.id,
              email: data.session.user.email || loginEmail,
              role: 'user',
              username: email.includes('@') ? email.split('@')[0] : email,
              balance: 100000
            });
            localStorage.setItem(`balance_${data.session.user.id}`, '100000');
            router.push('/dashboard');
            return;
          }

          if (profile?.role === 'admin') {
            router.push('/sb-admin-panel');
          } else {
            if (isAdminFlow) {
              await supabase.auth.signOut();
              throw new Error('Akun Anda tidak memiliki hak akses admin.');
            }
            router.push('/dashboard');
          }
        }
      }
    } catch (err: any) {
      let errorText = err.message || 'Terjadi kesalahan sistem. Silakan coba lagi.';
      if (err.message && err.message.toLowerCase().includes('rate limit')) {
        errorText = 'Batas pendaftaran dari sistem terlampaui (Rate Limit Exceeded). Silakan tunggu 1-2 menit, atau matikan fitur "Confirm Email" di dashboard Supabase Anda agar registrasi bisa langsung sukses tanpa email verifikasi.';
      }
      setMessage({
        type: 'error',
        text: errorText,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'Link reset password telah dikirim ke email Anda. Silakan cek kotak masuk.',
      });
      setIsForgotPassword(false);
    } catch (err: any) {
      let errorText = err.message || 'Gagal memproses lupa password.';
      if (err.message && err.message.toLowerCase().includes('rate limit')) {
        errorText = 'Batas pengiriman email dari sistem terlampaui (Rate Limit Exceeded). Silakan tunggu 1 hingga 2 menit sebelum mencoba mengirim link reset kembali.';
      }
      setMessage({
        type: 'error',
        text: errorText,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password baru dan ketik ulang password tidak cocok.' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mereset password.');

      setMessage({
        type: 'success',
        text: data.message
      });
      setIsResetPassword(false);
      setPassword('');
      setConfirmPassword('');
      router.push('/login');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Gagal memproses reset password.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (isResetPassword) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-20 blur-[130px] bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full"></div>
        
        <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Atur Ulang Password</h2>
            <p className="text-slate-400 text-xs mt-1.5 font-light">
              Masukkan password baru Anda untuk mengamankan akun Buzzify Anda.
            </p>
          </div>

          {message && (
            <div className={`p-4 mb-6 rounded-2xl text-sm leading-relaxed border ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password Baru</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-12 pr-12 py-3.5 rounded-2xl outline-none transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Ketik Ulang Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-12 pr-12 py-3.5 rounded-2xl outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Perbarui Password</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-20 blur-[130px] bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full"></div>
        
        <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 animate-fade-in">
          <button 
            onClick={() => {
              setIsForgotPassword(false);
              setMessage(null);
            }} 
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-6 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Login</span>
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Lupa Password</h2>
            <p className="text-slate-400 text-xs mt-1.5 font-light">
              Masukkan alamat email Anda untuk menerima link atur ulang password akun.
            </p>
          </div>

          {message && (
            <div className={`p-4 mb-6 rounded-2xl text-sm leading-relaxed border ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email Akun</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-12 pr-4 py-3.5 rounded-2xl outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Kirim Link Reset</span>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Absolute floating theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <PremiumThemeToggle />
      </div>
      
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] pointer-events-none opacity-20 blur-[130px] bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full"></div>

      <div className={`w-full ${isRegister ? 'max-w-xl' : 'max-w-md'} bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 sm:p-10 rounded-3xl shadow-2xl relative z-10 transition-all duration-300`}>
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-4 group">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-xl group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">
              Buzz<span className="text-indigo-400">ify</span>
            </span>
          </Link>
          <h2 className="text-2xl font-bold text-center">
            {isRegister ? 'Buat Akun Baru' : (isAdminFlow ? 'Masuk ke Panel Admin' : 'Masuk ke Dashboard')}
          </h2>
          <p className="text-slate-400 text-xs mt-1 text-center font-light">
            {isRegister ? 'Mulai kelola kebutuhan buzzer sosial media Anda' : (isAdminFlow ? 'Kelola layanan, pesanan, dan pengguna Buzzify' : 'Kelola pesanan, riwayat, dan info rekomendasi')}
          </p>
        </div>

        {/* Alert message */}
        {message && (
          <div className={`p-4 mb-6 rounded-2xl text-sm leading-relaxed border ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-5">
          {isRegister ? (
            /* REGISTER FIELDS */
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nama Lengkap</label>
                  <div className="relative">
                    <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nama Lengkap Anda"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-11 pr-4 py-3 rounded-2xl outline-none transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="username"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-11 pr-4 py-3 rounded-2xl outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-11 pr-4 py-3 rounded-2xl outline-none transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Nomor Whatsapp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9+]/g, ''))}
                      placeholder="081234567890"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-11 pr-4 py-3 rounded-2xl outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-11 pr-11 py-3 rounded-2xl outline-none transition-colors text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Ketik Ulang Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-550" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-11 pr-11 py-3 rounded-2xl outline-none transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Syarat & Ketentuan Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
                <label className="text-xs text-slate-400 font-light leading-relaxed cursor-pointer selection:bg-transparent">
                  Saya menyetujui{' '}
                  <button 
                    type="button" 
                    onClick={() => setShowTermsModal(true)} 
                    className="text-indigo-400 font-semibold hover:underline cursor-pointer focus:outline-none"
                  >
                    Syarat & Ketentuan
                  </button>{' '}
                  serta kebijakan privasi Buzzify.
                </label>
              </div>
            </div>
          ) : (
            /* LOGIN FIELDS */
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Username atau Email</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan username atau email"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-12 pr-4 py-3.5 rounded-2xl outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setMessage(null);
                    }}
                    className="text-xs text-indigo-400 font-semibold hover:underline"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 text-slate-100 pl-12 pr-12 py-3.5 rounded-2xl outline-none transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Daftar Akun' : 'Masuk'}</span>
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center text-sm text-slate-400 font-light">
          {isRegister ? (
            <p>
              Sudah punya akun?{' '}
              <button 
                onClick={() => {
                  setIsRegister(false);
                  setMessage(null);
                }} 
                className="text-indigo-400 font-semibold hover:underline"
              >
                Masuk disini
              </button>
            </p>
          ) : !isAdminFlow && (
            <p>
              Belum punya akun?{' '}
              <button 
                onClick={() => {
                  setIsRegister(true);
                  setMessage(null);
                }} 
                className="text-indigo-400 font-semibold hover:underline"
              >
                Daftar sekarang
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Syarat & Ketentuan Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShowTermsModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-350 transition-colors focus:outline-none"
            >
              <Zap className="w-5 h-5 rotate-90 text-slate-400 hover:text-white" />
            </button>

            <div className="flex items-center gap-2 mb-4 shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold">Syarat & Ketentuan Layanan</h3>
            </div>

            <div className="overflow-y-auto pr-2 text-slate-300 text-xs font-light space-y-4 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <p>
                Selamat datang di <strong>Buzzify</strong>. Dengan mendaftar dan menggunakan layanan kami, Anda menyatakan telah membaca, memahami, dan menyetujui semua aturan dan ketentuan yang berlaku di bawah ini:
              </p>

              <div>
                <h4 className="font-bold text-slate-200 mb-1">1. Aturan Pemesanan & Target</h4>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Akun target atau postingan Anda harus berada dalam kondisi <strong>publik</strong> (tidak boleh dikunci / private) selama proses pengerjaan.</li>
                  <li>Kesalahan pengisian link/URL target pemesanan sepenuhnya merupakan tanggung jawab pengguna. Tidak ada pengembalian saldo atas kesalahan input.</li>
                  <li>Dilarang melakukan pemesanan ganda (double order) untuk target/link yang sama sebelum pesanan sebelumnya selesai.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 mb-1">2. Ketentuan Saldo & Pembayaran</h4>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Pembayaran top-up saldo diproses menggunakan sistem QRIS / Transfer Bank otomatis secara aman via Midtrans.</li>
                  <li>Saldo akun yang telah dibeli/di-top-up <strong>tidak dapat diuangkan kembali (non-refundable)</strong> atau ditarik ke rekening pribadi.</li>
                  <li>Saldo hanya dapat digunakan untuk melakukan transaksi pembelian jasa buzzer/sosial media di dalam platform Buzzify.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 mb-1">3. Kebijakan Privasi & Keamanan</h4>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>Kami menjaga kerahasiaan data pribadi, email, nomor WhatsApp, serta data pesanan Anda dengan aman.</li>
                  <li>Buzzify tidak pernah meminta password akun sosial media Anda. Kami hanya membutuhkan link/URL target publik untuk pengerjaan jasa buzzer.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setAgreeTerms(true);
                  setShowTermsModal(false);
                }}
                className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-95"
              >
                Setuju & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
