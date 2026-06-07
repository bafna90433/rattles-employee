import React, { useEffect, useState } from "react";
import "../styles/PacketProduction.css";
import { getImageUrl } from "../utils/image";

const PacketProductionEntries: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [combinations, setCombinations] = useState<any[]>([]);
  const [packets, setPackets] = useState<any[]>([]);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  // 🧭 Load all production entries + combinations
  useEffect(() => {
    (async () => {
      const e = await (window as any).electronAPI.getPacketProductions?.();
      const combos = await (window as any).electronAPI.getPacketCombinations?.();
      const p = await (window as any).electronAPI.getPackets?.();
      setEntries(e || []);
      setCombinations(combos || []);
      setPackets(p || []);
    })();
  }, []);

  // 🔍 Helper function — get image from matching group
  const getSampleImage = (groupName: string) => {
    const combo = combinations.find((c: any) => c.group_name === groupName);
    return combo?.sample_image || "";
  };

  const getPacketImage = (packetCode: string) => {
    const p = packets.find((item: any) => item.packet_code === packetCode);
    return p?.packet_image || "";
  };

  return (
    <div className="packet-production-container">
      <h2>📋 Packet Production Entries</h2>

      {entries.length === 0 ? (
        <p className="empty-msg">⚠️ No production entries found!</p>
      ) : (
        <table>
          <thead>
             <tr>
               <th>Packet Code</th>
               <th>Packet Image</th>
               <th>Group Name</th>
               <th>Sample Image</th>
               <th>Quantity</th>
               <th>Entry By</th>
               <th>Date</th>
             </tr>
          </thead>

          <tbody>
            {entries.map((entry, i) => {
              const imageBase64 = getSampleImage(entry.group_name);
              return (
                 <tr key={i}>
                   <td>{entry.packet_code}</td>
                   <td>
                     {getPacketImage(entry.packet_code) ? (
                       <img
                         src={getImageUrl(getPacketImage(entry.packet_code))}
                         alt="Packet"
                         width={50}
                         height={50}
                         className="clickable-thumbnail"
                         onClick={() => setPreviewModalImg(getImageUrl(getPacketImage(entry.packet_code)))}
                         style={{
                           borderRadius: "8px",
                           border: "1px solid #ddd",
                           objectFit: "cover",
                           background: "#fff",
                         }}
                       />
                     ) : (
                       "-"
                     )}
                   </td>
                   <td>{entry.group_name}</td>
                  <td>
                    {imageBase64 ? (
                      <img
                        src={getImageUrl(imageBase64)}
                        alt="Sample"
                        width={50}
                        height={50}
                        className="clickable-thumbnail"
                        onClick={() => setPreviewModalImg(getImageUrl(imageBase64))}
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                          objectFit: "cover",
                          background: "#fff",
                        }}
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td
                    style={{
                      fontWeight: 600,
                      color: "#2563eb",
                      textAlign: "center",
                    }}
                  >
                    {entry.qty}
                  </td>
                  <td>{entry.entry_by}</td>
                  <td>
                    {entry.date
                      ? new Date(entry.date).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

export default PacketProductionEntries;
