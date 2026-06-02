import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "QuizGame — ¿Cuánto sabes?",
  description: "El quiz más adictivo. Pon a prueba tus conocimientos y compite por el top del ranking.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="flex min-h-dvh flex-col bg-grid">
        {children}
      </body>
    </html>
  );
}
