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
  const [liveEnabled, setLiveEnabled] = useState(currentSettings?.liveEnabled || false);
  const [phone, setPhone] = useState(currentSettings?.phone || "");

  // --- NEW: Category Subscriptions State ---
  const defaultCategories = {
    "Infrastructure": true, "Natural Hazard": true, "Traffic": true,
    "Security": true, "Environment": true, "Other": true
  };
  const [categories, setCategories] = useState(currentSettings?.categories || defaultCategories);

  const handleCategoryChange = (cat) => {
    setCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSave = () => {
    if ((enabled || liveEnabled) && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    // --- NEW: Pass categories back to App.jsx ---
    onSave({ enabled, radius, liveEnabled, categories, phone });
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={{ marginTop: 0, marginBottom: '15px' }}>🔔 Alert Settings</h2>

        {/* --- NEW: CATEGORY SUBSCRIPTIONS UI --- */}
        <div style={styles.section}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '8px', color: '#1f2937' }}>Alert Categories</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.keys(categories).map((cat) => (
              <label key={cat} style={{
                fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer',
                backgroundColor: categories[cat] ? '#e0f2fe' : '#f1f5f9',
                padding: '6px 10px', borderRadius: '20px',
                border: `1px solid ${categories[cat] ? '#38bdf8' : '#cbd5e1'}`,
                color: categories[cat] ? '#0369a1' : '#64748b'
              }}>
                <input
                  type="checkbox"
                  checked={categories[cat]}
                  onChange={() => handleCategoryChange(cat)}
                  style={{ display: 'none' }} // Hide native checkbox for cleaner UI
                />
                {categories[cat] ? '✓ ' : '+ '}{cat}
              </label>
            ))}
          </div>
          <small style={{ color: "#6b7280", display: 'block', marginTop: '8px' }}>
            You will only receive notifications for the incident types selected above.
          </small>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

        {/* --- NEW: WHATSAPP NOTIFICATION SETUP --- */}
        <div style={styles.section}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '8px', color: '#1f2937' }}>📱 WhatsApp Alerts</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>
            Enter your WhatsApp number to receive instant SMS alerts when a critical incident is verified near you.
          </p>
          {currentSettings?.phone && (
            <div style={{ backgroundColor: '#dcfce3', color: '#166534', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #bbf7d0' }}>
              ✅ Saved in Firebase: {currentSettings.phone}
            </div>
          )}
          <input
            type="tel"
            placeholder="e.g. +60123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: '100%', padding: '10px', borderRadius: '6px',
              border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none'
            }}
          />
          <small style={{ color: '#94a3b8', display: 'block', marginTop: '5px' }}>
            Must include country code (e.g., +60 for Malaysia).
          </small>
        </div>

        {/* --- HOME ALERTS TOGGLE --- */}
        <div style={styles.section}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              style={{ transform: "scale(1.3)" }}
            />
            <strong style={{ color: '#1f2937' }}>Enable Home Alerts</strong>
          </label>
        </div>

        {enabled && (
          <div style={styles.section}>
            <p style={{ marginBottom: "5px", color: '#4b5563' }}>
              <strong>Alert Radius:</strong> {radius} km
            </p>
            <input
              type="range" min="1" max="50"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <small style={{ color: "#6b7280" }}>
              Get alerted for verified incidents within this distance from your home.
            </small>

            <div style={{ marginTop: "15px" }}>
              <p style={{ color: '#4b5563', marginBottom: '5px' }}><strong>Home Location:</strong></p>
              {currentSettings?.location ? (
                <div style={{ color: "#16a34a", marginBottom: "10px", fontSize: '0.9rem', fontWeight: 'bold' }}>✅ Location Set</div>
              ) : (
                <div style={{ color: "#dc2626", marginBottom: "10px", fontSize: '0.9rem', fontWeight: 'bold' }}>❌ Not Set</div>
              )}
              <button onClick={onPickLocation} style={styles.pickBtn}>
                📍 Pick "Home" on Map
              </button>
            </div>
          </div>
        )}

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '20px 0' }} />

        {/* --- LIVE TRACKING ALERTS TOGGLE --- */}
        <div style={styles.section}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={liveEnabled}
              onChange={(e) => setLiveEnabled(e.target.checked)}
              style={{ transform: "scale(1.3)" }}
            />
            <strong style={{ color: '#1f2937' }}>Enable Live Location Alerts</strong>
          </label>
          {liveEnabled && (
            <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", color: "#6b7280", paddingLeft: "28px" }}>
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
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 3000, display: "flex", justifyContent: "center", alignItems: "center", backdropFilter: 'blur(2px)' },
  modal: { backgroundColor: "white", padding: "25px", borderRadius: "12px", width: "90%", maxWidth: "420px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", maxHeight: '90vh', overflowY: 'auto' },
  section: { marginBottom: "15px" },
  pickBtn: { width: "100%", padding: "10px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", transition: 'background 0.2s' },
  actions: { display: "flex", justifyContent: "end", gap: "10px", marginTop: '25px' },
  cancelBtn: { padding: "10px 15px", border: "1px solid #cbd5e1", background: "white", color: "#475569", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  saveBtn: { padding: "10px 15px", border: "none", background: "#10b981", color: "white", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
};

export default AlertSettings;