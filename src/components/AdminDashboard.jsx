// src/components/AdminDashboard.jsx
import { useState } from 'react';
import AdminAnalytics from './AdminAnalytics';
import './AdminDashboard.css';

function AdminDashboard({ reports, onVerify, onDelete, onEdit, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', category: '', status: '' });

  // Tab & Filter State
  const FLAG_THRESHOLD = 3;
  const flaggedReports = reports.filter(r => (r.denyVotes || 0) >= FLAG_THRESHOLD);
  const regularReports = reports.filter(r => (r.denyVotes || 0) < FLAG_THRESHOLD);

  const [activeTab, setActiveTab] = useState(flaggedReports.length > 0 ? 'flagged' : 'all');
  const [statusFilter, setStatusFilter] = useState('all'); // NEW: 'all', 'Unconfirmed', 'Confirmed'

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

  // --- REUSABLE REPORT CARD COMPONENT ---
  const renderReportCard = (report, isFlagged = false) => {
    const isEditing = editingId === report.id;
    const isConfirmed = report.status === 'Confirmed';

    return (
      <div key={report.id} className={`report-card-pro ${isFlagged ? 'flagged-card' : ''}`}>

        {isEditing ? (
          // --- EDIT MODE ---
          <div className="edit-form-pro">
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666' }}>Edit Title</label>
            <input
              className="edit-input-pro"
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            />

            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#666', marginTop: '5px' }}>Category & Status</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select
                className="edit-select-pro"
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              >
                <option value="Infrastructure">Infrastructure</option>
                <option value="Natural Hazard">Natural Hazard</option>
                <option value="Traffic">Traffic</option>
                <option value="Security">Security</option>
                <option value="Environment">Environment</option>
                <option value="Other">Other</option>
              </select>
              <select
                className="edit-select-pro"
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              >
                <option value="Unconfirmed">Unconfirmed</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>
          </div>
        ) : (
          // --- VIEW MODE ---
          <>
            <div className="card-header-pro">
              <h3 className="card-title-pro">{report.title}</h3>
              <span className={`pill ${isConfirmed ? 'pill-status-confirmed' : 'pill-status-unconfirmed'}`}>
                {isConfirmed ? '✅ Verified' : '⚠️ Pending'}
              </span>
            </div>

            <div className="card-meta-pro">
              <span className="pill pill-category">{report.category}</span>
              <span className="pill pill-votes">👍 {report.confirmVotes || 0} &nbsp;|&nbsp; 👎 {report.denyVotes || 0}</span>
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

        {/* ACTIONS FOOTER */}
        <div className="card-actions-pro">
          {isEditing ? (
            <>
              <button className="btn-pro btn-pro-verify" onClick={saveEdit}>💾 Save</button>
              <button className="btn-pro btn-pro-edit" onClick={() => setEditingId(null)}>Cancel</button>
            </>
          ) : (
            <>
              {!isConfirmed && (
                <button className="btn-pro btn-pro-verify" onClick={() => onVerify(report.id)}>Verify</button>
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

  // --- FILTER LOGIC ---
  let reportsToDisplay = activeTab === 'flagged' ? flaggedReports : regularReports;

  // Apply status filter ONLY if we are in the 'all' tab
  if (activeTab === 'all' && statusFilter !== 'all') {
    reportsToDisplay = reportsToDisplay.filter(r => (r.status || 'Unconfirmed') === statusFilter);
  }

  return (
    <div className="admin-dashboard-pro">

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
        </div>
      </header>

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist" aria-label="Report queues">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'flagged'}
            className={`tab-btn ${activeTab === 'flagged' ? 'active-danger' : ''}`}
            onClick={() => setActiveTab('flagged')}
          >
            Moderation
            {flaggedReports.length > 0 && <span className="badge-count">{flaggedReports.length}</span>}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All reports
          </button>
          {/* --- NEW ANALYTICS TAB --- */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'analytics'}
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
              id="admin-status-filter"
              className="admin-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="Unconfirmed">Pending only</option>
              <option value="Confirmed">Verified only</option>
            </select>
          </div>
        )}
      </div>

      {/* --- DYNAMIC CONTENT RENDERING --- */}
      {activeTab === 'analytics' ? (
        <AdminAnalytics reports={reports} />
      ) : (
        <>
          {/* Dynamic Grid */}
          <div className="report-grid-pro">
            {reportsToDisplay.map(report => renderReportCard(report, activeTab === 'flagged'))}
          </div>

          {/* Empty States */}
          {reportsToDisplay.length === 0 && (
            <div className="admin-empty-state">
              <h3 className="admin-empty-title">All clear</h3>
              <p className="admin-empty-text">
                {activeTab === 'flagged'
                  ? 'No flagged reports in this queue.'
                  : 'No reports match your current filter.'}
              </p>
            </div>
          )}
        </>
      )}

    </div>
  );
}

export default AdminDashboard;