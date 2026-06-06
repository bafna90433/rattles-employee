import React, { useState } from "react";
import "../styles/Login.css";
import { useNavigate } from "react-router-dom";

const EmployeeLogin: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await window.electronAPI.loginUser({
        username,
        password,
        role: "employee",
      });

      if (res.success) {
        localStorage.setItem("role", "employee");
        alert("✅ Login successful!");
        navigate("/employee/raw-add");
      } else {
        alert(res.message || "❌ Invalid credentials");
      }
    } catch (err) {
      console.error("⚠️ Login error:", err);
      alert("⚠️ Something went wrong.");
    }
  };

  return (
    <div className="login-wrapper employee-theme"> {/* Employee theme (Teal/Cyan) applied */}
      {/* LEFT SIDE FORM */}
      <div className="login-left">
        <div className="login-content">
          <h1 className="login-title">
            👷 Employee Login
          </h1>
          <p className="login-subtitle">Access your work dashboard securely</p>

          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="submit-btn" onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>

      {/* RIGHT SIDE IMAGE */}
      <div className="login-right">
        <img
          src="/assets/employee-login-banner.png"
          alt="Employee Login Banner"
          className="login-side-image"
        />
      </div>
    </div>
  );
};

export default EmployeeLogin;