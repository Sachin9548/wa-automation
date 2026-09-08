// Shared types and constants for merchant hub tab components

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const ah = () => ({
  "x-admin-api-key":
    typeof window !== "undefined"
      ? sessionStorage.getItem("adminKey") || ""
      : "",
});

// ── Shared props that almost every tab needs ──────────────────────────────────
export interface BaseTabProps {
  merchantId: string;
  merchant: any;
  loading: string | null;
  setLoading: (v: string | null) => void;
  fetchAll: () => Promise<void>;
}
