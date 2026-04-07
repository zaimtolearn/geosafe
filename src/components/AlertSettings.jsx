// src/components/AlertSettings.jsx
import { useState } from "react";

function AlertSettings({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  onPickLocation,
}) {
  if (!isOpen) return null;

  const [enabled, setEnabled] = useState(currentSettings?.enabled || false);
  const [radius, setRadius] = useState(currentSettings?.radius || 5);
  // NEW: State for Live Tracking
  const [liveEnabled, setLiveEnabled] = useState(currentSettings?.liveEnabled || false);

  const handleSave = () => {
    if ((enabled || liveEnabled) && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    // Pass the new liveEnabled setting back to App.jsx
    onSave({ enabled, radius, liveEnabled });
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={{ marginTop: 0 }}>🔔 Alert Settings</h2>

        {/* --- HOME ALERTS TOGGLE --- */}
        <div style={styles.section}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={{ transform: "scale(1.5)" }}
            />
            <strong>Enable Home Alerts</strong>
          </label>
        </div>

        {enabled && (
          <div style={styles.section}>
            <p style={{ marginBottom: "5px" }}>
              <strong>Alert Radius:</strong> {radius} km
            </p>
            <input
              type="range" min="1" max="50"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <small style={{ color: "#666" }}>
              Get alerted for verified incidents within this distance from your home.
            </small>

            <div style={{ marginTop: "15px" }}>
              <p><strong>Home Location:</strong></p>
              {currentSettings?.location ? (
                <div style={{ color: "green", marginBottom: "10px" }}>✅ Location Set</div>
              ) : (
                <div style={{ color: "red", marginBottom: "10px" }}>❌ Not Set</div>
              )}
              <button onClick={onPickLocation} style={styles.pickBtn}>
                📍 Pick "Home" on Map
              </button>
            </div>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

        {/* --- NEW: LIVE TRACKING ALERTS TOGGLE --- */}
        <div style={styles.section}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={liveEnabled}
              onChange={(e) => setLiveEnabled(e.target.checked)}
              style={{ transform: "scale(1.5)" }}
            />
            <strong>Enable Live Location Alerts</strong>
          </label>
          {liveEnabled && (
            <p style={{ margin: "10px 0 0 0", fontSize: "0.85rem", color: "#666", paddingLeft: "30px" }}>
              Uses your device's GPS to alert you if an incident is reported near your current location while the app is open.
            </p>
          )}
        </div>

        <div style={styles.actions}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSave} style={styles.saveBtn}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", justifyContent: "center", alignItems: "center", },
  modal: { backgroundColor: "white", padding: "25px", borderRadius: "8px", width: "90%", maxWidth: "400px", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", },
  section: { marginBottom: "20px" },
  pickBtn: { width: "100%", padding: "10px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", },
  actions: { display: "flex", justifyContent: "end", gap: "10px" },
  cancelBtn: { padding: "8px 15px", border: "none", background: "#eee", borderRadius: "4px", cursor: "pointer", },
  saveBtn: { padding: "8px 15px", border: "none", background: "#28a745", color: "white", borderRadius: "4px", cursor: "pointer", },
};

export default AlertSettings;