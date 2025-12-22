// src/components/AdminDashboard.jsx
import './AdminDashboard.css';

function AdminDashboard({ reports, onVerify, onDelete, onClose }) {
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button onClick={onClose} className="btn-close">Close Dashboard</button>
      </div>

      <div className="stats-bar">
        <p>Total Reports: {reports.length}</p>
      </div>

      <div className="report-list">
        {reports.map((report) => (
          <div key={report.id} className="report-card">
            <div className="report-info">
              <h3>
                {report.title} 
                <span className={`status-badge status-${report.status || 'Unconfirmed'}`}>
                  {report.status || 'Unconfirmed'}
                </span>
              </h3>
              <p><b>Category:</b> {report.category} | <b>Votes:</b> 👍{report.confirmVotes || 0} 👎{report.denyVotes || 0}</p>
              <p><b>Location:</b> {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}</p>
              {report.imageUrl && <a href={report.imageUrl} target="_blank" rel="noreferrer">View Photo</a>}
            </div>

            <div className="admin-actions">
              {/* Verify Button (Only show if not yet verified) */}
              {report.status !== 'Confirmed' && (
                <button 
                  className="btn-verify"
                  onClick={() => onVerify(report.id)}
                >
                  Verify
                </button>
              )}

              {/* Delete Button */}
              <button 
                className="btn-delete"
                onClick={() => {
                  if(window.confirm("Are you sure you want to delete this report?")) {
                    onDelete(report.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {reports.length === 0 && <p style={{textAlign: 'center'}}>No reports found.</p>}
      </div>
    </div>
  );
}

export default AdminDashboard;