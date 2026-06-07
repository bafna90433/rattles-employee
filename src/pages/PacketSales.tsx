import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PacketSales.css";
import "../styles/EmployeeWorkflow.css";
import { getImageUrl } from "../utils/image";
import { MdOutlineInfo, MdCheck, MdRefresh, MdArrowBack } from "react-icons/md";

const PacketSales: React.FC = () => {
  const navigate = useNavigate();
  const [packets, setPackets] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedPacket, setSelectedPacket] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [qty, setQty] = useState<number>(0);
  const [entryBy, setEntryBy] = useState(() => localStorage.getItem("username") || "RISHI KUMAR (OP-0147)");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  // 🧭 Load packet stock + sales
  const loadData = async () => {
    try {
      const p = await (window as any).electronAPI.getPacketStock?.();
      const s = await (window as any).electronAPI.getPacketSales?.();
      setPackets(p || []);
      setSales(s || []);
    } catch (err) {
      console.error("❌ Error loading packet stock & sales details:", err);
    }
  };

  useEffect(() => {
    loadData();

    // 🔁 Listen to any stock update event (from other tabs/pages)
    const listener = () => loadData();
    window.addEventListener("stock-updated", listener);

    return () => window.removeEventListener("stock-updated", listener);
  }, []);

  const activePacketObj = packets.find(
    (p) => p.packet_code === selectedPacket && p.group_name === selectedGroup
  );

  const isStockAvailable = activePacketObj ? qty > 0 && qty <= activePacketObj.total_qty : false;

  // 💾 Save Sale
  const handleSave = async () => {
    if (!selectedPacket || qty <= 0) {
      showMessage("⚠️ Please select a packet and enter valid quantity!", "error");
      return;
    }
    if (!entryBy.trim()) {
      showMessage("⚠️ Please select an operator name!", "error");
      return;
    }
    if (!isStockAvailable) {
      showMessage("❌ Cannot complete dispatch: Insufficient stock available!", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await (window as any).electronAPI.savePacketSale?.({
        packet_code: selectedPacket,
        qty,
        sold_to: "N/A", // Customer info removed by user request
        entry_by: entryBy || "User",
      });

      showMessage(res || "✅ Dispatch completed successfully!", "success");

      // Reset form
      resetForm();

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

  const resetForm = () => {
    setSelectedPacket("");
    setSelectedGroup("");
    setQty(0);
    setEntryBy(localStorage.getItem("username") || "RISHI KUMAR (OP-0147)");
  };

  const getCurrentStep = () => {
    if (!selectedPacket) return 1;
    if (!isStockAvailable) return 2;
    return 3;
  };

  const currentStep = getCurrentStep();

  const steps = [
    {
      num: 1,
      title: "Select Ready Packet",
      desc: "Choose a packet to dispatch",
      done: !!selectedPacket,
    },
    {
      num: 2,
      title: "Confirm Stock",
      desc: "Check availability & qty",
      done: !!selectedPacket && isStockAvailable,
    },
    {
      num: 3,
      title: "Complete Sale",
      desc: "Select operator & dispatch",
      done: !!selectedPacket && isStockAvailable && !!entryBy.trim(),
    },
  ];

  const getTicketStatusClass = () => {
    if (!selectedPacket) return "draft";
    return isStockAvailable ? "ready" : "warning";
  };

  const getTicketStatusLabel = () => {
    if (!selectedPacket) return "Draft";
    return isStockAvailable ? "Ready" : "No Stock";
  };

  return (
    <div className="packet-sales-container">
      {/* Page Header */}
      <div className="packet-dispatch-header">
        <div className="header-brand-block">
          <button
            onClick={() => navigate("/employee/dashboard")}
            style={{
              background: "transparent",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "8px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              marginRight: "8px",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#f1f5f9";
              e.currentTarget.style.color = "#0f172a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#475569";
            }}
          >
            <MdArrowBack /> Back
          </button>
          <div className="brand-badge-sales">
            🚚
          </div>
          <div>
            <h1>Rattle Packet Dispatch & Sale</h1>
            <p>Select ready packets, enter operator details and complete dispatch.</p>
          </div>
        </div>
        <button
          className="history-toggle-btn-sales"
          onClick={() => setActiveTab(activeTab === "entry" ? "list" : "entry")}
        >
          {activeTab === "entry" ? "📋 View All Dispatches" : "🚚 Back to Dispatch"}
        </button>
      </div>

      {/* 🌟 Inline Message Toast */}
      {message.text && (
        <div
          style={{
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#b91c1c",
            padding: "12px 16px",
            borderRadius: "8px",
            fontWeight: 600,
            border: message.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            animation: "modalFadeIn 0.2s ease-out",
          }}
        >
          {message.text}
        </div>
      )}

      {/* 🧱 CREATE ENTRY TAB */}
      {activeTab === "entry" && (
        <div className="packet-dispatch-layout">
          {/* Column 1: Progress Stepper */}
          <div className="dispatch-stepper">
            {steps.map((step) => {
              const isActive = currentStep === step.num;
              const isCompleted = step.done && !isActive;
              return (
                <div
                  key={step.num}
                  className={`stepper-step-sales ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                >
                  <div className="step-circle-sales">{step.num}</div>
                  <div className="step-text">
                    <strong>{step.title}</strong>
                    <small>{step.desc}</small>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Column 2: Form Section cards */}
          <div className="dispatch-main-column">
            {/* Panel 1: Ready Packet Selection */}
            <div className="dispatch-card">
              <div className="card-header">
                <h3>1. Select Ready Packet</h3>
              </div>
              <div className="card-body">
                <div className="selected-sales-visual">
                  <div className="sales-visual-box">
                    {selectedPacket && activePacketObj?.sample_image ? (
                      <img
                        src={getImageUrl(activePacketObj.sample_image)}
                        alt="Packet Sample"
                        className="clickable-thumbnail"
                        onClick={() => setPreviewModalImg(getImageUrl(activePacketObj.sample_image))}
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#94a3b8" }}>
                        <span style={{ fontSize: "36px" }}>📦</span>
                        <span style={{ fontSize: "11px", fontWeight: 600 }}>No Packet</span>
                      </div>
                    )}
                  </div>

                  <div className="sales-info-box">
                    <div className="dispatch-form-grid" style={{ gap: "12px" }}>
                      <div className="dispatch-field-group">
                        <label>Packet Code *</label>
                        <select
                          value={selectedPacket && selectedGroup ? `${selectedPacket}|${selectedGroup}` : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [code, group] = val.split("|");
                              setSelectedPacket(code);
                              setSelectedGroup(group);
                              if (qty <= 0) setQty(10);
                            } else {
                              setSelectedPacket("");
                              setSelectedGroup("");
                              setQty(0);
                            }
                          }}
                        >
                          <option value="">-- Select Packet --</option>
                          {packets.map((p, i) => (
                            <option key={i} value={`${p.packet_code}|${p.group_name}`}>
                              {p.packet_code} ({p.group_name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="dispatch-field-group">
                        <label>Packet Group</label>
                        <input
                          type="text"
                          value={selectedGroup}
                          disabled
                          placeholder="Auto-filled"
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: "12px" }}>
                      <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 650 }}>Description</label>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1e293b", marginTop: "2px" }}>
                        {selectedPacket ? "Rattle Toy Packet" : "Select a packet style"}
                      </div>
                    </div>

                    {selectedPacket && activePacketObj && (
                      <div style={{ marginTop: "12px" }}>
                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 650, display: "block", marginBottom: "4px" }}>Current Stock</span>
                        <span className="stock-pill">
                          📦 {activePacketObj.total_qty} packets
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quantity Stepper selector */}
                  <div className="qty-stepper-sales-panel">
                    <label>Sale Quantity *</label>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}>
                      <button
                        type="button"
                        className="sales-change-btn"
                        style={{ fontSize: "20px", padding: 0, width: "36px", height: "36px", display: "grid", placeItems: "center" }}
                        onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                        disabled={!selectedPacket}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={qty || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setQty(val >= 0 ? val : 0);
                        }}
                        style={{
                          width: "55px",
                          height: "36px",
                          textAlign: "center",
                          fontSize: "15px",
                          fontWeight: 700,
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          outline: "none"
                        }}
                        disabled={!selectedPacket}
                        min={1}
                      />
                      <button
                        type="button"
                        className="sales-change-btn"
                        style={{ fontSize: "20px", padding: 0, width: "36px", height: "36px", display: "grid", placeItems: "center" }}
                        onClick={() => setQty((prev) => prev + 1)}
                        disabled={!selectedPacket}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b", textAlign: "center", marginTop: "4px" }}>
                      {selectedPacket && activePacketObj ? `Available: ${activePacketObj.total_qty} packets` : "Choose a packet"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Operator Details */}
            <div className="dispatch-card">
              <div className="card-header">
                <h3>Operator Information</h3>
              </div>
              <div className="card-body">
                <div className="dispatch-form-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="dispatch-field-group">
                    <label>Operator Name *</label>
                    <input
                      type="text"
                      value={entryBy}
                      onChange={(e) => setEntryBy(e.target.value)}
                      placeholder="Enter operator name"
                      required
                    />
                  </div>

                  <div className="fifo-callout" style={{ gridColumn: "span 1" }}>
                    <MdOutlineInfo style={{ fontSize: "16px", flexShrink: 0 }} />
                    <span>FIFO will be applied automatically. Oldest packets will be dispatched first.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Live Dispatch Ticket */}
          <div className="dispatch-ticket-column">
            <div className="dispatch-ticket">
              <div className="ticket-header">
                <h3>Live Dispatch Ticket</h3>
                <span className={`ticket-status-sales ${getTicketStatusClass()}`}>
                  {getTicketStatusLabel()}
                </span>
              </div>
              <div className="ticket-body">
                {/* Visual Thumbnail */}
                <div className="ticket-visual-preview-sales">
                  {selectedPacket && activePacketObj?.sample_image ? (
                    <img
                      src={getImageUrl(activePacketObj.sample_image)}
                      alt="Ticket Preview"
                      className="clickable-thumbnail"
                      onClick={() => setPreviewModalImg(getImageUrl(activePacketObj.sample_image))}
                    />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#94a3b8" }}>
                      <span style={{ fontSize: "40px" }}>🖼️</span>
                      <span style={{ fontSize: "11px", fontWeight: 600 }}>No Preview</span>
                    </div>
                  )}
                </div>

                {/* Info details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Packet</span>
                    <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                      {selectedPacket ? `${selectedPacket} (${selectedGroup})` : "—"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Description</span>
                    <span style={{ fontSize: "12.5px", color: "#334155", fontWeight: 500 }}>
                      {selectedPacket ? "Rattle Toy Packet" : "—"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Sale Quantity</span>
                    <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                      {qty > 0 ? `${qty} packets` : "—"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Operator</span>
                    <span style={{ fontSize: "12.5px", color: "#334155", fontWeight: 500 }}>
                      {entryBy || "—"}
                    </span>
                  </div>
                </div>

                {/* Remaining stock display */}
                <div className={`remaining-stock-box ${selectedPacket && activePacketObj && qty > activePacketObj.total_qty ? "out" : ""}`}>
                  <span className="label">Remaining Stock After Sale</span>
                  <span className="val">
                    {selectedPacket && activePacketObj ? `${activePacketObj.total_qty - qty} packets` : "—"}
                  </span>
                </div>

                {/* Stock Validation banner */}
                {selectedPacket && qty > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      background: isStockAvailable ? "#f0fdf4" : "#fef2f2",
                      border: `1.5px solid ${isStockAvailable ? "#bbf7d0" : "#fca5a5"}`,
                      color: isStockAvailable ? "#15803d" : "#b91c1c",
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{isStockAvailable ? "✅" : "⚠️"}</span>
                    <div>
                      <strong>Stock validation: {isStockAvailable ? "OK" : "FAILED"}</strong>
                      <div style={{ fontSize: "11px", fontWeight: 500, color: isStockAvailable ? "#166534" : "#991b1b", marginTop: "2px" }}>
                        {isStockAvailable ? "Enough stock available for dispatch." : "Insufficient stock available for dispatch."}
                      </div>
                    </div>
                  </div>
                )}

                {/* Visual Boxes decoration */}
                <div style={{ display: "flex", justifyContent: "center", gap: "10px", fontSize: "36px", padding: "8px 0" }}>
                  📦📦🚚
                </div>
              </div>

              {/* Actions */}
              <div className="ticket-actions-sales">
                <button
                  className="btn btn-save"
                  onClick={handleSave}
                  disabled={loading || !selectedPacket || qty <= 0 || !entryBy.trim() || !isStockAvailable}
                >
                  <MdCheck style={{ fontSize: "18px" }} />
                  {loading ? "Processing..." : "Complete Dispatch"}
                </button>
                <button className="btn btn-reset" onClick={resetForm}>
                  <MdRefresh style={{ fontSize: "18px" }} />
                  Clear & Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 LIST VIEW LOGS TAB */}
      {activeTab === "list" && (
        <div className="dispatch-recent-ledger" style={{ marginTop: 0 }}>
          <div className="ledger-head">
            <div>
              <h3>📋 Recent Dispatch / Sales Ledger</h3>
              <p>View all recent dispatch transactions and sales logs.</p>
            </div>
          </div>
          <div className="ledger-scroll">
            <table className="product-table">
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>PACKET</th>
                  <th>PACKET CODE / GROUP</th>
                  <th>CUSTOMER</th>
                  <th>QTY</th>
                  <th>OPERATOR</th>
                  <th>DISPATCH REF / INVOICE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "#94a3b8", padding: "24px" }}>
                      No sales found
                    </td>
                  </tr>
                ) : (
                  sales.map((s, i) => {
                    // Match combination group and sample image
                    const matchPacket = packets.find((p) => p.packet_code === s.packet_code);
                    const groupName = matchPacket ? matchPacket.group_name : "—";
                    const sampleImage = matchPacket ? matchPacket.sample_image : "";

                    // Parse sold_to: "Customer | Invoice | Remarks"
                    const parts = (s.sold_to || "").split(" | ");
                    const customerName = parts[0] || s.sold_to || "N/A";
                    const invoiceNo = parts[1] || "—";
                    const remarksText = parts[2] ? ` (Remarks: ${parts[2]})` : "";

                    const dateObj = new Date(s.date);
                    const timeStr = dateObj.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    });
                    const dateStr = dateObj.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <tr key={i}>
                        <td style={{ whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{timeStr}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{dateStr}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {sampleImage ? (
                              <img
                                src={getImageUrl(sampleImage)}
                                alt={s.packet_code}
                                width={40}
                                height={40}
                                className="clickable-thumbnail"
                                onClick={() => setPreviewModalImg(getImageUrl(sampleImage))}
                                style={{
                                  borderRadius: "6px",
                                  border: "1px solid #e2e8f0",
                                  objectFit: "cover",
                                  backgroundColor: "#fff",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "6px",
                                  border: "1px solid #e2e8f0",
                                  backgroundColor: "#f8fafc",
                                  display: "grid",
                                  placeItems: "center",
                                  fontSize: "20px",
                                }}
                              >
                                📦
                              </div>
                            )}
                            <span style={{ fontWeight: 650, color: "#334155" }}>Rattle Toy Packet</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: "#ea580c" }}>{s.packet_code}</div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>Group: {groupName}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{customerName}</div>
                          {remarksText && <div style={{ fontSize: "11px", color: "#c2410c", fontStyle: "italic" }}>{remarksText}</div>}
                        </td>
                        <td style={{ fontWeight: 700, color: "#1e293b" }}>
                          {s.qty} packets
                        </td>
                        <td style={{ fontWeight: 500, color: "#475569" }}>
                          {s.entry_by}
                        </td>
                        <td style={{ fontFamily: "monospace", fontWeight: 600, color: "#475569" }}>
                          {invoiceNo}
                        </td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              backgroundColor: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "#065f46",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "11.5px",
                              fontWeight: 700,
                            }}
                          >
                            ✅ Completed
                          </span>
                        </td>
                      </tr>
                    );
                  })
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
