"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, clearStoredToken, getStoredToken, storeToken, WS_URL } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [capsuleViewers, setCapsuleViewers] = useState([]);
  const [lastWsMessage, setLastWsMessage] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const pendingWsRef = useRef([]);

  useEffect(() => {
    const savedToken = getStoredToken();
    if (!savedToken) {
      setReady(true);
      return;
    }
    setToken(savedToken);
    apiFetch("/auth/me", { token: savedToken })
      .then((data) => setUser(data.user))
      .catch(() => {
        clearStoredToken();
        setToken("");
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!token || !user) {
      setOnlineUserIds([]);
      setCapsuleViewers([]);
      return undefined;
    }

    let shouldReconnect = true;
    let pingTimer;

    function connect() {
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        socket.send(JSON.stringify({ event: "AUTH", payload: { token } }));
        pingTimer = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event: "PING", payload: {} }));
          }
        }, 25000);
      });

      socket.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        setLastWsMessage({ ...message, receivedAt: Date.now() });

        if (message.event === "AUTH_OK") {
          const pending = pendingWsRef.current;
          pendingWsRef.current = [];
          pending.forEach((msg) => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(msg));
            }
          });
        }
        if (message.event === "ONLINE_USERS") setOnlineUserIds(message.payload.userIds || []);
        if (message.event === "CAPSULE_VIEWERS") setCapsuleViewers(message.payload.viewers || []);
        if (
          message.event === "COMMENT_COUNT_UPDATED" &&
          message.payload?.userId &&
          message.payload.totalComments !== undefined
        ) {
          setUser((current) =>
            current?.id && String(current.id) === String(message.payload.userId)
              ? { ...current, totalComments: message.payload.totalComments }
              : current
          );
        }
      });

      socket.addEventListener("close", () => {
        clearInterval(pingTimer);
        if (shouldReconnect) reconnectTimerRef.current = setTimeout(connect, 1500);
      });
    }

    connect();
    return () => {
      shouldReconnect = false;
      clearTimeout(reconnectTimerRef.current);
      clearInterval(pingTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [token, user]);

  function sendWs(event, payload = {}) {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event, payload }));
    } else {
      pendingWsRef.current.push({ event, payload });
    }
  }

  async function login(email, password) {
    const data = await apiFetch("/auth/login", { method: "POST", body: { email, password }, token: "" });
    storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await apiFetch("/auth/register", { method: "POST", body: payload, token: "" });
    storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function updateMe(payload) {
    const data = await apiFetch("/auth/me", { method: "PUT", body: payload, token });
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      if (token) await apiFetch("/auth/logout", { method: "POST", token });
    } finally {
      clearStoredToken();
      socketRef.current?.close();
      setToken("");
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      user, token, ready, onlineUserIds, capsuleViewers, lastWsMessage,
      login, register, logout, updateMe, setUser, sendWs,
    }),
    [user, token, ready, onlineUserIds, capsuleViewers, lastWsMessage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function Protected({ children }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <main className="page">
        <p className="muted">Loading…</p>
      </main>
    );
  }
  return children;
}

export function NavBar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/login");
  }

  function isActive(href) {
    if (href === "/capsules") return pathname === "/capsules";
    return pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  }

  const link = (href, label) => (
    <Link
      key={href}
      className={isActive(href) ? "navLink active" : "navLink"}
      href={href}
      onClick={() => setOpen(false)}
    >
      {label}
    </Link>
  );

  return (
    <header className="nav">
      <div className="navInner">
        <Link className="brand" href={user ? "/capsules" : "/"} onClick={() => setOpen(false)}>
          Flashback
        </Link>

        <button
          type="button"
          className="burger"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <nav className={open ? "navLinks open" : "navLinks"}>
          {user ? (
            <>
              <div className="navLinksMain">
                {link("/capsules", "Explore")}
                {link("/my-capsules", "Mine")}
                {link("/capsules/new", "New")}
              </div>
              <div className="navLinksUser">
                {link("/profile", "Profile")}
                <button className="btn ghost" onClick={handleLogout}>Logout</button>
              </div>
            </>
          ) : (
            <div className="navLinksUser">
              <Link className="btn ghost" href="/login" onClick={() => setOpen(false)}>Login</Link>
              <Link className="btn primary" href="/register" onClick={() => setOpen(false)}>Register</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
