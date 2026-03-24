'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { GoogleMark } from '@/components/svgs/GoogleMark';
import { createClient } from '@/lib/supabase/client';

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-6">
      <section
        className="w-full max-w-sm rounded-[32px] border border-[#d8d1c4] bg-[#f8f5ef]/95 p-5 shadow-[0_18px_45px_rgba(24,24,20,0.08)] sm:p-6"
        aria-label="로그인 카드">
        {children}
      </section>
    </main>
  );
}

function LoginContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signInWithGoogle = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo }, // 이 URL이 Supabase Redirect allow list에 있어야 함
      });

      if (error) {
        console.error(error);
        alert('구글 로그인 시작 실패. 콘솔을 확인하세요.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      alert('구글 로그인 시작 실패. 콘솔을 확인하세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <LoginShell>
      <div className="flex flex-col items-center text-center">
        <p className="typo-second text-[28px] text-custom-black">Carokann</p>
        <p className="mt-3 typo-1 text-[14px] leading-5 text-custom-black-light">구글 계정으로 바로 시작하세요.</p>
      </div>

      <div className="mt-6 rounded-[26px] border border-[#d8d1c4] bg-[#f5f2eb] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:p-4">
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="cursor-pointer flex min-h-14 w-full items-center justify-center gap-3 rounded-[18px] border border-[#bfb7a8] bg-white px-4 py-3 typo-2 text-[17px] text-custom-black shadow-[0_10px_25px_rgba(20,20,19,0.06)] transition-colors hover:bg-[#fcfbf8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/30 disabled:cursor-not-allowed disabled:bg-[#f7f5f0] disabled:text-custom-black-light">
          <GoogleMark />
          <span>{isSubmitting ? '로그인 중...' : 'Google로 계속하기'}</span>
        </button>
      </div>
    </LoginShell>
  );
}

function LoginFallback() {
  return (
    <LoginShell>
      <div className="flex min-h-32 items-center justify-center text-center">
        <p className="typo-1 text-[15px] text-custom-black-light">로그인 화면을 준비하고 있습니다.</p>
      </div>
    </LoginShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}
