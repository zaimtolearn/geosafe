// src/components/AdminDashboard.jsx
import './AdminDashboard.css';

function AdminDashboard({ reports, onVerify, onDelete, onClose }) {
  const handleExportCSV = () => {
    // 1. Define the CSV Headers
    const headers = ["Report ID", "Title", "Category", "Status", "Latitude", "Longitude", "Date Submitted"];

    // 2. Map the data into rows
    const csvRows = [headers.join(",")]; // Start with headers

    reports.forEach((report) => {
      // Format the date properly
      const dateObj = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
      const formattedDate = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString();

      // Clean up text to prevent CSV breaking (e.g., if a title has a comma)
      const safeTitle = `"${(report.title || "").replace(/"/g, '""')}"`;

      const row = [
        report.id,
        safeTitle,
        report.category,
        report.status || "Unconfirmed",
        report.location?.lat,
        report.location?.lng,
        `"${formattedDate}"`
      ];

      csvRows.push(row.join(","));
    });

    // 3. Create a Blob (File) and trigger download
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `GeoSafe_Incident_Report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button onClick={onClose} className="btn-close">Close Dashboard</button>
      </div>

      <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0 }}>Total Reports: {reports.length}</p>
        <button
          onClick={handleExportCSV}
          style={{
            backgroundColor: "#28a745", color: "white", padding: "8px 15px",
            border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold"
          }}
        >
          📥 Download CSV
        </button>
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
                  if (window.confirm("Are you sure you want to delete this report?")) {
                    onDelete(report.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {reports.length === 0 && <p style={{ textAlign: 'center' }}>No reports found.</p>}
      </div>
    </div>
  );
}

export default AdminDashboard;