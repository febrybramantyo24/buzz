'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Zap, BookOpen, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import PremiumThemeToggle from '@/components/PremiumThemeToggle';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white overflow-x-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none opacity-20 blur-[150px] bg-gradient-to-b from-indigo-600 via-purple-600 to-transparent"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                <Zap className="w-6 h-6 text-white animate-pulse" />
              </div>
              <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-400">
                Buzz<span className="text-indigo-400">ify</span>
              </span>
            </Link>
          </div>

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

      {/* Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Title */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dokumen Resmi Buzzify</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Syarat & <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500">Ketentuan Layanan</span>
          </h1>
          <p className="mt-4 text-slate-400 font-light leading-relaxed">
            Terakhir diperbarui: 24 Juni 2026. Harap baca seluruh dokumen ini dengan saksama sebelum menggunakan platform kami.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl space-y-8 text-slate-300 text-sm font-light leading-relaxed">
          <p>
            Selamat datang di <strong>Buzzify</strong>. Dengan mendaftar, mengakses, atau menggunakan layanan kami, Anda menyatakan telah membaca, memahami, dan menyetujui semua aturan, syarat, dan ketentuan yang berlaku di bawah ini. Jika Anda tidak menyetujui bagian apa pun dari ketentuan ini, Anda tidak diperkenankan menggunakan layanan kami.
          </p>

          <hr className="border-slate-800" />

          {/* Section 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">1. Ketentuan Umum</h3>
            </div>
            <p className="pl-9">
              Buzzify adalah platform penyedia optimasi media sosial (buzzer) yang membantu meningkatkan interaksi akun Anda (followers, likes, views, subscriber, dan sejenisnya). Layanan kami semata-mata digunakan untuk tujuan promosi dan pengembangan visual media sosial Anda secara sah.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">2. Akun & Pendaftaran</h3>
            </div>
            <ul className="list-disc list-outside pl-13 space-y-2">
              <li>Pendaftaran akun memerlukan Nama Lengkap, Username, Email aktif, Nomor WhatsApp yang valid, serta Password.</li>
              <li>Anda bertanggung jawab penuh atas keamanan kredensial akun Anda (username dan password).</li>
              <li>Kami berhak menangguhkan akun jika terdeteksi adanya aktivitas mencurigakan, penipuan, atau pelanggaran terhadap ketentuan platform kami.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">3. Ketentuan Pemesanan</h3>
            </div>
            <ul className="list-disc list-outside pl-13 space-y-2">
              <li>
                <strong>Target Publik:</strong> Akun target atau postingan Anda harus dalam kondisi <strong>publik (tidak boleh dikunci / private)</strong> selama proses pengerjaan. Kegagalan proses akibat akun terkunci tidak akan direfund.
              </li>
              <li>
                <strong>Kesalahan Input:</strong> Kesalahan dalam penulisan link/URL target pemesanan sepenuhnya merupakan tanggung jawab pengguna. Silakan periksa kembali tautan Anda sebelum melakukan pembayaran.
              </li>
              <li>
                <strong>Pemesanan Ganda (Double Order):</strong> Dilarang memesan layanan yang sama untuk link/target yang sama sebelum pesanan sebelumnya berstatus sukses/selesai. Kami tidak bertanggung jawab jika jumlah tidak bertambah penuh akibat bentrok data pemesanan.
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">4. Pembayaran & Kebijakan Refund Saldo</h3>
            </div>
            <ul className="list-disc list-outside pl-13 space-y-2">
              <li>Top-up saldo dilakukan secara otomatis dan instan menggunakan QRIS / Transfer Bank melalui gerbang pembayaran Midtrans Sandbox.</li>
              <li>
                <strong>Ketentuan Non-Refundable:</strong> Saldo akun yang sudah di-top-up <strong>tidak dapat diuangkan kembali</strong> atau ditransfer ke rekening pribadi/bank pihak ketiga. Saldo hanya dapat digunakan untuk pembelian layanan di dalam platform Buzzify.
              </li>
              <li>Jika terjadi kegagalan pemesanan sistem (misalnya sistem error atau server overload), dana pembelian pesanan tersebut akan dikembalikan secara otomatis 100% ke <strong>Saldo Akun Buzzify</strong> Anda, bukan ke rekening asal Anda.</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">5. Batasan Tanggung Jawab</h3>
            </div>
            <ul className="list-disc list-outside pl-13 space-y-2">
              <li>Buzzify tidak bertanggung jawab atas tindakan penghapusan postingan, pemblokiran akun, atau suspend yang dilakukan oleh platform media sosial (seperti Instagram, TikTok, YouTube) terhadap akun Anda.</li>
              <li>Kami tidak menjamin pengikut (followers) baru akan berinteraksi aktif secara berkelanjutan dengan postingan Anda di kemudian hari.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <Eye className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">6. Kebijakan Privasi</h3>
            </div>
            <p className="pl-9">
              Kami berkomitmen menjaga privasi Anda. Semua informasi pribadi seperti email, password, nomor WhatsApp, dan link target tersimpan dengan enkripsi aman. Kami tidak akan pernah membagikan atau menjual data pribadi Anda kepada pihak ketiga mana pun tanpa persetujuan Anda.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Buzzify. All Rights Reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-indigo-400 transition-colors">Beranda</Link>
            <Link href="/login" className="hover:text-indigo-400 transition-colors">Masuk</Link>
          </div>
          <p className="text-slate-600">Platform Optimasi Media Sosial Terpercaya & Terlengkap</p>
        </div>
      </footer>
    </div>
  );
}
