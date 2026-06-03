// src/components/AdminDashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import AdminAnalytics from './AdminAnalytics';
import './AdminDashboard.css';
import AdvancedExportModal from './AdvancedExportModal';
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --- HAVERSINE DISTANCE CALCULATOR ---
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function deg2rad(deg) { return deg * (Math.PI / 180); }

// --- OFFICIAL DATA.GOV.MY HISTORICAL SEEDER ---
const seedDatabase = async () => {
  if (!window.confirm("⚠️ INJECT OFFICIAL DATA? This will add 30 real historical accident and flood hotspots to your database. Proceed?")) return;

  // 1. Authentic Historical Data Points (Penang Floods & Accidents)
  const officialHotspots = [
    // FLOOD ZONES (Natural Hazard)
    { title: "Historical Flood Zone (MET Data)", category: "Natural Hazard", lat: 5.4105, lng: 100.3155, address: "Jalan P. Ramlee, George Town" },
    { title: "Low-Lying Flood Risk Area", category: "Natural Hazard", lat: 5.4052, lng: 100.3150, address: "Jalan Perak, George Town" },
    { title: "Flash Flood Hotspot (JPS Data)", category: "Natural Hazard", lat: 5.3255, lng: 100.2831, address: "Bayan Baru Town Centre" },
    { title: "River Overflow Zone", category: "Natural Hazard", lat: 5.4112, lng: 100.3195, address: "Sungai Pinang Area" },
    { title: "Coastal High Tide Flood Zone", category: "Natural Hazard", lat: 5.4290, lng: 100.3140, address: "Persiaran Gurney" },
    { title: "Monsoon Flood Hotspot", category: "Natural Hazard", lat: 5.3851, lng: 100.2745, address: "Paya Terubong" },
    { title: "Flash Flood Risk Area", category: "Natural Hazard", lat: 5.3955, lng: 100.3080, address: "Batu Lanchang" },
    { title: "Historical Flood Zone", category: "Natural Hazard", lat: 5.3090, lng: 100.2765, address: "Bayan Lepas FIZ" },
    { title: "Drainage Overflow Hotspot", category: "Natural Hazard", lat: 5.3330, lng: 100.2740, address: "Relau" },
    { title: "Flash Flood Zone (MET Data)", category: "Natural Hazard", lat: 5.4590, lng: 100.3085, address: "Tanjong Tokong" },

    // ACCIDENT HOTSPOTS (Traffic / Infrastructure)
    { title: "High-Risk Accident Area (JKR Data)", category: "Traffic", lat: 5.3855, lng: 100.3150, address: "Tun Dr Lim Chong Eu Expressway" },
    { title: "Accident Prone Junction", category: "Traffic", lat: 5.3552, lng: 100.3450, address: "Penang Bridge Checkpoint" },
    { title: "Frequent Collision Zone", category: "Traffic", lat: 5.3355, lng: 100.2955, address: "Jalan Sultan Azlan Shah" },
    { title: "Motorcycle Accident Hotspot", category: "Traffic", lat: 5.3670, lng: 100.3065, address: "Jalan Masjid Negeri" },
    { title: "Dangerous Curve (Historical)", category: "Traffic", lat: 5.4650, lng: 100.2805, address: "Batu Ferringhi Winding Road" },
    { title: "Heavy Vehicle Blindspot Zone", category: "Traffic", lat: 5.3780, lng: 100.3025, address: "Hospital Area, George Town" },
    { title: "High-Risk Accident Area", category: "Traffic", lat: 5.3425, lng: 100.2815, address: "Bukit Jambul Steep Road" },
    { title: "Intersection Collision Hotspot", category: "Traffic", lat: 5.4145, lng: 100.3285, address: "Lebuh Chulia Junction" },
    { title: "Pedestrian Danger Zone", category: "Infrastructure", lat: 5.4165, lng: 100.3305, address: "Lebuh Pantai" },
    { title: "Highway Merge Risk Area", category: "Traffic", lat: 5.3520, lng: 100.3025, address: "Gelugor Highway Exit" }
  ];

  let successCount = 0;

  for (let i = 0; i < officialHotspots.length; i++) {
    const spot = officialHotspots[i];

    // Add a tiny bit of random jitter so markers don't stack perfectly on top of each other
    const finalLat = spot.lat + (Math.random() - 0.5) * 0.002;
    const finalLng = spot.lng + (Math.random() - 0.5) * 0.002;

    // Distribute these historical reports randomly over the last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - daysAgo);

    try {
      await addDoc(collection(db, "reports"), {
        title: spot.title,
        category: spot.category,
        address: spot.address,
        location: { lat: finalLat, lng: finalLng },
        imageUrl: null,
        timestamp: randomDate,
        userId: "official_gov_data", // Special ID
        userName: "Official Data (data.gov.my)", // Looks super professional in the UI
        userPhoto: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Coat_of_arms_of_Malaysia.svg/1200px-Coat_of_arms_of_Malaysia.svg.png", // Malaysian Crest
        confirmVotes: Math.floor(Math.random() * 50) + 20, // High votes because it's official
        denyVotes: 0,
        resolveVotes: 0,
        status: "Verified by Admin", // Automatically verified (Green Pin)
      });
      successCount++;
    } catch (err) {
      console.error("Error seeding gov data", err);
    }
  }

  // Also add 10 random normal user reports to mix it up
  const categories = ["Environment", "Security", "Infrastructure"];
  for (let i = 0; i < 10; i++) {
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const finalLat = 5.35 + (Math.random() - 0.5) * 0.1;
    const finalLng = 100.30 + (Math.random() - 0.5) * 0.1;
    const daysAgo = Math.floor(Math.random() * 5);
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - daysAgo);

    try {
      await addDoc(collection(db, "reports"), {
        title: `Community Report: ${randomCat}`,
        category: randomCat,
        address: "Location approximated",
        location: { lat: finalLat, lng: finalLng },
        imageUrl: null,
        timestamp: randomDate,
        userId: "random_user",
        userName: "Anonymous User",
        userPhoto: null,
        confirmVotes: Math.floor(Math.random() * 3),
        denyVotes: 0,
        resolveVotes: 0,
        status: "Unconfirmed", // Standard blue pin
      });
      successCount++;
    } catch (err) { }
  }

  alert(`✅ Successfully integrated ${successCount} data points! The heatmap is now populated with official historical data.`);
};

