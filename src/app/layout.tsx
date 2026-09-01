import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/context/auth-context";

export const metadata: Metadata = {
  title: "RAJPOOT TRADERS - Easy Installments, Electronics & Solar Financing",
  description: "Official multi-tenant installment management and treasury platform for Rajpoot Traders. Easy monthly installments for smartphones, inverter ACs, solar packages, and motorbikes with transparent contracts.",
  keywords: [
    "Rajpoot Traders",
    "easy installment lahore",
    "electronics installment pakistan",
    "ac on installments",
    "solar system installment",
    "bike hire purchase lahore",
    "urdu installment contract"
  ],
  authors: [{ name: "Rajpoot Traders Corporate Platform" }],
  openGraph: {
    title: "RAJPOOT TRADERS - Easy Installments & Electronics Hub",
    description: "Shariah-compliant easy monthly installments with instant approval and dual guarantor trust network.",
    url: "https://rajpoottraders.com",
    siteName: "Rajpoot Traders",
    locale: "en_PK",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="font-sans min-h-full flex flex-col antialiased bg-slate-50 text-slate-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}