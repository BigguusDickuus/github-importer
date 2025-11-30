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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomeDeslogada />} />
        <Route path="/dashboard" element={<HomeLogada />} />
        <Route path="/historico" element={<History />} />
        <Route path="/transacoes" element={<TransactionHistory />} />
        <Route path="/creditos" element={<Credits />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        {/* Catch-all route - redirects any unmatched routes to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
