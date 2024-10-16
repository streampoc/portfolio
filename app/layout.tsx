import type { Metadata } from "next";
import { ThemeProvider } from "@/components/Common/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "A comprehensive trading dashboard for analyzing and visualizing trade data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
