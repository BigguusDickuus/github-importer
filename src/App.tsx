import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase, resetSupabaseClient } from "@/integrations/supabase/client";
import { HomeDeslogada } from "./components/Landing";
import { HomeLogada } from "./components/HomeLogada";
import { History } from "./components/History";
import { TransactionHistory } from "./components/TransactionHistory";
import { Profile } from "./components/Profile";
import { Admin } from "./components/Admin";
import { Login } from "./components/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ResetPassword } from "./components/ResetPassword";

const MFA_BUSY_UNTIL_KEY = "to_mfa_busy_until";
const isMfaBusy = () => {
  try {
    const until = Number(sessionStorage.getItem(MFA_BUSY_UNTIL_KEY) || "0");
    return until > 0 && Date.now() < until;
  } catch {
    return false;
  }
};

const getUserWithTimeout = async (timeoutMs: number) => {
  let timerId: number | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = window.setTimeout(() => reject(new Error("GET_USER_TIMEOUT")), timeoutMs);
  });

  try {
    const res = (await Promise.race([supabase.auth.getUser(), timeoutPromise])) as any;
    return res as { data: { user: any | null }; error: any };
  } finally {
    if (timerId !== null) window.clearTimeout(timerId);
  }
};

const getStoredUserId = (): string | null => {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (!/^sb-.*-auth-token$/.test(k)) continue;

      const raw = localStorage.getItem(k);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      const id = parsed?.user?.id ?? parsed?.currentSession?.user?.id ?? null;
      if (id) return id;
    }
  } catch {}
  return null;
};

const hasStoredSession = () => !!getStoredUserId();

const isGetUserTimeout = (err: any) => {
  const msg = String(err?.message ?? err ?? "");
  return msg.includes("GET_USER_TIMEOUT");
};

function LandingGate() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const run = async (opts?: { bootstrap?: boolean }) => {
    const bootstrap = opts?.bootstrap ?? false;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (bootstrap) setChecking(true);

    // Watchdog só se NÃO estiver em MFA (durante MFA o user troca de app/aba mesmo)
    const watchdog = window.setTimeout(() => {
      if (!isMfaBusy() && document.visibilityState === "visible") {
        console.warn("LandingGate: auth travou; recarregando página para destravar.");
        window.location.reload();
      }
    }, 12000);

    try {
      const { data, error } = await getUserWithTimeout(3500);
      if (!mountedRef.current) return;

      const stored = hasStoredSession();

      if (error) {
        console.error("LandingGate: erro getUser:", error);
        // Timeout/erro não significa “deslogado” — usa fallback do storage
        setHasSession(stored);
      } else {
        setHasSession(!!data.user || stored);
      }
    } catch (e: any) {
      if (!mountedRef.current) return;
      console.error("LandingGate: getUser timeout/erro:", e);
      // Não derruba sessão por timeout
      setHasSession(hasStoredSession());
    } finally {
      clearTimeout(watchdog);
      inFlightRef.current = false;
      if (mountedRef.current) setChecking(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    run({ bootstrap: true });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setHasSession(!!session);
      setChecking(false);
    });

    const wake = () => {
      if (document.visibilityState !== "visible") return;

      // Durante MFA, NÃO revalida no wake (isso é o que causava lock/reload).
      if (isMfaBusy()) return;

      try {
        resetSupabaseClient();
      } catch {}

      run({ bootstrap: false });
    };

    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);

    return () => {
      mountedRef.current = false;
      listener?.subscription?.unsubscribe();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
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

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const run = async (opts?: { bootstrap?: boolean }) => {
    const bootstrap = opts?.bootstrap ?? false;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (bootstrap) setChecking(true);

    const watchdog = window.setTimeout(() => {
      if (!isMfaBusy() && document.visibilityState === "visible") {
        console.warn("LoginGate: auth travou; recarregando página para destravar.");
        window.location.reload();
      }
    }, 12000);

    try {
      const { data, error } = await getUserWithTimeout(3500);
      if (!mountedRef.current) return;

      const stored = hasStoredSession();

      if (error) {
        console.error("LoginGate: erro getUser:", error);
        // Timeout/erro não significa “deslogado” — usa fallback do storage
        setHasSession(stored);
      } else {
        setHasSession(!!data.user || stored);
      }
    } catch (e: any) {
      if (!mountedRef.current) return;
      console.error("LoginGate: getUser timeout/erro:", e);
      // Não derruba sessão por timeout
      setHasSession(hasStoredSession());
    } finally {
      clearTimeout(watchdog);
      inFlightRef.current = false;
      if (mountedRef.current) setChecking(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    run({ bootstrap: true });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setHasSession(!!session);
      setChecking(false);
    });

    const wake = () => {
      if (document.visibilityState !== "visible") return;
      if (isMfaBusy()) return;

      try {
        resetSupabaseClient();
      } catch {}

      run({ bootstrap: false });
    };

    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);

    return () => {
      mountedRef.current = false;
      listener?.subscription?.unsubscribe();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
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
        <Route path="/" element={<LandingGate />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <HomeLogada />
            </ProtectedRoute>
          }
        />

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

        <Route path="/login" element={<LoginGate />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
