export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000";

export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("flashback_token") || "";
}

export function storeToken(token) {
  if (typeof window !== "undefined") localStorage.setItem("flashback_token", token);
}

export function clearStoredToken() {
  if (typeof window !== "undefined") localStorage.removeItem("flashback_token");
}

export async function apiFetch(path, options = {}) {
  const token = options.token ?? getStoredToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData) && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function buildQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}
