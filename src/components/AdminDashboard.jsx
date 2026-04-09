// src/components/AdminDashboard.jsx
import { useState } from 'react';
import AdminAnalytics from './AdminAnalytics';
import './AdminDashboard.css';
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

// --- NEW LEAFLET IMPORTS ---
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// --- TEMPORARY DATABASE SEEDER ---
const seedDatabase = async () => {
  // ... [Keep your exact existing seedDatabase function here] ...
  if (!window.confirm("⚠️ WARNING: This will inject 10 fake reports into your live database. Proceed?")) return;

  const categories = ["Infrastructure", "Natural Hazard", "Traffic", "Security", "Environment"];
  const titles = [
    "Massive pothole in left lane", "Fallen tree blocking road", "Traffic light malfunction",
    "Flooding after heavy rain", "Vandalized street sign", "Illegal dumping ground",
    "Streetlights not working", "Minor car collision", "Suspicious gathering", "Broken pavement"
  ];

  const penangLocations = [
    { lat: 5.3582, lng: 100.2965, address: "Universiti Sains Malaysia, Gelugor, Penang, 11800, Malaysia" },
    { lat: 5.3421, lng: 100.2819, address: "Jalan Bukit Gambir, Bukit Jambul, Penang, 11950, Malaysia" },
    { lat: 5.4141, lng: 100.3288, address: "Lebuh Chulia, George Town, Penang, 10200, Malaysia" },
    { lat: 5.3315, lng: 100.2928, address: "Queensbay Mall Area, Bayan Lepas, Penang, 11900, Malaysia" },
    { lat: 5.4294, lng: 100.3142, address: "Persiaran Gurney, George Town, Penang, 10250, Malaysia" },
    { lat: 5.3833, lng: 100.3138, address: "Jalan Sultan Azlan Shah, Gelugor, Penang, 11700, Malaysia" },
    { lat: 5.3957, lng: 100.3194, address: "Karpal Singh Drive, Jelutong, Penang, 11600, Malaysia" },
    { lat: 5.2971, lng: 100.2582, address: "Jalan Permatang Damar Laut, Bayan Lepas, Penang, 11960, Malaysia" },
    { lat: 5.3218, lng: 100.2823, address: "SPICE Arena Area, Bayan Baru, Penang, 11900, Malaysia" },
    { lat: 5.4168, lng: 100.3303, address: "Lebuh Pantai (Beach Street), George Town, Penang, 10300, Malaysia" },
    { lat: 5.3674, lng: 100.3061, address: "Jalan Masjid Negeri, Green Lane, Penang, 11600, Malaysia" },
    { lat: 5.3096, lng: 100.2769, address: "Bayan Lepas Free Industrial Zone, Phase 3, Penang, 11900, Malaysia" }
  ];

  let successCount = 0;

  for (let i = 0; i < 10; i++) {
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    const randomLoc = penangLocations[Math.floor(Math.random() * penangLocations.length)];

    const jitterLat = (Math.random() - 0.5) * 0.004;
    const jitterLng = (Math.random() - 0.5) * 0.004;

    const finalLat = randomLoc.lat + jitterLat;
    const finalLng = randomLoc.lng + jitterLng;

    const randomConfirmVotes = Math.floor(Math.random() * 20);
    const randomDenyVotes = Math.floor(Math.random() * 5);
    const isConfirmed = Math.random() > 0.4 ? "Confirmed" : "Unconfirmed";

    const daysAgo = Math.floor(Math.random() * 30);
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - daysAgo);

    try {
      await addDoc(collection(db, "reports"), {
        title: `${randomTitle} [SEED]`,
        category: randomCat,
        address: randomLoc.address,
        location: { lat: finalLat, lng: finalLng },
        imageUrl: null,
        timestamp: randomDate,
        userId: "admin_seed_script",
        userName: "System Generated",
        userPhoto: null,
        confirmVotes: randomConfirmVotes,
        denyVotes: randomDenyVotes,
        status: isConfirmed,
      });
      successCount++;
    } catch (err) {
      console.error("Error seeding doc", err);
    }
  }
  alert(`✅ Successfully seeded ${successCount} realistic reports! Refresh the page to see them.`);
};


