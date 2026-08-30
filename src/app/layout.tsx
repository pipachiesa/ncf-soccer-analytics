import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const themeScript = `
  (function () {
    try {
      var storedTheme = localStorage.getItem("ncf-theme");
      var theme = storedTheme === "light" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", theme === "dark");
    } catch (_) {
      document.documentElement.classList.add("dark");
    }
  })();
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: "NCF Soccer Analytics",
  description: "NCF Men's Soccer data portal for fixtures, players, and match analytics.",
  openGraph: {
    title: "NCF Soccer Analytics",
    description: "NCF Men's Soccer data portal",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NCF Soccer Analytics",
    description: "NCF Men's Soccer data portal",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
