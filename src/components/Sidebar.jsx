// src/components/Sidebar.jsx
import { useState, useEffect } from 'react';

function Sidebar({ isOpen, onClose, user, userReports, onFlyTo, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");

  // Sync the input with the user's current name when they open the editor
  useEffect(() => {
    if (user) {
      setNewName(user.displayName || "");
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    if (newName.trim() === "") return;
    onUpdateProfile(newName.trim());
    setIsEditing(false);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.sidebar}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>My Account</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {!user ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👋</div>
            <p style={{ margin: 0 }}>Please log in to manage your profile and track reports.</p>
          </div>
        ) : (
          <>
            {/* --- PROFILE SECTION --- */}
            <div style={styles.profileSection}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <img
                  src={user.photoURL || "/icon-192.png"}
                  alt="Profile"
                  style={styles.profileAvatar}
                  onError={(e) => { e.target.src = "/icon-192.png" }}
                />
                <div style={{ flex: 1 }}>
                  {isEditing ? (
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      style={styles.editInput}
                      placeholder="Display Name"
                      autoFocus
                    />
                  ) : (
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#111' }}>
                      {user.displayName || "Anonymous User"}
                    </h3>
                  )}
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{user.email}</p>
                </div>
              </div>

              {isEditing ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSaveProfile} style={styles.btnSave}>Save</button>
                  <button onClick={() => setIsEditing(false)} style={styles.btnCancel}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} style={styles.btnEdit}>
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            {/* --- USER REPORTS SECTION --- */}
            <div style={styles.reportsHeader}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>My Incident Reports</h3>
              <span style={styles.badge}>{userReports.length}</span>
            </div>

            <div style={styles.list}>
              {userReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af' }}>
                  <p style={{ margin: 0 }}>You haven't reported anything yet.</p>
                </div>
              ) : (
                userReports.map(report => (
                  <div
                    key={report.id}
                    style={styles.card}
                    onClick={() => onFlyTo(report.location)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <strong style={{ color: '#1f2937', fontSize: '0.95rem', lineHeight: '1.2' }}>{report.title}</strong>
                      <span style={{
                        fontSize: '0.7rem', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold',
                        backgroundColor: report.status === 'Confirmed' ? '#d1fae5' : '#fef3c7',
                        color: report.status === 'Confirmed' ? '#065f46' : '#92400e'
                      }}>
                        {report.status || 'Pending'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📍</span> {report.category}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#9ca3af', borderTop: '1px solid #f3f4f6', paddingTop: '8px' }}>
                      <span>{new Date(report.timestamp.seconds * 1000).toLocaleDateString()}</span>
                      <span>👍 {report.confirmVotes || 0} &nbsp;|&nbsp; 👎 {report.denyVotes || 0}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Professional Styling
const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', zIndex: 1500 },
  sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '320px', backgroundColor: '#f9fafb', boxShadow: '4px 0 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' },
  header: { padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#6b7280', lineHeight: 1 },

  profileSection: { padding: '20px', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', marginBottom: '10px' },
  profileAvatar: { width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb' },
  editInput: { width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #3b82f6', outline: 'none', fontSize: '1rem', marginBottom: '4px' },
  btnEdit: { width: '100%', padding: '8px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' },
  btnSave: { flex: 1, padding: '8px', backgroundColor: '#10b981', border: 'none', borderRadius: '6px', color: 'white', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' },
  btnCancel: { flex: 1, padding: '8px', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#374151', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' },

  reportsHeader: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badge: { backgroundColor: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' },
  list: { overflowY: 'auto', flex: 1, padding: '0 15px 20px 15px' },
  card: { padding: '15px', marginBottom: '12px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }
};

export default Sidebar;