import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    let isMounted = true;
    let inFlight = false;

    const getSessionWithTimeout = async (ms: number) => {
      return await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("GET_SESSION_TIMEOUT")), ms)),
      ]);
    };

    const run = async () => {
      if (inFlight) return;
      inFlight = true;

      try {
        setChecking(true);
        const { data } = (await getSessionWithTimeout(2500)) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (!isMounted) return;
        setHasSession(!!data.session);
        setChecking(false);
      } catch (err) {
        console.error("LandingGate: erro ao checar sessão:", err);
        if (!isMounted) return;
        setHasSession(false);
        setChecking(false);
      } finally {
        inFlight = false;
      }
    };

    run();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setHasSession(!!session);
      setChecking(false);
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        run();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
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

  useEffect(() => {
    let isMounted = true;
    let inFlight = false;

    const getSessionWithTimeout = async (ms: number) => {
      return await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("GET_SESSION_TIMEOUT")), ms)),
      ]);
    };

    const run = async () => {
      if (inFlight) return;
      inFlight = true;

      try {
        setChecking(true);
        const { data } = (await getSessionWithTimeout(2500)) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (!isMounted) return;
        setHasSession(!!data.session);
        setChecking(false);
      } catch (err) {
        console.error("LoginGate: erro ao checar sessão:", err);
        if (!isMounted) return;
        setHasSession(false);
        setChecking(false);
      } finally {
        inFlight = false;
      }
    };

    run();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setHasSession(!!session);
      setChecking(false);
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        run();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
      document.removeEventListener("visibilitychange", onVisibility);
    };
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
