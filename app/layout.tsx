import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets:  ["latin"],
  variable: "--font-inter",
  display:  "swap",
});

export const metadata: Metadata = {
  title: {
    default:  "WorkSpace",
    template: "%s | WorkSpace",
  },
  description: "Personal execution operating system for indie builders.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor:  "#0B0F14",
  colorScheme: "dark light",
  width:       "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: next-themes manages the class on <html> after hydration
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="bottom-right"
          gap={8}
          toastOptions={{
            style: {
              background: "var(--color-card)",
              border:     "1px solid var(--color-border)",
              color:      "var(--color-text-primary)",
              fontSize:   "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
