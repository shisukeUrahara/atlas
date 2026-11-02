import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ThemeProvider } from "@/components/ThemeProvider";
import { pageUser } from "./_lib/session";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Atlas", template: "%s · Atlas" },
  description: "Evidence-first RAG assistant: every claim cites the doc passage behind it, and it says so when the docs do not cover a question.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c12" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await pageUser();
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
            Skip to content
          </a>
          <Nav user={user} />
          <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-10 pt-6 md:px-6 md:pb-12 md:pt-10">
            {children}
          </main>
          <footer className="mx-auto mb-20 flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-2 border-t border-line/70 px-4 py-6 text-xs text-muted md:mb-0 md:px-6">
            <span>Atlas · unofficial portfolio project · not affiliated with LangChain or OpenAI</span>
            <a className="underline underline-offset-2 hover:text-ink" href="https://github.com/shisukeUrahara/atlas">
              Source on GitHub
            </a>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
