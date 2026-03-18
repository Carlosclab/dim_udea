"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useRef } from "react";

// Singleton — created once on first render, never during SSR
let globalClient: ConvexReactClient | null = null;

function getClient(): ConvexReactClient {
  if (globalClient) return globalClient;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("NEXT_PUBLIC_CONVEX_URL is not set. Add it in Vercel → Settings → Environment Variables.");
  globalClient = new ConvexReactClient(url);
  return globalClient;
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  // useRef ensures we only call getClient() once per mount in the browser
  const client = useRef<ConvexReactClient | null>(null);

  if (typeof window !== "undefined" && !client.current) {
    client.current = getClient();
  }

  // During SSR/build: render without provider (page.tsx uses ssr:false so this rarely hits)
  if (!client.current) {
    return <>{children}</>;
  }

  return <ConvexProvider client={client.current}>{children}</ConvexProvider>;
}
