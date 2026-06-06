import React, { useEffect, useState } from "react";
import "../styles/PacketProduction.css";
import { getImageUrl } from "../utils/image";

const PacketProduction: React.FC = () => {
  const [packets, setPackets] = useState<any[]>([]);
  const [combinations, setCombinations] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");

  const [selectedPacket, setSelectedPacket] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [groupImage, setGroupImage] = useState<string>("");
  const [qty, setQty] = useState<number>(0);
  const [entryBy, setEntryBy] = useState("");

  // 🧭 Load all required data
  useEffect(() => {
    (async () => {
      const p = await (window as any).electronAPI.getPackets?.();
      const combos = await (window as any).electronAPI.getPacketCombinations?.();
      const e = await (window as any).electronAPI.getPacketProductions?.();

      setPackets(p || []);
      setCombinations(combos || []);
      setEntries(e || []);
    })();
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

    await (window as any).electronAPI.savePacketProduction?.({
      packet_code: selectedPacket,
      group_name: selectedGroup,
      qty,
      entry_by: entryBy,
      date: new Date().toISOString(),
    });

    await (window as any).electronAPI.updateProductStockByPacket?.({
      packet_code: selectedPacket,
      qty: -qty,
    });

    alert("✅ Packet Production Saved & Stock Updated!");

    // Reset
    setSelectedPacket("");
    setSelectedGroup("");
    setGroupImage("");
    setQty(0);
    setEntryBy("");

    const e = await (window as any).electronAPI.getPacketProductions?.();
    setEntries(e || []);
    setActiveTab("list");
  };

  const resetForm = () => {
    setSelectedPacket("");
    setSelectedGroup("");
    setGroupImage("");
    setQty(0);
    setEntryBy("");
  };

  return (
    <div className="packet-production-container">
      <h2>🏭 Packet Production Entry</h2>

      {/* 🔀 Tabs */}
      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === "entry" ? "active" : ""}`}
          onClick={() => setActiveTab("entry")}
        >
          ➕ Packet Production
        </button>
        <button
          className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          📋 View History
        </button>
      </div>

      {activeTab === "entry" && (
        <div className="entry-dashboard">
          {/* Left Column: Form Inputs */}
          <div className="form-column">
            {/* Panel 1: Selection (Blue Accent) */}
            <div className="flat-section product-part-section">
              <h3>📦 Packet & Group Selection</h3>
              <div className="selector-grid">
                <div className="selector-group">
                  <label>Packet Code:</label>
                  <div className="selector-input-wrapper">
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
                    {activePacketObj && (
                      <div className="mini-preview-thumbnail">
                        <img
                          src={getImageUrl(activePacketObj.packet_image)}
                          alt={selectedPacket}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="selector-group">
                  <label>Group Name:</label>
                  <div className="selector-input-wrapper">
                    <select
                      value={selectedGroup}
                      onChange={handleGroupSelect}
                      disabled={!selectedPacket}
                    >
                      <option value="">-- Select Group --</option>
                      {filteredGroups.map((c, i) => (
                        <option key={i} value={c.group_name}>
                          {c.group_name}
                        </option>
                      ))}
                    </select>
                    {groupImage && (
                      <div className="mini-preview-thumbnail">
                        <img src={getImageUrl(groupImage)} alt={selectedGroup} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 2: Specifications & Quantity (Green Accent) */}
            <div className="flat-section details-section">
              <h3>🔢 Quantity & Operator Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    min={1}
                    value={qty || ""}
                    onChange={(e) => setQty(Number(e.target.value))}
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="form-group">
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
                <button onClick={handleSave} className="btn btn-save">
                  💾 Save Entry
                </button>
                <button onClick={resetForm} className="btn btn-reset">
                  🔄 Clear Form
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Live Preview (Violet Accent) */}
          <div className="preview-column">
            <div className="sticky-preview-panel">
              <h3>👀 Live Production Summary</h3>
              <div className="preview-summary-card">
                {/* Large split image preview banner */}
                <div className="preview-visual-banner">
                  <div className="visual-half">
                    <span className="visual-tag">Packet Profile</span>
                    {activePacketObj ? (
                      <div className="visual-content">
                        <img
                          src={getImageUrl(activePacketObj.packet_image)}
                          alt="Packet"
                        />
                        <span className="badge badge-blue">
                          {activePacketObj.packet_code}
                        </span>
                      </div>
                    ) : (
                      <div className="visual-placeholder">
                        <span className="ph-icon">📦</span>
                        <span>No Packet Selected</span>
                      </div>
                    )}
                  </div>
                  <div className="visual-divider"></div>
                  <div className="visual-half">
                    <span className="visual-tag">Group Pattern</span>
                    {groupImage ? (
                      <div className="visual-content">
                        <img src={getImageUrl(groupImage)} alt="Group" />
                        <span className="badge badge-teal">{selectedGroup}</span>
                      </div>
                    ) : (
                      <div className="visual-placeholder">
                        <span className="ph-icon">🎨</span>
                        <span>No Group Selected</span>
                      </div>
                    )}
                  </div>
                </div>

                <hr className="preview-divider" />

                <div className="preview-stats-row">
                  <div className="stat-box">
                    <span className="stat-label">Qty to Produce</span>
                    <span className="stat-value text-success">
                      {qty > 0 ? `+${qty}` : 0}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Operator</span>
                    <span className="stat-value operator-name">
                      {entryBy || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 Production History Tab */}
      {activeTab === "list" && (
        <div className="form-card">
          <h3>📋 Packet Production History</h3>
          <table className="product-table">
            <thead>
              <tr>
                <th>Packet</th>
                <th>Group</th>
                <th>Qty</th>
                <th>By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>
                    No entries found
                  </td>
                </tr>
              ) : (
                entries.map((e, i) => (
                  <tr key={i}>
                    <td>{e.packet_code}</td>
                    <td>{e.group_name}</td>
                    <td style={{ fontWeight: 600, color: "#059669" }}>{e.qty}</td>
                    <td>{e.entry_by}</td>
                    <td>{new Date(e.date).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PacketProduction;
