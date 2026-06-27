// Central API URL — reads from env in production, falls back to localhost for dev
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
