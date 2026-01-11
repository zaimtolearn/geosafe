// src/components/Sidebar.jsx
import { useState } from 'react';

function Sidebar({ isOpen, onClose, user, userReports, onFlyTo }) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.sidebar}>
        <div style={styles.header}>
          <h2>My Reports</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        {!user ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <p>Please log in to track your incident reports.</p>
          </div>
        ) : (
          <div style={styles.list}>
            {userReports.length === 0 ? (
              <p style={{ padding: '20px', color: '#888' }}>You haven't reported anything yet.</p>
            ) : (
              userReports.map(report => (
                <div 
                  key={report.id} 
                  style={styles.card}
                  onClick={() => onFlyTo(report.location)}
                >
                  <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <strong>{report.title}</strong>
                    <span style={{
                      fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                      backgroundColor: report.status === 'Confirmed' ? '#d4edda' : '#eee',
                      color: report.status === 'Confirmed' ? '#155724' : '#555'
                    }}>
                      {report.status || 'Pending'}
                    </span>
                  </div>
                  <p style={{margin: '5px 0', fontSize: '0.85rem', color: '#666'}}>
                    {report.category} • {new Date(report.timestamp.seconds * 1000).toLocaleDateString()}
                  </p>
                  <small style={{color: '#888'}}>Votes: 👍{report.confirmVotes || 0} 👎{report.denyVotes || 0}</small>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 1500, // Below Admin (2000) but above Map
  },
  sidebar: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: '300px',
    backgroundColor: 'white', boxShadow: '2px 0 10px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column'
  },
  header: {
    padding: '15px', borderBottom: '1px solid #eee',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  closeBtn: {
    background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'
  },
  list: {
    overflowY: 'auto', flex: 1, padding: '10px'
  },
  card: {
    padding: '10px', marginBottom: '10px', border: '1px solid #eee',
    borderRadius: '6px', cursor: 'pointer', transition: 'background 0.2s',
  }
};

export default Sidebar;