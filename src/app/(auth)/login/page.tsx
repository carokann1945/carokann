'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';

function LoginContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const signInWithGoogle = async () => {
    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }, // 이 URL이 Supabase Redirect allow list에 있어야 함
    });

    if (error) {
      console.error(error);
      alert('구글 로그인 시작 실패. 콘솔을 확인하세요.');
    }
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Login</h1>
      <button onClick={signInWithGoogle}>Google로 로그인</button>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <LoginContent />
    </Suspense>
  );
}
