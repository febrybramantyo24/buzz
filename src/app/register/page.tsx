'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  useEffect(() => {
    // Redirect ke /login dengan tab register dan teruskan kode referral
    const target = ref
      ? `/login?tab=register&ref=${encodeURIComponent(ref)}`
      : '/login?tab=register';
    router.replace(target);
  }, [router, ref]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
      <span className="text-slate-400 text-sm">Mengarahkan ke halaman daftar...</span>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
          <span className="text-slate-400 text-sm">Memuat...</span>
        </div>
      }
    >
      <RegisterRedirect />
    </Suspense>
  );
}
