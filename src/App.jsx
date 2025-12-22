// src/App.jsx
import { useState, useEffect } from 'react';
import Map from './components/Map';
import ReportForm from './components/ReportForm';
import AdminDashboard from './components/AdminDashboard';
import { db, auth, googleProvider, storage } from './firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import VoteControls from './components/VoteControls';
import { collection, addDoc, onSnapshot, orderBy, query, doc, getDoc, setDoc, increment, updateDoc, deleteDoc } from 'firebase/firestore';

function App() {
  const ADMIN_EMAIL = "zaimrosli2003@gmail.com";
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  
  const [showAdmin, setShowAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [isUploading, setIsUploading] = useState(false); // Loading state

  // Listen for Reports (Ordered by newest first)
  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); } catch (error) { console.error(error); }
  };

  const handleLogout = async () => { await signOut(auth); };

  const startReporting = () => {
    setSelectMode(true);
    alert("Click on the map to set the incident location.");
  };

  const handleMapClick = (location) => {
    if (selectMode) {
      setTempLocation(location);
      setSelectMode(false); 
      setShowForm(true);    
    }
  };

  // --- THE SUBMIT LOGIC ---
  const handleAddReport = async (reportData) => {
    setIsUploading(true); 

    try {
      let imageUrl = null;
      if (reportData.file) {
        const imageRef = ref(storage, `reports/${Date.now()}_${reportData.file.name}`);
        const snapshot = await uploadBytes(imageRef, reportData.file);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // ADDED: confirmVotes and denyVotes initialized to 0
      await addDoc(collection(db, 'reports'), {
        title: reportData.title,
        category: reportData.category,
        location: tempLocation,
        imageUrl: imageUrl, 
        timestamp: new Date(),
        userId: user ? user.uid : 'guest',
        userName: user ? user.displayName : 'Anonymous',
        userPhoto: user ? user.photoURL : null,
        confirmVotes: 0, // <--- NEW
        denyVotes: 0     // <--- NEW
      });

      alert("Report submitted successfully!");
      setShowForm(false);
      setTempLocation(null);
    } catch (error) {
      console.error("Error adding report: ", error);
      alert("Error saving report.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVote = async (reportId, voteType) => {
    if (!user) {
      alert("You must be logged in to vote!");
      return;
    }

    // 1. Reference to the specific vote record (unique per user per report)
    // Path: votes/{reportId_userId}
    const voteId = `${reportId}_${user.uid}`;
    const voteRef = doc(db, 'votes', voteId);
    const reportRef = doc(db, 'reports', reportId);

    try {
      // 2. Check if this user already voted
      const voteSnap = await getDoc(voteRef);

      if (voteSnap.exists()) {
        alert("You have already voted on this report!");
        return;
      }

      // 3. If not, record the vote
      await setDoc(voteRef, {
        userId: user.uid,
        reportId: reportId,
        voteType: voteType,
        timestamp: new Date()
      });

      // 4. Update the report counters atomically
      await updateDoc(reportRef, {
        // Dynamic key: either 'confirmVotes' or 'denyVotes'
        [voteType === 'confirm' ? 'confirmVotes' : 'denyVotes']: increment(1)
      });

      console.log("Vote recorded!");
    } catch (error) {
      console.error("Error voting:", error);
      alert("Failed to vote.");
    }
  };

  // --- ADMIN ACTIONS ---
  const handleVerifyReport = async (reportId) => {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status: 'Confirmed'
    });
    alert("Report verified!");
  };

  const handleDeleteReport = async (reportId) => {
    const reportRef = doc(db, 'reports', reportId);
    await deleteDoc(reportRef);
    // Optional: We should also delete the votes, but for MVP we can skip cleaning up sub-collections
  };

  return (
    <div>
       {/* Header */}
       <div style={styles.header}>
         <h2 style={{margin: 0, fontSize: '1.2rem'}}>GeoSafe</h2>
         {user ? (
           <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
             {/* Show Admin Button ONLY if email matches admin */}
             {user.email === ADMIN_EMAIL && (
                <button 
                  onClick={() => setShowAdmin(true)}
                  style={{backgroundColor: 'black', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer'}}
                >
                  Admin Dashboard
                </button>
              )}

             {/* Profile Pic Fix: Use a standard placeholder if photoURL fails */}
             <img 
               src={user.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png"} 
               alt="User" 
               style={styles.avatar}
               onError={(e) => {e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png"}}
             />
             <span style={{fontSize: '0.9rem', fontWeight: 'bold'}}>{user.displayName}</span>
             <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
           </div>
         ) : (
           <button onClick={handleLogin} style={styles.loginBtn}>Sign in</button>
         )}
       </div>

       <Map 
          onMapClick={handleMapClick} 
          reports={reports} 
          onVote={handleVote}  // <--- Pass the function down
          userId={user ? user.uid : null} // <--- Pass the user ID down
        />

       {/* Floating Button: Visible to EVERYONE (Guest or User) */}
       {!selectMode && !showForm && (
         <button onClick={startReporting} style={styles.fab}>
           + Report Incident
         </button>
       )}

       {selectMode && (
         <div style={styles.banner}>Tap map to select location...</div>
       )}

       {showForm && (
         <ReportForm 
           preSelectedLocation={tempLocation}
           isGuest={!user}
           onSubmit={handleAddReport} 
           onCancel={() => { setShowForm(false); setSelectMode(false); }} 
         />
       )}

       {/* Loading Overlay */}
       {isUploading && (
         <div style={styles.loadingOverlay}>Uploading...</div>
       )}

       {/* Admin Dashboard Overlay */}
        {showAdmin && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: 'white', overflowY: 'auto'}}>
            <AdminDashboard 
              reports={reports}
              onVerify={handleVerifyReport}
              onDelete={handleDeleteReport}
              onClose={() => setShowAdmin(false)}
            />
          </div>
        )}
    </div>
  );
}

const styles = {
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, height: '60px',
    backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', padding: '0 20px', zIndex: 1000, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  avatar: { width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' },
  loginBtn: { padding: '8px 15px', backgroundColor: '#4285F4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  logoutBtn: { padding: '5px 10px', backgroundColor: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  fab: {
    position: 'absolute', bottom: '30px', right: '30px', zIndex: 999, padding: '15px 20px',
    fontSize: '16px', backgroundColor: '#e63946', color: 'white', border: 'none',
    borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  },
  banner: {
    position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
    zIndex: 999, backgroundColor: 'white', padding: '10px 20px', 
    borderRadius: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', fontWeight: 'bold'
  },
  loadingOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, fontSize: '1.5rem', fontWeight: 'bold'
  }
};

export default App;