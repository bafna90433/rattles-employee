import React, { useEffect, useState } from "react";
import "../styles/ProductionPage.css";
import { getImageUrl } from "../utils/image";

interface ComboPart {
  part_code: string;
  color_code?: string;
  color_image?: string; // base64 real image
}

interface Combination {
  id?: string;
  _id?: string;
  combo_name: string;
  product_id: string;
  product_code: string;
  parts: ComboPart[];
  sample_image?: string;
}

interface ProductionRecord {
  combo_name: string;
  qty: number;
  entry_by: string;
  date: string;
  sample_image?: string; // for product photo display
}

const ProductionPage: React.FC = () => {
  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [selectedCombo, setSelectedCombo] = useState<Combination | null>(null);
  const [productionQty, setProductionQty] = useState<number>(0);
  const [producedList, setProducedList] = useState<ProductionRecord[]>([]);
  const [entryBy, setEntryBy] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // 🔄 Load data
  const loadCombinations = async () => {
    const combos = await (window as any).electronAPI.getCombinations?.();
    setCombinations(combos || []);
  };

  const loadProduced = async () => {
    const res = await (window as any).electronAPI.getProductionEntries?.();
    setProducedList(res || []);
  };

  useEffect(() => {
    loadCombinations();
    loadProduced();
  }, []);

  // 🧱 Reset form fields safely
  const resetForm = () => {
    setSelectedCombo(null);
    setProductionQty(0);
    setEntryBy("");
  };

  // ⚙️ Combo select
  const handleComboSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    const combo = combinations.find((c) => String(c._id || c.id || "") === String(selectedVal));
    setSelectedCombo(combo || null);
  };

  // 💾 Produce & update stock
  const handleProduction = async () => {
    if (!selectedCombo || productionQty <= 0) {
      alert("⚠️ Please select a combination and enter quantity!");
      return;
    }
    if (!entryBy.trim()) {
      alert("⚠️ Please enter your name in 'Entered By'!");
      return;
    }

    const confirmMsg = `🧮 Produce ${productionQty} pieces of ${selectedCombo.combo_name}? 
This will reduce raw material stock.`;
    if (!confirm(confirmMsg)) return;

    // 💾 Save production record FIRST
    const record = {
      combo_id: selectedCombo._id || selectedCombo.id || "",
      combo_name: selectedCombo.combo_name,
      qty: productionQty,
      entry_by: entryBy,
      sample_image: selectedCombo.sample_image || "",
      date: new Date().toISOString(),
    };
    await (window as any).electronAPI.saveProductionEntry?.(record);

    // 🧩 Deduct raw materials
    for (const part of selectedCombo.parts) {
      const minusEntry = {
        product_id: selectedCombo.product_id,
        part_code: part.part_code,
        color_code: part.color_code || "",
        color_image: part.color_image || "",
        quantity: -productionQty,
        entry_by: entryBy,
      };
      await (window as any).electronAPI.saveRawEntry(minusEntry);
    }

    alert("✅ Production saved and stock updated!");

    // 🔁 Reset & reload safely
    resetForm();
    await loadProduced();
    setActiveTab("list");
  };

  return (
    <div className="production-container">
      <h2>🏭 Production Entries & Logs</h2>

      {/* 🔀 Tabs */}
      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === "entry" ? "active" : ""}`}
          onClick={() => setActiveTab("entry")}
        >
          ➕ Production Entry
        </button>
        <button
          className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          📋 View Logs
        </button>
      </div>

      {/* 🧱 CREATE ENTRY */}
      {activeTab === "entry" && (
        <div className="entry-dashboard">
          {/* Left Column: Form Section */}
          <div className="form-column">
            {/* Panel 1: Selection (Blue Accent) */}
            <div className="flat-section product-part-section">
              <h3>📦 Combination Selection</h3>
              <div className="selector-group">
                <label>Select Combination:</label>
                <div className="selector-input-wrapper">
                  <select
                    onChange={handleComboSelect}
                    value={selectedCombo ? (selectedCombo._id || selectedCombo.id || "") : ""}
                  >
                    <option value="">-- Select Combination --</option>
                    {combinations.map((c) => {
                      const cId = c._id || c.id;
                      return (
                        <option key={cId} value={cId}>
                          {c.combo_name} ({c.product_code})
                        </option>
                      );
                    })}
                  </select>
                  {selectedCombo && selectedCombo.sample_image && (
                    <div className="mini-preview-thumbnail">
                      <img
                        src={getImageUrl(selectedCombo.sample_image)}
                        alt={selectedCombo.combo_name}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel 2: Details & Specification (Green Accent) */}
            <div className="flat-section details-section">
              <h3>🔢 Production Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity to Produce:</label>
                  <input
                    type="number"
                    min="1"
                    value={productionQty || ""}
                    onChange={(e) => setProductionQty(Number(e.target.value))}
                    placeholder="Enter production quantity"
                  />
                </div>

                <div className="form-group">
                  <label>Entered By:</label>
                  <input
                    type="text"
                    value={entryBy}
                    onChange={(e) => setEntryBy(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-save" onClick={handleProduction}>
                  ⚙️ Produce & Update Stock
                </button>
                <button className="btn btn-reset" onClick={resetForm}>
                  🔄 Clear Form
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Live Summary Preview */}
          <div className="preview-column">
            <div className="sticky-preview-panel">
              <h3>👀 Live Production Preview</h3>
              <div className="preview-summary-card">
                {/* Visual Header Banner */}
                <div className="preview-visual-banner">
                  <div className="visual-half" style={{ width: "100%" }}>
                    <span className="visual-tag">Selected Design</span>
                    {selectedCombo ? (
                      <div className="visual-content">
                        {selectedCombo.sample_image ? (
                          <img
                            src={getImageUrl(selectedCombo.sample_image)}
                            alt="Combination Sample"
                          />
                        ) : (
                          <div className="visual-placeholder">
                            <span className="ph-icon">🖼️</span>
                            <span>No Sample Image</span>
                          </div>
                        )}
                        <span className="badge badge-blue">{selectedCombo.combo_name}</span>
                      </div>
                    ) : (
                      <div className="visual-placeholder" style={{ width: "120px", height: "120px" }}>
                        <span className="ph-icon">🧩</span>
                        <span>No Combo Selected</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedCombo && (
                  <>
                    <hr className="preview-divider" />
                    <span className="visual-tag" style={{ display: "block", marginBottom: "8px" }}>
                      Component Parts Required:
                    </span>
                    <table className="parts-mini-table">
                      <thead>
                        <tr>
                          <th>Part Code</th>
                          <th>Color Swatch</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCombo.parts.map((p, i) => (
                          <tr key={i}>
                            <td>{p.part_code}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    backgroundColor: p.color_code,
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "50%",
                                    border: "1px solid #cbd5e1",
                                  }}
                                ></span>
                                <code style={{ fontSize: "12px" }}>{p.color_code || "N/A"}</code>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}

                <hr className="preview-divider" />

                <div className="preview-stats-row">
                  <div className="stat-box">
                    <span className="stat-label">Qty to Make</span>
                    <span className="stat-value text-success">
                      {productionQty > 0 ? `+${productionQty}` : 0}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Operator</span>
                    <span className="stat-value operator-name">{entryBy || "—"}</span>
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
          <h3>📋 Production Logs Table</h3>
          {producedList.length === 0 ? (
            <p>No production records yet.</p>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Sample</th>
                  <th>Combination</th>
                  <th>Qty</th>
                  <th>Entered By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {producedList.map((r, i) => (
                  <tr key={i}>
                    <td>
                      {r.sample_image ? (
                        <img
                          src={getImageUrl(r.sample_image)}
                          alt="Sample"
                          width={50}
                          height={50}
                          className="clickable-thumbnail"
                          onClick={() => setPreviewModalImg(getImageUrl(r.sample_image))}
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
                    <td style={{ fontWeight: 600 }}>{r.combo_name}</td>
                    <td style={{ color: "#059669", fontWeight: 700 }}>{r.qty}</td>
                    <td>{r.entry_by}</td>
                    <td>{new Date(r.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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

export default ProductionPage;
