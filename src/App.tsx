import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { HomeDeslogada } from "./components/Landing";
import { HomeLogada } from "./components/HomeLogada";
import { Dashboard } from "./components/Dashboard";
import { History } from "./components/History";
import { TransactionHistory } from "./components/TransactionHistory";
import { Credits } from "./components/Credits";
import { Profile } from "./components/Profile";
import { Admin } from "./components/Admin";
import { Login } from "./components/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeDeslogada />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <HomeLogada />
            </ProtectedRoute>
          }
        />
        <Route
          path="/History"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/TransactionHistory"
          element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/credits"
          element={
            <ProtectedRoute>
              <Credits />
            </ProtectedRoute>
          }
        />
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
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        {/* Catch-all route - redirects any unmatched routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
