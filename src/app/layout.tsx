import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const pretendard = localFont({
  src: '../../public/fonts/PretendardVariable.woff2',
  variable: '--font-pretendard', //tailwind와 연동할 css 변수명
});

export const metadata: Metadata = {
  title: 'template',
  description: '',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${pretendard.variable} antialiased`}>{children}</body>
    </html>
  );
}
