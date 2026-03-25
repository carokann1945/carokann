import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { Toaster } from 'sonner';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' });

const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
});

export const metadata: Metadata = {
  title: 'Carokann',
  description:
    '다양한 주기 설정과 탭 분류 기능을 제공하여 개인의 루틴과 반복 작업을 체계적으로 자동 관리하는 리셋 트래커',
  verification: {
    google: 'KjPEoW3dDAV__bk3baW6Zb8lZW81wimVzu5tDiJL2Hc',
    other: {
      'naver-site-verification': '5587d60ce0f399389f76d05db48c693390fa770e',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${geist.variable}`}>
      <body className="antialiased bg-custom-main-bg">
        {children}
        <Toaster position="bottom-left" richColors />
      </body>
    </html>
  );
}