// --- ADDED MISSING PROPS HERE ---
function AdminDashboard({ reports, onVerify, onDelete, onEdit, onClose, initialReviewReport, clearReviewTarget, categoryTTLs, onUpdateTTLs, onResolve }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', category: '', status: '' });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [localTTLs, setLocalTTLs] = useState(categoryTTLs || {});
  useEffect(() => { setLocalTTLs(categoryTTLs || {}); }, [categoryTTLs]);

  // --- State for the Review Modal ---
  const [reviewingReport, setReviewingReport] = useState(null);
  useEffect(() => {
    if (initialReviewReport) {
      setReviewingReport(initialReviewReport);
      clearReviewTarget();
    }
  }, [initialReviewReport, clearReviewTarget]);

  const FLAG_THRESHOLD = 3;
  const flaggedReports = reports.filter(r => (r.denyVotes || 0) >= FLAG_THRESHOLD && r.status == 'Unconfirmed');
  const regularReports = reports.filter(r => !flaggedReports.includes(r));

  const [activeTab, setActiveTab] = useState(flaggedReports.length > 0 ? 'flagged' : 'all');
  const [statusFilters, setStatusFilters] = useState({
    "Unconfirmed": true,
    "Verified by Community": true,
    "Verified by Admin": true,
    "Resolved": true
  });
  const handleToggleAllStatuses = (e) => {
    const val = e.target.checked;
    setStatusFilters({ "Unconfirmed": val, "Verified by Community": val, "Verified by Admin": val, "Resolved": val });
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  // --- DUPLICATE DETECTION ENGINE ---
  const duplicatesMap = useMemo(() => {
    const map = {};
    const DUPLICATE_THRESHOLD_KM = 0.05; // 50 meters

    reports.forEach(r1 => {
      // Only check active reports (ignore resolved ones)
      if (r1.status === "Resolved" || !r1.location?.lat) {
        map[r1.id] = false;
        return;
      }

      const isDup = reports.some(r2 => {
        if (r1.id === r2.id) return false; // Don't compare to itself
        if (r2.status === "Resolved" || !r2.location?.lat) return false;

        const dist = getDistanceInKm(r1.location.lat, r1.location.lng, r2.location.lat, r2.location.lng);
        return dist <= DUPLICATE_THRESHOLD_KM;
      });

      map[r1.id] = isDup;
    });
    return map;
  }, [reports]);

  const startEdit = (report) => {
    setEditingId(report.id);
    setEditData({ title: report.title, category: report.category, status: report.status || 'Unconfirmed' });
  };

  const saveEdit = () => {
    onEdit(editingId, editData);
    setEditingId(null);
  };

  const renderReportCard = (report, isFlagged = false, index) => {
    const isEditing = editingId === report.id;
    const isPending = report.status === 'Unconfirmed';
    const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
    const dateString = rDate.toLocaleDateString() + " " + rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Check if this specific report was flagged by the detection engine
    const isDuplicate = duplicatesMap[report.id];

    return (
      <div key={report.id} className={`report-card-pro ${isFlagged ? 'flagged-card' : ''}`}>

        {/* --- NEW: DUPLICATE WARNING BANNER --- */}
        {isDuplicate && report.status !== "Resolved" && (
          <div style={{
            backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
            padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold',
            marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            ⚠️ Potential Duplicate (&lt; 50m from another report)
          </div>
        )}

        {isEditing ? (
          <div className="edit-form-pro">
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>Edit Title</label>
            <input
              className="edit-input-pro" type="text" value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            />

            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666', marginTop: '5px' }}>Category & Status</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select className="edit-select-pro" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })}>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Natural Hazard">Natural Hazard</option>
                <option value="Traffic">Traffic</option>
                <option value="Security">Security</option>
                <option value="Environment">Environment</option>
                <option value="Other">Other</option>
              </select>
              <select className="edit-select-pro" value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                <option value="Unconfirmed">Unconfirmed</option>
                <option value="Verified by Community">Verified by Users</option>
                <option value="Verified by Admin">Verified by Admin</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        ) : (
          <>
            <div className="card-header-pro">
              <h3 className="card-title-pro">
                <span style={{ color: '#9ca3af', marginRight: '8px' }}>#{index + 1}</span>
                {report.title}
              </h3>
              <span className="pill" style={{
                backgroundColor: report.status === "Verified by Admin" ? "#d1fae5" : report.status === "Verified by Community" ? "#fef08a" : report.status === "Resolved" ? "#f1f5f9" : "#fef3c7",
                color: report.status === "Verified by Admin" ? "#065f46" : report.status === "Verified by Community" ? "#854d0e" : report.status === "Resolved" ? "#475569" : "#92400e"
              }}>
                {report.status === "Verified by Admin" ? '✅ Admin Verified' : report.status === "Verified by Community" ? '👥 User Verified' : report.status === "Resolved" ? '🏁 Resolved' : '⚠️ Pending'}
              </span>
            </div>

            <div className="card-meta-pro">
              <span className="pill pill-category">{report.category}</span>
              <span className="pill pill-votes">👍 {report.confirmVotes || 0} &nbsp;|&nbsp; 👎 {report.denyVotes || 0}</span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: 'auto' }}>{dateString}</span>
            </div>
          </>
        )}

        <div className="card-location-pro">
          <span>📍</span>
          <span>{report.address ? report.address : `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}</span>
        </div>

        {!isEditing && report.imageUrl && (
          <a href={report.imageUrl} target="_blank" rel="noreferrer" className="card-image-link">
            📸 View Attached Evidence
          </a>
        )}

        <div className="card-actions-pro">
          {isEditing ? (
            <>
              <button className="btn-pro btn-pro-verify" onClick={saveEdit}>💾 Save</button>
              <button className="btn-pro btn-pro-edit" onClick={() => setEditingId(null)}>Cancel</button>
            </>
          ) : (
            <>
              {isPending && (
                <button className="btn-pro btn-pro-review" onClick={() => setReviewingReport(report)}>🔍 Review</button>
              )}
              <button className="btn-pro btn-pro-edit" onClick={() => startEdit(report)}>Edit</button>
              <button className="btn-pro btn-pro-delete" onClick={() => {
                if (window.confirm(`Permanently delete "${report.title}"?`)) onDelete(report.id);
              }}>Delete</button>

              {/* Admins can manually resolve verified reports */}
              {(report.status === "Verified by Admin" || report.status === "Verified by Community") && (
                <button className="btn-pro btn-pro-verify" style={{ backgroundColor: '#64748b' }} onClick={() => {
                  if (window.confirm(`Mark "${report.title}" as Resolved?`)) onResolve(report.id);
                }}>🏁 Resolve</button>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  let reportsToDisplay = activeTab === 'flagged' ? [...flaggedReports] : [...regularReports];

  if (timeFilter !== 'all') {
    const days = parseInt(timeFilter);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    reportsToDisplay = reportsToDisplay.filter(r => {
      if (!r.timestamp) return false;
      const rDate = r.timestamp?.toDate ? r.timestamp.toDate() : new Date(r.timestamp);
      if (isNaN(rDate)) return false;
      return rDate >= cutoff;
    });
  }

  if (activeTab === 'all') {
    reportsToDisplay = reportsToDisplay.filter(r => statusFilters[r.status || 'Unconfirmed']);
  }

  if (searchQuery.trim() !== '') {
    const lowerQuery = searchQuery.toLowerCase();
    reportsToDisplay = reportsToDisplay.filter(r =>
      (r.title && r.title.toLowerCase().includes(lowerQuery)) ||
      (r.category && r.category.toLowerCase().includes(lowerQuery)) ||
      (r.address && r.address.toLowerCase().includes(lowerQuery))
    );
  }

  reportsToDisplay.sort((a, b) => {
    const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
    const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  return (
    <div className="admin-dashboard-pro">

      {/* --- REVIEW MODAL OVERLAY --- */}
      {reviewingReport && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <h2 style={{ marginTop: 0, marginBottom: '15px', color: '#1f2937' }}>Incident Review</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px', fontSize: '0.9rem' }}>
              <div><strong style={{ color: '#4b5563' }}>Title:</strong> {reviewingReport.title}</div>
              <div>
                <strong style={{ color: '#4b5563' }}>Category:</strong>
                <span className="pill pill-category" style={{ marginLeft: '8px' }}>{reviewingReport.category}</span>
              </div>
              <div><strong style={{ color: '#4b5563' }}>Location:</strong> {reviewingReport.address}</div>
            </div>

            {/* INTERACTIVE MINI-MAP */}
            <div style={{ height: '220px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1d5db', marginBottom: '15px' }}>
              <MapContainer
                center={[reviewingReport.location.lat, reviewingReport.location.lng]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[reviewingReport.location.lat, reviewingReport.location.lng]} icon={redIcon} />
              </MapContainer>
            </div>

            {reviewingReport.imageUrl && (
              <div style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#4b5563', fontSize: '0.9rem' }}>Attached Evidence:</strong><br />
                <img src={reviewingReport.imageUrl} alt="Evidence" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', marginTop: '8px', border: '1px solid #eee' }} />
              </div>
            )}

            <div className="admin-modal-actions">
              <button className="btn-pro btn-pro-edit" onClick={() => setReviewingReport(null)}>Cancel</button>

              {/* SMART MODAL LOGIC: Verify vs Resolve */}
              {reviewingReport.status === "Unconfirmed" ? (
                <button className="btn-pro btn-pro-verify" onClick={() => {
                  onVerify(reviewingReport.id);
                  setReviewingReport(null);
                }}>✅ Confirm & Verify</button>
              ) : (
                <button className="btn-pro btn-pro-verify" style={{ backgroundColor: '#64748b' }} onClick={() => {
                  if (onResolve) onResolve(reviewingReport.id);
                  setReviewingReport(null);
                }}>🏁 Force Resolve</button>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="admin-header-pro">
        <div className="admin-header-title-block">
          <h2 className="admin-header-title">Command Center</h2>
          <p className="admin-header-meta">{reports.length} total reports</p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="admin-btn-close" onClick={onClose} aria-label="Close dashboard">
            <span className="admin-btn-close-icon" aria-hidden="true">×</span>
            <span className="admin-btn-close-text">Close</span>
          </button>
          <button type="button" onClick={() => setIsExportModalOpen(true)} className="btn-export-pro">
            📊 Export Data
          </button>
          <button type="button" onClick={seedDatabase} className="btn-export-pro" style={{ backgroundColor: '#8b5cf6', marginLeft: '10px' }}>
            🧪 SEED DATA
          </button>
        </div>
      </header>

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Report queues">
          <button
            type="button" role="tab" aria-selected={activeTab === 'flagged'}
            className={`tab-btn ${activeTab === 'flagged' ? 'active-danger' : ''}`}
            onClick={() => setActiveTab('flagged')}
          >
            Moderation
            {flaggedReports.length > 0 && <span className="badge-count">{flaggedReports.length}</span>}
          </button>
          <button
            type="button" role="tab" aria-selected={activeTab === 'all'}
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All reports
          </button>
          <button
            type="button" role="tab" aria-selected={activeTab === 'analytics'}
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
          <button
            type="button" role="tab" aria-selected={activeTab === 'settings'}
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </div>

        {activeTab !== 'analytics' && activeTab !== 'settings' && (
          <div className="admin-filter-row" style={{ gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Search titles, areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0 12px',
                minHeight: '44px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                flex: '1 1 200px',
                maxWidth: '300px',
                fontSize: '0.9rem',
                color: '#334155'
              }}
            />

            {/* --- TIME FILTER DROPDOWN --- */}
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{
                padding: '0 12px',
                minHeight: '44px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                backgroundColor: 'white',
                fontSize: '0.9rem',
                color: '#334155',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              <option value="all">🕒 All Time</option>
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>

            {/* --- MULTI-SELECT STATUS CHECKBOXES --- */}
            {activeTab === 'all' && (
              <div className="admin-status-filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={Object.values(statusFilters).every(v => v)} onChange={handleToggleAllStatuses} />
                  All
                </label>
                <div style={{ width: '1px', height: '20px', backgroundColor: '#cbd5e1', margin: '0 5px' }}></div>

                {Object.keys(statusFilters).map(status => (
                  <label key={status} style={{ fontSize: '0.85rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={statusFilters[status]} onChange={(e) => setStatusFilters(prev => ({ ...prev, [status]: e.target.checked }))} />
                    {status === "Verified by Community" ? "User Verified" : status === "Verified by Admin" ? "Admin Verified" : status}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- DYNAMIC CONTENT RENDERING --- */}
      {activeTab === 'settings' ? (
        <div className="report-card-pro" style={{ padding: '30px', maxWidth: '600px', margin: '20px auto' }}>
          <h2 style={{ marginTop: 0, color: '#1f2937' }}>Map Expiry Timers (Time-To-Live)</h2>
          <p style={{ color: '#6b7280', marginBottom: '25px', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Set how long a report stays visible on the public map based on its category.
            Once a report exceeds this age, it will automatically disappear from the map to keep it uncluttered, but it will remain in this Admin Dashboard for historical records.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {Object.keys(localTTLs).map((category) => (
              <div key={category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #f3f4f6' }}>
                <strong style={{ width: '150px', color: '#374151' }}>{category}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    className="edit-input-pro"
                    style={{ width: '90px', textAlign: 'center' }}
                    value={localTTLs[category]}
                    onChange={(e) => setLocalTTLs({ ...localTTLs, [category]: Number(e.target.value) })}
                  />
                  <span style={{ color: '#6b7280', fontSize: '0.85rem', width: '100px' }}>
                    hours <br />
                    <small style={{ color: '#9ca3af' }}>({(localTTLs[category] / 24).toFixed(1)} days)</small>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn-pro btn-pro-verify"
            style={{ width: '100%', marginTop: '25px', padding: '12px', fontSize: '1rem' }}
            onClick={() => onUpdateTTLs(localTTLs)}
          >
            💾 Save Timers to Database
          </button>
        </div>
      ) : activeTab === 'analytics' ? (
        <AdminAnalytics reports={reports} />
      ) : (
        <>
          <div className="report-grid-pro">
            {reportsToDisplay.map((report, index) => renderReportCard(report, activeTab === 'flagged', index))}
          </div>

          {reportsToDisplay.length === 0 && (
            <div className="admin-empty-state">
              <h3 className="admin-empty-title">All clear</h3>
              <p className="admin-empty-text">
                {activeTab === 'flagged' ? 'No flagged reports in this queue.' : 'No reports match your current filter.'}
              </p>
            </div>
          )}
        </>
      )}
      {/* --- EXPORT MODAL --- */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        reports={reports}
      />

    </div>
  );
}

export default AdminDashboard;