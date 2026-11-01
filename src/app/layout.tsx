import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atlas",
  description: "Evidence-first RAG assistant with cited answers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
