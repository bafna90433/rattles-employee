import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdExitToApp,
  MdAddCircleOutline,
  MdPrecisionManufacturing,
  MdFactory,
  MdPointOfSale,
  MdMenu,
  MdClose
} from "react-icons/md";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem("role");
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          {mobileOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
        <h2 className="mobile-logo">🧱 STOCK MANAGER</h2>
      </div>

      {/* Overlay for mobile */}
      {mobileOpen && <div className="sidebar-overlay" onClick={toggleMobileMenu}></div>}

      {/* Sidebar */}
      <div className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">🧱</div>
            <div className="logo-text">
              <h2>STOCK MANAGER</h2>
              <span>Inventory System</span>
            </div>
          </div>
          <button className="close-mobile" onClick={toggleMobileMenu}>
            <MdClose size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-group">
            <div className="sidebar-group-title">👷 Employee Workstation</div>
            <div className="sidebar-group-items">
              <div className={`nav-item ${location.pathname === "/employee/raw-add" ? "active" : ""}`}>
                <Link to="/employee/raw-add" onClick={() => setMobileOpen(false)}>
                  <div className="nav-icon">
                    <MdAddCircleOutline size={20} />
                  </div>
                  <span>Raw Material Entry</span>
                </Link>
              </div>

              <div className={`nav-item ${location.pathname === "/employee/packet-production" ? "active" : ""}`}>
                <Link to="/employee/packet-production" onClick={() => setMobileOpen(false)}>
                  <div className="nav-icon">
                    <MdPrecisionManufacturing size={20} />
                  </div>
                  <span>Packet Production</span>
                </Link>
              </div>

              <div className={`nav-item ${location.pathname === "/employee/production-list" ? "active" : ""}`}>
                <Link to="/employee/production-list" onClick={() => setMobileOpen(false)}>
                  <div className="nav-icon">
                    <MdFactory size={20} />
                  </div>
                  <span>Production Entries</span>
                </Link>
              </div>

              <div className={`nav-item ${location.pathname === "/employee/packet-sales" ? "active" : ""}`}>
                <Link to="/employee/packet-sales" onClick={() => setMobileOpen(false)}>
                  <div className="nav-icon">
                    <MdPointOfSale size={20} />
                  </div>
                  <span>Packet Sales</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <MdExitToApp size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;