'use client';

import { Suspense } from 'react';
import LoginPage from '../login/page-content';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
        <span className="text-slate-400 text-sm">Memuat halaman masuk admin...</span>
      </div>
    }>
      <LoginPage isAdminFlow={true} />
    </Suspense>
  );
}
