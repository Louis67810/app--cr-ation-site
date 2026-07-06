import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const newYork = localFont({
  src: "../../public/fonts/new-york-regular.ttf",
  variable: "--font-new-york",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Site Builder Paysagiste",
  description: "Prototype de moteur de templates pour sites de paysagistes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${newYork.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
