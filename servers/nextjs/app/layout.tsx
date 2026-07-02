import type { Metadata } from "next";
import localFont from "next/font/local";
import { Syne, Unbounded } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import MixpanelInitializer from "./MixpanelInitializer";
import { Toaster } from "@/components/ui/sonner";
import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  I18N_STORAGE_KEY,
  Locale,
  isSupportedLocale,
} from "@/i18n/translations";
const inter = localFont({
  src: [
    {
      path: "./fonts/Inter.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-unbounded",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://presenton.ai"),
  title: "Presenton - Open Source AI presentation generator",
  description:
    "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
  keywords: [
    "AI presentation generator",
    "data storytelling",
    "data visualization tool",
    "AI data presentation",
    "presentation generator",
    "data to presentation",
    "interactive presentations",
    "professional slides",
  ],
  openGraph: {
    title: "Presenton - Open Source AI presentation generator",
    description:
      "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
    url: "https://presenton.ai",
    siteName: "Presenton",
    images: [
      {
        url: "https://presenton.ai/presenton-feature-graphics.png",
        width: 1200,
        height: 630,
        alt: "Presenton Logo",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  alternates: {
    canonical: "https://presenton.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "Presenton - Open Source AI presentation generator",
    description:
      "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
    images: ["https://presenton.ai/presenton-feature-graphics.png"],
  },
};

const i18nBootstrapScript = `
(function () {
  try {
    var key = ${JSON.stringify(I18N_STORAGE_KEY)};
    var saved = window.localStorage && window.localStorage.getItem(key);
    var browserLocale = window.navigator && window.navigator.language;
    var nextLocale = saved === "en" || saved === "zh-CN"
      ? saved
      : browserLocale && browserLocale.toLowerCase().indexOf("zh") === 0
        ? "zh-CN"
        : null;
    if (nextLocale) {
      document.cookie = key + "=" + encodeURIComponent(nextLocale) + "; path=/; max-age=31536000; SameSite=Lax";
      if (document.documentElement.lang !== nextLocale) {
        document.documentElement.style.visibility = "hidden";
      }
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(I18N_STORAGE_KEY)?.value ?? null;
  const initialLocale: Locale = isSupportedLocale(savedLocale)
    ? savedLocale
    : DEFAULT_LOCALE;

  return (
    <html
      lang={initialLocale === "zh-CN" ? "zh-CN" : "en"}
      data-ui-locale={initialLocale}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: i18nBootstrapScript }} />
      </head>
      <body
        className={`${inter.variable} ${syne.variable} ${unbounded.variable} antialiased`}
      >
        <Providers initialLocale={initialLocale}>
          <MixpanelInitializer>

            {children}

          </MixpanelInitializer>
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
