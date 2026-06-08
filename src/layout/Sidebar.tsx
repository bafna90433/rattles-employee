import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MdDashboard, MdInventory, MdFactory, MdInventory2, MdPointOfSale,
  MdLogout, MdMenu, MdClose,
} from "react-icons/md";
import "./Sidebar.css";

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { path: "/employee/dashboard", label: "Home", icon: <MdDashboard /> },
    { path: "/employee/raw-add", label: "Raw Material", icon: <MdInventory /> },
    { path: "/employee/production-list", label: "Production", icon: <MdFactory /> },
    { path: "/employee/packet-production", label: "Packets", icon: <MdInventory2 /> },
    { path: "/employee/packet-sales", label: "Sales", icon: <MdPointOfSale /> },
  ];
  const logout = () => { localStorage.clear(); navigate("/"); };
  return <>
    <button className="floor-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <MdClose /> : <MdMenu />}</button>
    {mobileOpen && <div className="floor-overlay" onClick={() => setMobileOpen(false)} />}
    <aside className={`floor-sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="floor-menu-mark"><MdMenu /></div>
      <nav>
        {links.map((item) => <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={location.pathname === item.path ? "active" : ""}><span>{item.icon}</span><small>{item.label}</small></Link>)}
      </nav>
      <div className="floor-sidebar-bottom">
        <button onClick={logout}><span><MdLogout /></span><small>Logout</small></button>
      </div>
    </aside>
  </>;
};
export default Sidebar;
