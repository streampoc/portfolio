import type { Metadata } from "next";
import { ThemeProvider } from "@/components/Common/ThemeProvider";
import { UserProvider } from "@/lib/auth";
import { Manrope } from 'next/font/google';
import "./globals.css";
import { getUser } from '@/lib/db/queries';


export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "A comprehensive trading dashboard for analyzing and visualizing trade data.",
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userPromise = getUser();
  return (
    <html lang="en" className={`${manrope.className}`} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider userPromise={userPromise}>{children}</UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
