import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SwRegister } from "@/components/providers/sw-register";
import { Toaster } from "@/components/ui/sonner";

// Display editorial com caráter — títulos, KPIs, wordmark
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Corpo refinado e legível
const sans = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Mono para kickers e dados
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ginga Studio OS · O cérebro da sua agência",
    template: "%s · Ginga Studio",
  },
  description:
    "Sistema operacional completo para agências de marketing — comercial, projetos, aprovações, conteúdo e a IA Atlas como gerente de operações. Por GRP Tecnologia.",
  applicationName: "Ginga Studio OS",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ginga Studio" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/ginga-logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          {children}
          <Toaster position="top-center" theme="dark" richColors />
          <SwRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
