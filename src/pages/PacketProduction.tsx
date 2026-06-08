import React, { useEffect, useState } from "react";
import "../styles/PacketProduction.css";
import "../styles/EmployeeWorkflow.css";
import { getImageUrl } from "../utils/image";

const PacketProduction: React.FC = () => {
  const [packets, setPackets] = useState<any[]>([]);
  const [combinations, setCombinations] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // Expanded local states to resolve specs and stock levels
  const [toyCombinations, setToyCombinations] = useState<any[]>([]);
  const [producedProducts, setProducedProducts] = useState<any[]>([]);
  const [rawStock, setRawStock] = useState<any[]>([]);

  const [selectedPacket, setSelectedPacket] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groupImage, setGroupImage] = useState<string>("");
  const [qty, setQty] = useState<number>(0);
  const [entryBy, setEntryBy] = useState("");

  // Helper to fetch packet image from packets list
  const getPacketImage = (code: string) => {
    const packet = packets.find((p) => p.packet_code === code);
    return packet?.packet_image ? getImageUrl(packet.packet_image) : "";
  };

  // 🧭 Load all required data
  const loadAllData = async () => {
    try {
      const p = await (window as any).electronAPI.getPackets?.();
      const combos = await (window as any).electronAPI.getPacketCombinations?.();
      const e = await (window as any).electronAPI.getPacketProductions?.();
      const tc = await (window as any).electronAPI.getCombinations?.();
      const pp = await (window as any).electronAPI.getProducedProducts?.();
      const rs = await (window as any).electronAPI.getRawStock?.();

      setPackets(p || []);
      setCombinations(combos || []);
      setEntries(e || []);
      setToyCombinations(tc || []);
      setProducedProducts(pp || []);
      setRawStock(rs || []);
    } catch (err) {
      console.error("❌ Error loading all details:", err);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // 🎯 Show only packets that have at least one combination
  const availablePackets = packets.filter((pkt) =>
    combinations.some((combo) => combo.packet_code === pkt.packet_code)
  );

  // Get active packet object to fetch its image
  const activePacketObj = packets.find((p) => p.packet_code === selectedPacket);

  // 🎯 Filter group list based on selected packet
  const filteredGroups = combinations.filter(
    (c) => c.packet_code === selectedPacket
  );

  const activeCombo = combinations.find(
    (c) => c.packet_code === selectedPacket && c.group_name === selectedGroup
  );

  const getComboImage = (productCode: string) => {
    const toyCombo = toyCombinations.find(
      (tc) => tc.product_code === productCode || tc.combo_name === productCode
    );
    return toyCombo?.sample_image ? getImageUrl(toyCombo.sample_image) : "";
  };

  // 🖼️ When group selected → show sample image
  const handleGroupSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const groupName = e.target.value;
    setSelectedGroup(groupName);

    const combo = combinations.find((c) => c.group_name === groupName);
    setGroupImage(combo?.sample_image || "");
  };

  // 💾 Save Entry
  const handleSave = async () => {
    if (!selectedPacket || !selectedGroup || qty <= 0 || !entryBy) {
      alert("⚠️ Please fill all fields properly!");
      return;
    }

    try {
      await (window as any).electronAPI.savePacketProduction?.({
        packet_code: selectedPacket,
        group_name: selectedGroup,
        qty,
        entry_by: entryBy,
        date: new Date().toISOString(),
      });

      alert("Packet production saved and product stock deducted!");

      setSelectedPacket("");
      setSelectedGroup("");
      setGroupImage("");
      setQty(0);
      setEntryBy("");

      await loadAllData();
      setActiveTab("list");
    } catch (error: any) {
      alert(error?.response?.data?.error || error?.message || "Packet production failed");
    }
  };

  const resetForm = () => {
    setSelectedPacket("");
    setSelectedGroup("");
    setGroupImage("");
    setQty(0);
    setEntryBy("");
  };

  // Determine current active stepper step
  const getCurrentStep = () => {
    if (!selectedPacket) return 1;
    if (!selectedGroup) return 2;
    if (qty <= 0 || !entryBy) return 3;
    return 4;
  };

  // Check toys stock levels validation
  const isStockAvailable = () => {
    if (!selectedPacket || !selectedGroup || qty <= 0) return false;
    if (!activeCombo || !activeCombo.products) return false;

    for (const prodCode of activeCombo.products) {
      const stockItem = producedProducts.find((pp) => pp.product_code === prodCode);
      const available = stockItem ? stockItem.total_qty : 0;
      if (available < qty) return false;
    }
    return true;
  };

  return (
    <div className="packet-production-container">
      {/* Page Header */}
      <div className="packet-assembly-header">
        <div className="header-brand-block">
          <span className="brand-badge">📦</span>
          <div>
            <h1>Rattle Packet Assembly</h1>
            <p>Assemble rattle toys into retail packets and record the output.</p>
          </div>
        </div>
        <button 
          className="history-toggle-btn"
          onClick={() => setActiveTab(activeTab === "entry" ? "list" : "entry")}
        >
          {activeTab === "entry" ? "📋 View Assembly History" : "➕ Go to Assembly Floor"}
        </button>
      </div>

      {/* 🧾 Entry Floor View */}
      {activeTab === "entry" && (
        <div className="packet-assembly-layout">
          
          {/* Stepper Sidebar Column */}
          <aside className="assembly-stepper">
            {[
              { num: 1, title: "Select Packet Style", desc: "Choose packet design", done: !!selectedPacket },
              { num: 2, title: "Select Rattle Group", desc: "Pick rattle combination", done: !!selectedGroup },
              { num: 3, title: "Review Contents", desc: "Verify build of materials", done: !!selectedPacket && !!selectedGroup },
              { num: 4, title: "Assemble Packets", desc: "Enter quantity & assemble", done: !!selectedPacket && !!selectedGroup && qty > 0 && !!entryBy && isStockAvailable() }
            ].map((step) => {
              const currentStep = getCurrentStep();
              const isActive = step.num === currentStep;
              const isCompleted = step.done;
              return (
                <div 
                  className={`stepper-step ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`} 
                  key={step.num}
                >
                  <div className="step-circle">
                    {isCompleted ? "✓" : step.num}
                  </div>
                  <div className="step-text">
                    <strong>{step.title}</strong>
                    <small>{step.desc}</small>
                  </div>
                </div>
              );
            })}
          </aside>

          {/* Middle Details Grid Column */}
          <div className="assembly-main-column">
            
            {/* Top selection cards */}
            <div className="assembly-cards-grid">
              
              {/* Selected Packet Style */}
              <div className="assembly-card selected-packet-card">
                <div className="card-header">
                  <h3>Selected Packet Style</h3>
                </div>
                <div className="card-body">
                  {!selectedPacket ? (
                    <div className="select-placeholder-body">
                      <label>Choose Packet Code:</label>
                      <select
                        value={selectedPacket}
                        onChange={(e) => {
                          setSelectedPacket(e.target.value);
                          setSelectedGroup("");
                          setGroupImage("");
                        }}
                      >
                        <option value="">-- Select Packet --</option>
                        {availablePackets.map((p, i) => (
                          <option key={i} value={p.packet_code}>
                            {p.packet_code}
                          </option>
                        ))}
                      </select>
                      <div className="placeholder-details">
                        <p>Packet Name: <span className="dim">—</span></p>
                        <p>Size: <span className="dim">—</span></p>
                      </div>
                    </div>
                  ) : (
                    <div className="selected-detail-body">
                      <div className="detail-visual">
                        {activePacketObj?.packet_image ? (
                          <img
                            src={getImageUrl(activePacketObj.packet_image)}
                            alt="Packet Style"
                          />
                        ) : (
                          <div className="detail-placeholder">📦</div>
                        )}
                      </div>
                      <div className="detail-info">
                        <div className="info-row">
                          <span className="info-label">Packet Code</span>
                          <span className="info-val">{selectedPacket}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Packet Name</span>
                          <span className="info-val">{selectedPacket} Rattle Packet</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Size</span>
                          <span className="info-val font-semibold">Standard</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Color Theme</span>
                          <div className="color-theme-dots">
                            <span className="theme-dot" style={{ background: "#4ade80" }}></span>
                            <span className="theme-dot" style={{ background: "#f87171" }}></span>
                            <span className="theme-dot" style={{ background: "#fb923c" }}></span>
                            <span className="theme-dot" style={{ background: "#60a5fa" }}></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {selectedPacket && (
                  <div className="card-footer">
                    <button 
                      className="change-btn"
                      onClick={() => {
                        setSelectedPacket("");
                        setSelectedGroup("");
                        setGroupImage("");
                      }}
                    >
                      Change Packet Style
                    </button>
                  </div>
                )}
              </div>

              {/* Selected Rattle Group */}
              <div className="assembly-card selected-group-card">
                <div className="card-header">
                  <h3>Selected Rattle Group</h3>
                </div>
                <div className="card-body">
                  {!selectedPacket ? (
                    <div className="card-msg-placeholder">
                      <p>Please select a packet style first.</p>
                    </div>
                  ) : !selectedGroup ? (
                    <div className="select-placeholder-body">
                      <label>Choose Group Combination:</label>
                      <select
                        value={selectedGroup}
                        onChange={handleGroupSelect}
                      >
                        <option value="">-- Select Group --</option>
                        {filteredGroups.map((c, i) => (
                          <option key={i} value={c.group_name}>
                            {c.group_name}
                          </option>
                        ))}
                      </select>
                      <div className="placeholder-details">
                        <p>Rattles in Group: <span className="dim">—</span></p>
                        <p>Color Variant: <span className="dim">—</span></p>
                      </div>
                    </div>
                  ) : (
                    <div className="selected-detail-body">
                      <div className="detail-visual">
                        {groupImage ? (
                          <img
                            src={getImageUrl(groupImage)}
                            alt="Rattle Group"
                          />
                        ) : (
                          <div className="detail-placeholder">🧩</div>
                        )}
                      </div>
                      <div className="detail-info">
                        <div className="info-row">
                          <span className="info-label">Group Code</span>
                          <span className="info-val">{selectedGroup}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Group Name</span>
                          <span className="info-val">{selectedGroup}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Rattles in Group</span>
                          <span className="info-val font-semibold">{activeCombo?.products?.length || 0} Types</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Color Variant</span>
                          <span className="info-val">Multi-Color (4 Colors)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {selectedGroup && (
                  <div className="card-footer">
                    <button 
                      className="change-btn"
                      onClick={() => {
                        setSelectedGroup("");
                        setGroupImage("");
                      }}
                    >
                      Change Rattle Group
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* BOM Contents Table Card */}
            <div className="assembly-card bom-card">
              <div className="card-header space-between">
                <h3>Packet Contents (Build of Material)</h3>
                {selectedPacket && selectedGroup && (
                  <span className={`bom-status-badge ${isStockAvailable() ? "success" : "warning"}`}>
                    {isStockAvailable() 
                      ? "All materials are available for the requested quantity."
                      : "Insufficient stock for some products."}
                  </span>
                )}
              </div>
              <div className="card-body no-padding">
                {!selectedPacket || !selectedGroup ? (
                  <div className="card-msg-placeholder py-12">
                    <p>Select packet and combination group to view build materials list.</p>
                  </div>
                ) : (
                  <div className="bom-table-wrapper">
                    <table className="bom-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Image</th>
                          <th>Component / Product</th>
                          <th>Code</th>
                          <th>Specification</th>
                          <th>Per Packet</th>
                          <th>Available Stock</th>
                          <th>Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* 1. Produced Toys List */}
                        {activeCombo?.products?.map((prodCode: string, idx: number) => {
                          const toyCombo = toyCombinations.find(tc => tc.product_code === prodCode || tc.combo_name === prodCode);
                          const displayName = toyCombo ? toyCombo.combo_name : `${prodCode} Rattle`;
                          const stockItem = producedProducts.find(pp => pp.product_code === prodCode);
                          const available = stockItem ? stockItem.total_qty : 0;
                          const comboImage = getComboImage(prodCode);
                          
                          // specifications list from parts colors
                          const specs = toyCombo?.parts
                            ?.map((p: any) => p.color_name || p.color_code)
                            .filter(Boolean)
                            .filter((value: any, index: any, self: any) => self.indexOf(value) === index)
                            .join(", ") || "Multi Color";

                          return (
                            <tr key={`toy-${idx}`}>
                              <td>{idx + 1}</td>
                              <td>
                                {comboImage ? (
                                  <img
                                    src={comboImage}
                                    alt={displayName}
                                    className="bom-product-thumb clickable-thumbnail"
                                    onClick={() => setPreviewModalImg(comboImage)}
                                  />
                                ) : (
                                  <div className="bom-product-thumb bom-product-thumb-placeholder">-</div>
                                )}
                              </td>
                              <td className="font-semibold">{displayName}</td>
                              <td><code>{prodCode}</code></td>
                              <td>{specs}</td>
                              <td>1</td>
                              <td className={available < qty ? "text-danger-stock" : "text-success-stock"}>
                                {available.toLocaleString()}
                              </td>
                              <td>pcs</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Ticket Column */}
          <div className="assembly-ticket-column">
            <div className="assembly-ticket">
              <div className="ticket-header">
                <h3>Live Assembly Ticket</h3>
                <span className={`ticket-status ${selectedPacket && selectedGroup && qty > 0 ? (isStockAvailable() ? "ready" : "warning") : "draft"}`}>
                  {selectedPacket && selectedGroup && qty > 0 ? (isStockAvailable() ? "Ready" : "No Stock") : "Draft"}
                </span>
              </div>
              
              <div className="ticket-body">
                
                {/* Visual spec image preview */}
                <div className="ticket-visual-preview">
                  {activePacketObj?.packet_image ? (
                    <img 
                      src={getImageUrl(activePacketObj.packet_image)} 
                      alt="Assembly Style" 
                    />
                  ) : (
                    <div className="preview-empty">🖼️</div>
                  )}
                </div>

                <div className="ticket-specs">
                  <div className="ticket-spec-row">
                    <span>Packet Code</span>
                    <strong>{selectedPacket || "—"}</strong>
                  </div>
                  <div className="ticket-spec-row">
                    <span>Packet Name</span>
                    <strong>{selectedPacket ? `${selectedPacket} Rattle Packet` : "—"}</strong>
                  </div>
                  <div className="ticket-spec-row">
                    <span>Rattle Group</span>
                    <strong>{selectedGroup ? `${selectedGroup}` : "—"}</strong>
                  </div>
                </div>

                <hr className="ticket-divider" />

                {/* Target packets input with adjust buttons */}
                <div className="ticket-field">
                  <label>Target Packets</label>
                  <div className="qty-stepper">
                    <button 
                      type="button" 
                      onClick={() => setQty(prev => Math.max(0, prev - 10))}
                      disabled={!selectedGroup}
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={qty || ""} 
                      onChange={(e) => setQty(Number(e.target.value))}
                      placeholder="0"
                      disabled={!selectedGroup}
                    />
                    <button 
                      type="button" 
                      onClick={() => setQty(prev => prev + 10)}
                      disabled={!selectedGroup}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Operator Entered By */}
                <div className="ticket-field">
                  <label>Operator / Entered By</label>
                  <input 
                    type="text" 
                    value={entryBy} 
                    onChange={(e) => setEntryBy(e.target.value)}
                    placeholder="Enter your name"
                    disabled={!selectedGroup}
                  />
                </div>

                {/* Products Consumed (For Target) */}
                {selectedGroup && qty > 0 && (
                  <>
                    <hr className="ticket-divider" />
                    <div className="consumed-summary">
                      <h4>Products Consumed (For Target)</h4>
                      <div className="consumed-items">
                        {activeCombo?.products?.map((prodCode: string, i: number) => {
                          const toyCombo = toyCombinations.find(tc => tc.product_code === prodCode || tc.combo_name === prodCode);
                          const displayName = toyCombo ? toyCombo.combo_name : `${prodCode} Rattle`;
                          return (
                            <div className="consumed-row" key={i}>
                              <span>{displayName} ({prodCode})</span>
                              <strong>{qty * 1} pcs</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                <hr className="ticket-divider" />

                {/* Stock Validation Status */}
                <div className={`stock-validation-box ${selectedPacket && selectedGroup && qty > 0 ? (isStockAvailable() ? "valid" : "invalid") : "pending"}`}>
                  <div className="validation-icon">
                    {selectedPacket && selectedGroup && qty > 0 ? (isStockAvailable() ? "✓" : "⚠️") : "—"}
                  </div>
                  <div className="validation-text">
                    <strong>Stock Validation</strong>
                    <p>
                      {!selectedPacket || !selectedGroup || qty <= 0
                        ? "Enter target assembly details to validate stock."
                        : isStockAvailable() 
                          ? "All required items are in stock. You can proceed with assembly."
                          : "Insufficient stock for some products."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="ticket-actions">
                <button 
                  className="btn btn-save" 
                  onClick={handleSave} 
                  disabled={!isStockAvailable() || !entryBy}
                >
                  Start Assembly
                </button>
                <button className="btn btn-reset" onClick={resetForm}>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 Ledger History List View */}
      {activeTab === "list" && (
        <div className="packet-recent-assembly-ledger">
          <div className="ledger-head">
            <div>
              <h3>Packet Assembly History Logs</h3>
              <p>All completed production runs</p>
            </div>
          </div>
          <div className="ledger-scroll">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Time</th>
                  <th>Packet Code</th>
                  <th>Packet Name</th>
                  <th>Group</th>
                  <th>Quantity</th>
                  <th>Operator</th>
                  <th>Products Consumed</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", color: "#94a3b8" }}>
                      No assembly runs recorded yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((e, i) => (
                    <tr key={i}>
                      <td>
                        {getPacketImage(e.packet_code) ? (
                          <img
                            src={getPacketImage(e.packet_code)}
                            alt="Packet"
                            width={44}
                            height={44}
                            className="clickable-thumbnail"
                            onClick={() => setPreviewModalImg(getPacketImage(e.packet_code))}
                            style={{
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                              objectFit: "cover",
                              backgroundColor: "#fff",
                              cursor: "zoom-in"
                            }}
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>{new Date(e.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td><code>{e.packet_code}</code></td>
                      <td className="font-semibold">{e.packet_code} Rattle Packet</td>
                      <td>{e.group_name}</td>
                      <td className="font-bold text-teal-700">{e.qty} pcs</td>
                      <td>{e.entry_by}</td>
                      <td>
                        {combinations.find(c => c.packet_code === e.packet_code && c.group_name === e.group_name)?.products?.length || 0} items
                      </td>
                      <td>{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}, {new Date(e.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td>
                        <span className="completed-badge">Completed</span>
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

export default PacketProduction;
