import type { Metadata } from "next";
import { cookies } from "next/headers";
import { parseWorkspaceMode, WORKSPACE_MODE_COOKIE } from "@/lib/workspace-mode";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const training = parseWorkspaceMode(cookieStore.get(WORKSPACE_MODE_COOKIE)?.value) === "training";
  return {
    title: training ? "TRAINING — AR 600-85 Rewrite" : "AR 600-85 Rewrite — Working Copy",
    description: training
      ? "Training copy — practice only. Live workspace is unchanged."
      : "Internal G-1 rewrite working group use only",
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
