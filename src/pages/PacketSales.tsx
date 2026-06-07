import React, { useEffect, useState } from "react";
import "../styles/PacketProduction.css";
import "../styles/EmployeeWorkflow.css";
import { getImageUrl } from "../utils/image";

const PacketSales: React.FC = () => {
  const [packets, setPackets] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedPacket, setSelectedPacket] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [soldTo, setSoldTo] = useState("");
  const [entryBy, setEntryBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  // 🧭 Load packet stock + sales
  const loadData = async () => {
    const p = await (window as any).electronAPI.getPacketStock?.();
    const s = await (window as any).electronAPI.getPacketSales?.();
    setPackets(p || []);
    setSales(s || []);
  };

  useEffect(() => {
    loadData();

    // 🔁 Listen to any stock update event (from other tabs/pages)
    const listener = () => loadData();
    window.addEventListener("stock-updated", listener);

    return () => window.removeEventListener("stock-updated", listener);
  }, []);

  // 💾 Save Sale
  const handleSave = async () => {
    if (!selectedPacket || qty <= 0) {
      showMessage("⚠️ Please select a packet and enter valid quantity!", "error");
      return;
    }

    const selected = packets.find((p) => p.packet_code === selectedPacket);
    if (selected && qty > selected.total_qty) {
      showMessage(`⚠️ Not enough stock! Available: ${selected.total_qty}`, "error");
      return;
    }

    setLoading(true);
    try {
      const res = await (window as any).electronAPI.savePacketSale?.({
        packet_code: selectedPacket,
        qty,
        sold_to: soldTo || "N/A",
        entry_by: entryBy || "User",
      });

      showMessage(res || "✅ Sale recorded successfully!", "success");

      // Reset form
      setQty(0);
      setSoldTo("");
      setEntryBy("");
      setSelectedPacket("");

      // 🔄 Refresh stock + sales instantly
      await loadData();

      // 🔔 Notify other pages like PacketStock
      window.dispatchEvent(new Event("stock-updated"));
      
      // Auto-toggle to logs tab
      setActiveTab("list");
    } catch (err) {
      console.error("❌ Error during sale:", err);
      showMessage("❌ Error saving sale!", "error");
    }
    setLoading(false);
  };

  // 📢 Toast / message
  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 2500);
  };

  // 🧩 Get image for a packet
  const getPacketImage = (packet_code: string) => {
    const packet = packets.find((p) => p.packet_code === packet_code);
    return packet?.sample_image ? getImageUrl(packet.sample_image) : "";
  };

  const activePacketObj = packets.find((p) => p.packet_code === selectedPacket);

  const resetForm = () => {
    setSelectedPacket("");
    setQty(0);
    setSoldTo("");
    setEntryBy("");
  };

  return (
    <div className="packet-sales-container">
      <h2>💰 Packet Sales Entry & Logs</h2>

      {/* 🌟 Inline Message */}
      {message.text && (
        <div
          style={{
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#b91c1c",
            padding: "12px 16px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontWeight: 500,
            border: message.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {message.text}
        </div>
      )}

      {/* 🔀 Tabs */}
      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === "entry" ? "active" : ""}`}
          onClick={() => setActiveTab("entry")}
        >
          ➕ Packet Sales Entry
        </button>
        <button
          className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          📋 View Sales History
        </button>
      </div>

      {/* 🧱 CREATE ENTRY */}
      {activeTab === "entry" && (
        <div className="entry-dashboard">
          {/* Left Column: Form Section */}
          <div className="form-column">
            {/* Panel 1: Selection (Blue Accent) */}
            <div className="flat-section product-part-section">
              <h3>📦 Packet Selection</h3>
              <div className="selector-group">
                <label>Packet Code:</label>
                <div className="selector-input-wrapper">
                  <select
                    value={selectedPacket}
                    onChange={(e) => setSelectedPacket(e.target.value)}
                  >
                    <option value="">-- Select Packet --</option>
                    {packets.map((p, i) => (
                      <option key={i} value={p.packet_code}>
                        {p.packet_code} ({p.total_qty} available)
                      </option>
                    ))}
                  </select>
                  {selectedPacket && getPacketImage(selectedPacket) && (
                    <div className="mini-preview-thumbnail">
                      <img
                        src={getPacketImage(selectedPacket)}
                        alt={selectedPacket}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel 2: Sale Details (Green Accent) */}
            <div className="flat-section details-section">
              <h3>🔢 Sale Specifications</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min={1}
                    value={qty || ""}
                    onChange={(e) => setQty(Number(e.target.value))}
                    placeholder="Enter sale quantity"
                  />
                </div>

                <div className="form-group">
                  <label>Sold To:</label>
                  <input
                    type="text"
                    value={soldTo}
                    onChange={(e) => setSoldTo(e.target.value)}
                    placeholder="Customer name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ gridColumn: "span 2" }}>
                  <label>Entry By:</label>
                  <input
                    type="text"
                    value={entryBy}
                    onChange={(e) => setEntryBy(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button onClick={handleSave} className="btn btn-save" disabled={loading}>
                  {loading ? "⏳ Saving..." : "💾 Save Sale"}
                </button>
                <button onClick={resetForm} className="btn btn-reset">
                  🔄 Clear Form
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Live Preview */}
          <div className="preview-column">
            <div className="sticky-preview-panel">
              <h3>👀 Live Sales Preview</h3>
              <div className="preview-summary-card">
                {/* Visual Header Banner */}
                <div className="preview-visual-banner">
                  <div className="visual-half" style={{ width: "100%" }}>
                    <span className="visual-tag">Selected Packet Design</span>
                    {selectedPacket ? (
                      <div className="visual-content">
                        {getPacketImage(selectedPacket) ? (
                          <img
                            src={getPacketImage(selectedPacket)}
                            alt="Packet Sample"
                          />
                        ) : (
                          <div className="visual-placeholder">
                            <span className="ph-icon">🖼️</span>
                            <span>No Sample Image</span>
                          </div>
                        )}
                        <span className="badge badge-blue">{selectedPacket}</span>
                      </div>
                    ) : (
                      <div className="visual-placeholder" style={{ width: "120px", height: "120px" }}>
                        <span className="ph-icon">📦</span>
                        <span>No Packet Selected</span>
                      </div>
                    )}
                  </div>
                </div>

                {activePacketObj && (
                  <>
                    <hr className="preview-divider" />
                    <div className="preview-stats-row" style={{ marginBottom: "12px" }}>
                      <div className="stat-box">
                        <span className="stat-label">Current Available Stock</span>
                        <span className="stat-value" style={{ color: "#3b82f6" }}>
                          {activePacketObj.total_qty} pcs
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <hr className="preview-divider" />

                <div className="preview-stats-row">
                  <div className="stat-box">
                    <span className="stat-label">Qty to Sell</span>
                    <span className="stat-value text-success" style={{ color: "#ef4444" }}>
                      {qty > 0 ? `-${qty}` : 0}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Sold To</span>
                    <span className="stat-value operator-name">{soldTo || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 LIST VIEW */}
      {activeTab === "list" && (
        <div className="form-card">
          <h3>📋 Sales History Log</h3>
          <div className="sales-history">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Packet Code</th>
                  <th>Quantity</th>
                  <th>Sold To</th>
                  <th>Entered By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>
                      No sales found
                    </td>
                  </tr>
                ) : (
                  sales.map((s, i) => (
                    <tr key={i}>
                      <td>
                        {getPacketImage(s.packet_code) ? (
                          <img
                            src={getPacketImage(s.packet_code)}
                            alt="Sample"
                            width={50}
                            height={50}
                            className="clickable-thumbnail"
                            onClick={() => setPreviewModalImg(getPacketImage(s.packet_code))}
                            style={{
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              objectFit: "cover",
                              backgroundColor: "#fff",
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.packet_code}</td>
                      <td style={{ color: "#ef4444", fontWeight: 700 }}>{s.qty}</td>
                      <td>{s.sold_to}</td>
                      <td>{s.entry_by}</td>
                      <td>
                        {new Date(s.date).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 🖼️ Global Zoom Preview Modal */}
      {previewModalImg && (
        <div className="image-preview-modal-overlay" onClick={() => setPreviewModalImg(null)}>
          <div className="image-preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview-modal" onClick={() => setPreviewModalImg(null)}>✕</button>
            <img src={previewModalImg} alt="Large Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PacketSales;
