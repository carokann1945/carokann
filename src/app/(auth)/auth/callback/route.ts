import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    await new Promise((r) => setTimeout(r, 0));

    if (!error) {
      // 유저 정보 가져오기
      const user = data.session?.user ?? null;

      if (user) {
        const meta = user.user_metadata as Record<string, string | undefined>;
        const name = meta?.full_name ?? meta?.name ?? null;
        const avatarUrl = meta?.avatar_url ?? null;

        await prisma.profile.upsert({
          where: { id: user.id },
          update: { email: user.email ?? null, name, avatarUrl },
          create: { id: user.id, email: user.email ?? null, name, avatarUrl },
        });
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) return NextResponse.redirect(`${origin}${next}`);
      if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
