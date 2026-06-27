"use client";

// ── MERCHANT FLOWS PAGE ──────────────────────────────────────────────────────
// This page is READ-ONLY for merchants.
// All flow configuration (enable/disable, templates, delay) is done by ADMIN
// via the admin panel → merchant hub → Flows tab.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FlowsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Merchants don't need to access flows directly — redirect to dashboard
    router.replace("/dashboard");
  }, [router]);

  return null;
}
