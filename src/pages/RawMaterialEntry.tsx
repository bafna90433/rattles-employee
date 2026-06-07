import React, { useEffect, useState, ChangeEvent } from "react";
import "../styles/RawMaterialEntry.css";
import "../styles/EmployeeWorkflow.css";
import "../styles/RawMaterialReference.css";
import { convertToWebP } from "../utils/webp";
import { getImageUrl } from "../utils/image";

interface Part {
  part_code: string;
  part_image: string;
  color_code?: string;
}

interface Product {
  id?: string;
  _id?: string;
  product_code: string;
  product_image: string;
  parts: Part[];
}

interface RawEntry {
  id?: string;
  _id?: string;
  product_id: string;
  part_code: string;
  color_code?: string;
  color_name?: string;
  color_image?: string;
  quantity: number;
  entry_by: string;
}

const RawMaterialEntry: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [colorImagePreview, setColorImagePreview] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"entry" | "list">("entry");
  const [showMinusOnly, setShowMinusOnly] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const [entry, setEntry] = useState<RawEntry>({
    product_id: "",
    part_code: "",
    color_code: "",
    color_name: "",
    color_image: "",
    quantity: 0,
    entry_by: "",
  });

  // 🔄 Load Data
  const loadProducts = async () => {
    const res = await (window as any).electronAPI.getProducts();
    setProducts(res);
  };

  const loadEntries = async () => {
    const res = await (window as any).electronAPI.getRawEntries();
    setEntries(res);
  };

  useEffect(() => {
    loadProducts();
    loadEntries();
  }, []);

  // 🧱 Product Select
  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    const prod = products.find((p) => String(p._id || p.id || "") === String(selectedVal)) || null;
    setSelectedProduct(prod);
    setSelectedPart(null);
    setEntry({
      ...entry,
      product_id: prod ? (prod._id || prod.id || "") : "",
      part_code: "",
      color_code: "",
      color_name: "",
      color_image: "",
    });
    setColorImagePreview("");
  };

  // 🧩 Part Select
  const handlePartSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const part = selectedProduct?.parts.find(
      (p) => p.part_code === e.target.value
    ) || null;
    setSelectedPart(part);
    setEntry({
      ...entry,
      part_code: part?.part_code || "",
      color_code: "",
      color_name: "",
      color_image: "",
    });
  };

  // 🖼️ Upload Color Image
  const handleColorImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { base64, dataUrl } = await convertToWebP(file);
      setEntry((prev) => ({ ...prev, color_image: base64 }));
      setColorImagePreview(dataUrl);
    }
  };

  // 💾 Save Entry
  const handleSave = async () => {
    if (!entry.product_id || !entry.part_code || !entry.quantity || !entry.entry_by) {
      alert("⚠️ Please fill all fields!");
      return;
    }

    setIsSaving(true);
    try {
      let res;
      if (editMode && entry.id) {
        res = await (window as any).electronAPI.updateRawEntry(entry);
      } else {
        res = await (window as any).electronAPI.saveRawEntry(entry);
      }

      alert(res?.message || "✅ Entry saved successfully!");
      resetForm();
      loadEntries();
      setActiveTab("list");
    } catch (err: any) {
      console.error(err);
      alert("❌ Error saving entry: " + (err.message || "Request failed"));
    } finally {
      setIsSaving(false);
    }
  };

  // 🧹 Reset Form
  const resetForm = () => {
    setEntry({
      product_id: "",
      part_code: "",
      color_code: "",
      color_name: "",
      color_image: "",
      quantity: 0,
      entry_by: "",
    });
    setSelectedProduct(null);
    setSelectedPart(null);
    setColorImagePreview("");
    setEditMode(false);
  };

  // ✏️ Edit Entry
  const handleEdit = (item: any) => {
    const prod = products.find((p) => String(p._id || p.id || "") === String(item.product_id)) || null;
    const part = prod?.parts.find((p) => p.part_code === item.part_code) || null;

    setSelectedProduct(prod || null);
    setSelectedPart(part || null);
    setEntry({
      ...item,
      color_code: item.color_code || "",
      color_name: item.color_name || "",
    });
    setColorImagePreview(
      item.color_image ? getImageUrl(item.color_image) : ""
    );
    setEditMode(true);
    setActiveTab("entry");
  };

  // ❌ Delete Entry
  const handleDelete = async (id: string) => {
    if (confirm("🗑️ Are you sure you want to delete this entry?")) {
      const res = await (window as any).electronAPI.deleteRawEntry(id);
      alert(res);
      loadEntries();
    }
  };

  // 🔍 Filtered entries based on toggle
  const filteredEntries = entries.filter((e) =>
    showMinusOnly ? e.quantity < 0 : e.quantity >= 0
  );

  return (
    <div className="raw-material-container">
      <div className="intake-page-title">
        <span>RM</span>
        <div>
          <h1>Raw Material Intake</h1>
          <p>Record incoming rattle toy materials and component parts.</p>
        </div>
      </div>
      <h2>🏗️ Raw Material Entry</h2>

      {/* 🔀 Tabs */}
      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === "entry" ? "active" : ""}`}
          onClick={() => setActiveTab("entry")}
        >
          {editMode ? "✏️ Edit Entry" : "➕ Material Entry"}
        </button>
        <button
          className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
          onClick={() => setActiveTab("list")}
        >
          📋 View Entries
        </button>
      </div>

      {/* 🧾 Entry Form Dashboard */}
      {activeTab === "entry" && (
        <div className="entry-dashboard">
          <aside className="intake-stepper">
            {[
              ["1", "Select Rattle Product", "Choose the rattle product"],
              ["2", "Select Component Part", "Choose the part / item"],
              ["3", "Material Color & Photo", "Enter color and upload image"],
              ["4", "Quantity & Operator", "Enter quantity and operator"],
            ].map((step, index) => (
              <div className={`intake-step ${index === 0 ? "active" : ""}`} key={step[0]}>
                <b>{step[0]}</b>
                <div><strong>{step[1]}</strong><small>{step[2]}</small></div>
              </div>
            ))}
          </aside>
          {/* Left Column: Form Section */}
          <div className="form-column">
            {/* Flat Section 1: Product & Part Selector */}
            <div className="flat-section product-part-section">
              <h3>📦 Product & Part Selection</h3>
              <div className="selector-grid">
                {/* Product Dropdown */}
                <div className="selector-group">
                  <label>Product Code:</label>
                  <div className="selector-input-wrapper">
                    <select
                      value={selectedProduct ? (selectedProduct._id || selectedProduct.id || "") : ""}
                      onChange={handleProductSelect}
                    >
                      <option value="">-- Select Product --</option>
                      {products.map((p) => {
                        const pId = p._id || p.id;
                        return (
                          <option key={pId} value={pId}>
                            {p.product_code}
                          </option>
                        );
                      })}
                    </select>
                    {selectedProduct && (
                      <div className="mini-preview-thumbnail">
                        <img
                          src={getImageUrl(selectedProduct.product_image)}
                          alt={selectedProduct.product_code}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Part Dropdown */}
                <div className="selector-group">
                  <label>Part Code:</label>
                  <div className="selector-input-wrapper">
                    <select
                      value={selectedPart?.part_code || ""}
                      onChange={handlePartSelect}
                      disabled={!selectedProduct}
                    >
                      <option value="">-- Select Part --</option>
                      {selectedProduct?.parts.map((part, i) => (
                        <option key={i} value={part.part_code}>
                          {part.part_code}
                        </option>
                      ))}
                    </select>
                    {selectedPart && (
                      <div className="mini-preview-thumbnail">
                        <img
                          src={getImageUrl(selectedPart.part_image)}
                          alt={selectedPart.part_code}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Flat Section 2: Details & Specification */}
            <div className="flat-section details-section">
              <h3>🎨 Material Specifications & Quantity</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Color Code:</label>
                  <input
                    type="text"
                    placeholder="e.g. RD, BL, C1"
                    value={entry.color_code || ""}
                    onChange={(e) => setEntry({ ...entry, color_code: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Color Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Red, Blue, Gold"
                    value={entry.color_name || ""}
                    onChange={(e) => setEntry({ ...entry, color_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Upload Color Image:</label>
                  <div className="file-upload-wrapper">
                    <input type="file" accept="image/*" onChange={handleColorImage} />
                    {colorImagePreview && (
                      <div className="color-image-thumbnail">
                        <img src={colorImagePreview} alt="Uploaded Color" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    value={entry.quantity || ""}
                    onChange={(e) => setEntry({ ...entry, quantity: Number(e.target.value) })}
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="form-group">
                  <label>Entered By:</label>
                  <input
                    type="text"
                    value={entry.entry_by}
                    onChange={(e) => setEntry({ ...entry, entry_by: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-save" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "⏳ Saving..." : (editMode ? "💾 Update Entry" : "💾 Save Entry")}
                </button>
                <button className="btn btn-reset" onClick={resetForm} disabled={isSaving}>
                  🔄 Clear Form
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Summary Preview */}
          <div className="preview-column">
            <div className="sticky-preview-panel">
              <h3>👀 Live Entry Summary</h3>
              
              <div className="preview-summary-card">
                {/* Large visual preview banner */}
                <div className="preview-visual-banner">
                  <div className="visual-half">
                    <span className="visual-tag">Product Reference</span>
                    {selectedProduct ? (
                      <div className="visual-content">
                        <img src={getImageUrl(selectedProduct.product_image)} alt="Product" />
                        <span className="badge badge-blue">{selectedProduct.product_code}</span>
                      </div>
                    ) : (
                      <div className="visual-placeholder">
                        <span className="ph-icon">📦</span>
                        <span>No Product Selected</span>
                      </div>
                    )}
                  </div>
                  <div className="visual-divider"></div>
                  <div className="visual-half">
                    <span className="visual-tag">Component Part</span>
                    {selectedPart ? (
                      <div className="visual-content">
                        <img src={getImageUrl(selectedPart.part_image)} alt="Part" />
                        <span className="badge badge-teal">{selectedPart.part_code}</span>
                      </div>
                    ) : (
                      <div className="visual-placeholder">
                        <span className="ph-icon">⚙️</span>
                        <span>No Part Selected</span>
                      </div>
                    )}
                  </div>
                </div>

                <hr className="preview-divider" />

                <div className="preview-row">
                  <div className="preview-block">
                    <span className="block-title">Selected Color</span>
                    {entry.color_code || entry.color_name ? (
                      <div className="color-preview-block">
                        <code className="color-hex">
                          {entry.color_code}
                          {entry.color_name ? ` (${entry.color_name})` : ""}
                        </code>
                      </div>
                    ) : (
                      <span className="placeholder-text">No Color Specified</span>
                    )}
                  </div>

                  <div className="preview-block">
                    <span className="block-title">Color Photo</span>
                    {colorImagePreview ? (
                      <div className="color-image-preview">
                        <img src={colorImagePreview} alt="Color Spec" />
                      </div>
                    ) : (
                      <span className="placeholder-text">No Image Uploaded</span>
                    )}
                  </div>
                </div>

                <hr className="preview-divider" />

                <div className="preview-stats-row">
                  <div className="stat-box">
                    <span className="stat-label">Quantity</span>
                    <span className={`stat-value ${entry.quantity < 0 ? "text-danger" : "text-success"}`}>
                      {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity || 0}
                    </span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-label">Operator</span>
                    <span className="stat-value operator-name">{entry.entry_by || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 📋 Entries List */}
      {activeTab === "list" && (
        <div className="form-card">
          <div className="toggle-filter">
            <button
              className={`toggle-btn ${!showMinusOnly ? "active" : ""}`}
              onClick={() => setShowMinusOnly(false)}
            >
              ➕ Add Entries
            </button>
            <button
              className={`toggle-btn ${showMinusOnly ? "active" : ""}`}
              onClick={() => setShowMinusOnly(true)}
            >
              ➖ Minus Entries
            </button>
          </div>

          <h3>
            {showMinusOnly ? "➖ Raw Material Used (Minus Entries)" : "➕ Added Stock Entries"}
          </h3>

          {filteredEntries.length === 0 ? (
            <p>No {showMinusOnly ? "minus" : "add"} entries yet.</p>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Part</th>
                  <th>Color</th>
                  <th>Color Image</th>
                  <th>Qty</th>
                  <th>Entry By</th>
                  <th>Date</th>
                  {!showMinusOnly && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e, i) => (
                  <tr key={i}>
                    <td>{products.find((p) => String(p._id || p.id || "") === String(e.product_id))?.product_code}</td>
                    <td>{e.part_code}</td>
                    <td>
                      {(e.color_code || e.color_name) && (
                        <span>
                          {e.color_code}
                          {e.color_name ? ` (${e.color_name})` : ""}
                        </span>
                      )}
                    </td>
                    <td>
                      {e.color_image && (
                        <img
                          src={getImageUrl(e.color_image)}
                          alt="Uploaded Color"
                          className="clickable-thumbnail"
                          onClick={() => setPreviewModalImg(getImageUrl(e.color_image))}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "cover",
                            borderRadius: "6px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            display: "block",
                          }}
                        />
                      )}
                    </td>
                    <td
                      style={{
                        color: e.quantity < 0 ? "red" : "green",
                        fontWeight: 600,
                      }}
                    >
                      {e.quantity}
                    </td>
                    <td>{e.entry_by}</td>
                    <td>{new Date(e.entry_date).toLocaleString()}</td>

                    {/* Hide actions in Minus Entries view */}
                    {!showMinusOnly && (
                      <td>
                        <button className="btn btn-edit" onClick={() => handleEdit(e)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-delete" onClick={() => handleDelete(e._id || e.id)}>
                          🗑️ Delete
                        </button>
                      </td>
                    )}
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

export default RawMaterialEntry;
