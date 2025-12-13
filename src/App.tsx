import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { HomeDeslogada } from "./components/Landing";
import { HomeLogada } from "./components/HomeLogada";
import { Dashboard } from "./components/Dashboard";
import { History } from "./components/History";
import { TransactionHistory } from "./components/TransactionHistory";
import { Profile } from "./components/Profile";
import { Admin } from "./components/Admin";
import { Login } from "./components/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";

function LandingGate() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const bootstrappedRef = useRef(false);

  const withTimeout = async <T,>(p: Promise<T>, ms: number, code: string) => {
    return await Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(code)), ms))]);
  };

  const getCachedAuth = () => {
    try {
      const keys = Object.keys(localStorage || {}).filter((k) => k.startsWith("sb-") && k.includes("auth-token"));
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed?.access_token && parsed?.refresh_token) {
          const exp = Number(parsed.expires_at ?? 0);
          if (exp) {
            const now = Math.floor(Date.now() / 1000);
            if (exp <= now) continue;
          }
          return parsed;
        }
      }
    } catch {}
    return null;
  };

  const rehydrateSessionFromCache = async () => {
    const cached = getCachedAuth();
    if (!cached?.access_token || !cached?.refresh_token) return false;

    try {
      await withTimeout(
        supabase.auth.setSession({
          access_token: cached.access_token,
          refresh_token: cached.refresh_token,
        }),
        2000,
        "SET_SESSION_TIMEOUT",
      );
      return true;
    } catch {
      return false;
    }
  };

  const getSessionSafe = async () => {
    try {
      const { data } = (await withTimeout(supabase.auth.getSession(), 6000, "GET_SESSION_TIMEOUT")) as Awaited<
        ReturnType<typeof supabase.auth.getSession>
      >;
      return data.session ?? null;
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg === "GET_SESSION_TIMEOUT") {
        const ok = await rehydrateSessionFromCache();
        if (!ok) return null;

        try {
          const { data } = (await withTimeout(supabase.auth.getSession(), 3000, "GET_SESSION_TIMEOUT_2")) as Awaited<
            ReturnType<typeof supabase.auth.getSession>
          >;
          return data.session ?? null;
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const run = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      if (!silent && !bootstrappedRef.current) setChecking(true);

      const session = await getSessionSafe();
      if (!mountedRef.current) return;

      setHasSession(!!session);
      setChecking(false);
      bootstrappedRef.current = true;
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    run({ silent: false });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setHasSession(!!session);
      setChecking(false);
      bootstrappedRef.current = true;
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") run({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mountedRef.current = false;
      listener?.subscription?.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-sky text-starlight-text">
        Carregando...
      </div>
    );
  }

  if (hasSession) return <Navigate to="/dashboard" replace />;
  return <HomeDeslogada />;
}

function LoginGate() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const bootstrappedRef = useRef(false);

  const withTimeout = async <T,>(p: Promise<T>, ms: number, code: string) => {
    return await Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(code)), ms))]);
  };

  const getCachedAuth = () => {
    try {
      const keys = Object.keys(localStorage || {}).filter((k) => k.startsWith("sb-") && k.includes("auth-token"));
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed?.access_token && parsed?.refresh_token) {
          const exp = Number(parsed.expires_at ?? 0);
          if (exp) {
            const now = Math.floor(Date.now() / 1000);
            if (exp <= now) continue;
          }
          return parsed;
        }
      }
    } catch {}
    return null;
  };

  const rehydrateSessionFromCache = async () => {
    const cached = getCachedAuth();
    if (!cached?.access_token || !cached?.refresh_token) return false;

    try {
      await withTimeout(
        supabase.auth.setSession({
          access_token: cached.access_token,
          refresh_token: cached.refresh_token,
        }),
        2000,
        "SET_SESSION_TIMEOUT",
      );
      return true;
    } catch {
      return false;
    }
  };

  const getSessionSafe = async () => {
    try {
      const { data } = (await withTimeout(supabase.auth.getSession(), 6000, "GET_SESSION_TIMEOUT")) as Awaited<
        ReturnType<typeof supabase.auth.getSession>
      >;
      return data.session ?? null;
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg === "GET_SESSION_TIMEOUT") {
        const ok = await rehydrateSessionFromCache();
        if (!ok) return null;

        try {
          const { data } = (await withTimeout(supabase.auth.getSession(), 3000, "GET_SESSION_TIMEOUT_2")) as Awaited<
            ReturnType<typeof supabase.auth.getSession>
          >;
          return data.session ?? null;
        } catch {
          return null;
        }
      }
      return null;
    }
  };

  const run = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      if (!silent && !bootstrappedRef.current) setChecking(true);

      const session = await getSessionSafe();
      if (!mountedRef.current) return;

      setHasSession(!!session);
      setChecking(false);
      bootstrappedRef.current = true;
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    run({ silent: false });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setHasSession(!!session);
      setChecking(false);
      bootstrappedRef.current = true;
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") run({ silent: true });
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mountedRef.current = false;
      listener?.subscription?.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-sky text-starlight-text">
        Carregando...
      </div>
    );
  }

  if (hasSession) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* / agora é gate: logado -> /dashboard | deslogado -> Landing */}
        <Route path="/" element={<LandingGate />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <HomeLogada />
            </ProtectedRoute>
          }
        />

        {/* Rotas “oficiais” em lowercase */}
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transaction-history"
          element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />

        {/* Compat: rotas antigas com maiúscula (caso existam links/menus antigos) */}
        <Route path="/History" element={<Navigate to="/history" replace />} />
        <Route path="/TransactionHistory" element={<Navigate to="/transaction-history" replace />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* /login também vira gate */}
        <Route path="/login" element={<LoginGate />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