function AdminDashboard({ reports, onVerify, onDelete, onEdit, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', category: '', status: '' });

  // --- NEW: State for the Review Modal ---
  const [reviewingReport, setReviewingReport] = useState(null);

  const FLAG_THRESHOLD = 3;
  const flaggedReports = reports.filter(r => (r.denyVotes || 0) >= FLAG_THRESHOLD && r.status !== 'Confirmed');
  const regularReports = reports.filter(r => !flaggedReports.includes(r));

  const [activeTab, setActiveTab] = useState(flaggedReports.length > 0 ? 'flagged' : 'all');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleExportCSV = () => {
    const headers = ["Report ID", "Title", "Category", "Status", "Latitude", "Longitude", "Date Submitted"];
    const csvRows = [headers.join(",")];

    reports.forEach((report) => {
      const dateObj = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
      const formattedDate = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString();
      const safeTitle = `"${(report.title || "").replace(/"/g, '""')}"`;

      const row = [
        report.id, safeTitle, report.category, report.status || "Unconfirmed",
        report.location?.lat, report.location?.lng, `"${formattedDate}"`
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GeoSafe_Insights_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    const isConfirmed = report.status === 'Confirmed';
    const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
    const dateString = rDate.toLocaleDateString() + " " + rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <div key={report.id} className={`report-card-pro ${isFlagged ? 'flagged-card' : ''}`}>

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
                <option value="Confirmed">Confirmed</option>
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
              <span className={`pill ${isConfirmed ? 'pill-status-confirmed' : 'pill-status-unconfirmed'}`}>
                {isConfirmed ? 'Confirmed' : 'Pending'}
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
              {/* --- NEW REVIEW BUTTON --- */}
              {!isConfirmed && (
                <button className="btn-pro btn-pro-review" onClick={() => setReviewingReport(report)}>🔍 Review</button>
              )}
              <button className="btn-pro btn-pro-edit" onClick={() => startEdit(report)}>Edit</button>
              <button className="btn-pro btn-pro-delete" onClick={() => {
                if (window.confirm(`Permanently delete "${report.title}"?`)) onDelete(report.id);
              }}>Delete</button>
            </>
          )}
        </div>
      </div>
    );
  };

  let reportsToDisplay = activeTab === 'flagged' ? [...flaggedReports] : [...regularReports];

  if (activeTab === 'all' && statusFilter !== 'all') {
    reportsToDisplay = reportsToDisplay.filter(r => (r.status || 'Unconfirmed') === statusFilter);
  }

  reportsToDisplay.sort((a, b) => {
    const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
    const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
    return timeB - timeA;
  });

  return (
    <div className="admin-dashboard-pro">

      {/* --- NEW REVIEW MODAL OVERLAY --- */}
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
              // Notice we do NOT disable dragging or scrolling here so the Admin can explore!
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
              <button className="btn-pro btn-pro-verify" onClick={() => {
                onVerify(reviewingReport.id);
                setReviewingReport(null);
              }}>✅ Confirm & Verify</button>
            </div>
          </div>
        </div>
      )}
      {/* --------------------------------- */}

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
          <button type="button" onClick={handleExportCSV} className="btn-export-pro">
            Export CSV
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
        </div>

        {activeTab === 'all' && (
          <div className="admin-filter-row">
            <label className="admin-filter-label" htmlFor="admin-status-filter">Status</label>
            <select
              id="admin-status-filter" className="admin-filter-select"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="Unconfirmed">Pending only</option>
              <option value="Confirmed">Verified only</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === 'analytics' ? (
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

    </div>
  );
}

export default AdminDashboard;