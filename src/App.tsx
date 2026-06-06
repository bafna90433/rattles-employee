import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";

// 🧩 Pages
import RawMaterialEntry from "./pages/RawMaterialEntry";
import PacketProduction from "./pages/PacketProduction";
import PacketProductionEntries from "./pages/PacketProductionEntries";
import ProductionList from "./pages/ProductionList";
import PacketSales from "./pages/PacketSales";

// 🔐 Login
import EmployeeLogin from "./pages/EmployeeLogin";

// 🔒 Protected Route
const ProtectedRoute: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const role = localStorage.getItem("role");
  return allowedRoles.includes(role || "") ? <>{children}</> : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Employee Login at Root */}
        <Route path="/" element={<EmployeeLogin />} />
        <Route path="/employee-login" element={<Navigate to="/" replace />} />

        {/* 👷 EMPLOYEE ROUTES */}
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <Layout>
                <Routes>
                  <Route path="raw-add" element={<RawMaterialEntry />} />
                  <Route path="packet-production" element={<PacketProduction />} />
                  <Route path="packet-production-entries" element={<PacketProductionEntries />} />
                  <Route path="production-list" element={<ProductionList />} />
                  <Route path="packet-sales" element={<PacketSales />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
