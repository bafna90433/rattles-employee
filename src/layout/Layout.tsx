import React from "react";
import { useLocation } from "react-router-dom";
import { MdAccessTime, MdOutlineCalendarToday } from "react-icons/md";
import Sidebar from "./Sidebar";
import "./Sidebar.css";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const username = localStorage.getItem("username") || "employee";
  const isDashboard = location.pathname === "/employee/dashboard";
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        {!isDashboard && <header className="workflow-topbar">
          <div className="workflow-brand"><span>BS</span><div><strong>Bafna Stock</strong><small>Rattle Toys Workspace</small></div></div>
          <div className="workflow-shift"><b>Shift A</b><small>08:00 AM - 04:00 PM</small></div>
          <div className="workflow-status"><i /><div><span>Floor Status</span><strong>Running Smooth</strong></div></div>
          <div className="workflow-operator"><strong>{username}</strong><small>Production Operator</small></div>
          <div className="workflow-clock"><MdOutlineCalendarToday /><span>{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}<small><MdAccessTime /> {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small></span></div>
        </header>}
        {children}
      </div>
    </div>
  );
};

export default Layout;
