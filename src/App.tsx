import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase, resetSupabaseClient } from "@/integrations/supabase/client";
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

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const canReloadNow = () => {
    const key = "to_wakeup_reload_ts";
    const last = Number(sessionStorage.getItem(key) || "0");
    const now = Date.now();
    if (now - last < 15000) return false; // no máx 1 reload a cada 15s por aba
    sessionStorage.setItem(key, String(now));
    return true;
  };

  const run = async (opts?: { bootstrap?: boolean }) => {
    const bootstrap = opts?.bootstrap ?? false;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (bootstrap) setChecking(true);

    // Watchdog: se auth travar de novo (caso raro), reload resolve o lock de verdade.
    const watchdog = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        console.warn("LandingGate: auth travou; recarregando página para destravar.");
        window.location.reload();
      }
    }, 12000);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (!mountedRef.current) return;

      if (error) {
        console.error("LandingGate: erro getSession:", error);
        setHasSession(false);
      } else {
        setHasSession(!!data.session);
      }
    } finally {
      clearTimeout(watchdog);
      inFlightRef.current = false;
      if (mountedRef.current) setChecking(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Bootstrap inicial (pode mostrar "Carregando...")
    run({ bootstrap: true });

    // Mantém sincronizado com login/logout sem precisar ficar chamando getSession em loop
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      setHasSession(!!session);
      setChecking(false);
    });

    // Ao voltar pra aba: revalida em background (não seta checking=true)
    const wake = () => {
      if (document.visibilityState !== "visible") return;

      // Se existe uma checagem travada, run() nunca vai rodar (inFlightRef fica true).
      // Então: reload imediato ao voltar pra aba.
      if (inFlightRef.current) {
        if (canReloadNow()) {
          console.warn("LandingGate: voltou pra aba com inFlight travado. Reload imediato.");
          window.location.reload();
        }
        return;
      }

      // Caso normal: reseta o client e revalida em background
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

  const canReloadNow = () => {
    const key = "to_wakeup_reload_ts";
    const last = Number(sessionStorage.getItem(key) || "0");
    const now = Date.now();
    if (now - last < 15000) return false;
    sessionStorage.setItem(key, String(now));
    return true;
  };

  const run = async (opts?: { bootstrap?: boolean }) => {
    const bootstrap = opts?.bootstrap ?? false;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (bootstrap) setChecking(true);

    const watchdog = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        console.warn("LoginGate: auth travou; recarregando página para destravar.");
        window.location.reload();
      }
    }, 12000);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (!mountedRef.current) return;

      if (error) {
        console.error("LoginGate: erro getSession:", error);
        setHasSession(false);
      } else {
        setHasSession(!!data.session);
      }
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

      if (inFlightRef.current) {
        if (canReloadNow()) {
          console.warn("LoginGate: voltou pra aba com inFlight travado. Reload imediato.");
          window.location.reload();
        }
        return;
      }

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
