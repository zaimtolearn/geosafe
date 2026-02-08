// src/App.jsx
import { useState, useEffect } from "react";
import Map from "./components/Map";
import ReportForm from "./components/ReportForm";
import AdminDashboard from "./components/AdminDashboard";
import FilterControl from "./components/FilterControl";
import Sidebar from "./components/Sidebar";
import AlertSettings from "./components/AlertSettings";
import { getToken } from 'firebase/messaging';
import { messaging } from './firebase';
import * as geofire from 'geofire-common';
import { db, auth, googleProvider, storage } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  doc,
  getDoc,
  setDoc,
  increment,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// --- Helper to calculate distance (Haversine Formula) ---
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
    Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
// -------------------------------------------------------------

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [reports, setReports] = useState([]);

  // Alert & Settings States
  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [userAlertConfig, setUserAlertConfig] = useState(null);
  const [pickingHome, setPickingHome] = useState(false);

  // UI States
  const [showSidebar, setShowSidebar] = useState(false);
  const [flyToLocation, setFlyToLocation] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Filter State
  const [activeFilters, setActiveFilters] = useState({
    categories: { Hazard: true, Accident: true, Flood: true, Fire: true },
    statuses: { Confirmed: true, Unconfirmed: true },
  });

  // --- NEW FUNCTION: Request Permission & Save Token ---
  const requestNotificationPermission = async (uid, location) => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // 1. Get the Token (You need your VAPID Key from Firebase Console)
        const token = await getToken(messaging, {
          vapidKey: "BCKAMmMvKraEcI1BVnRYxiHRrLrzbdQvJFyneMV6Ah5oR-kTfz8bFsnulPtWlZJpaIXuzBaqL4zwiWTltBoil_k"
        });

        // 2. Generate Geohash for the User's Home
        const hash = geofire.geohashForLocation([location.lat, location.lng]);

        // 3. Save to Firestore
        await updateDoc(doc(db, 'users', uid), {
          fcmToken: token,
          alertConfig: {
            enabled: true,
            location: location,
            geohash: hash, // <--- We need this for the Cloud Function!
            radius: 5 // Default or from settings
          }
        });
        console.log("Token & Geohash saved!", token);
      }
    } catch (error) {
      console.error("Notification Error:", error);
    }
  };

  // --- 1. Listen for Reports & Trigger Alerts ---
  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReports = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(fetchedReports);

      // Check for Alerts on new/modified reports
      snapshot.docChanges().forEach((change) => {
        const report = change.doc.data();

        console.log("Change detected:", change.type, report.title, report.status);
        if (change.type === "modified" || change.type === "added") {
          // Trigger ONLY if Confirmed, Settings exist, and Location is set
          console.log("User Config:", userAlertConfig);
          if (
            report.status === "Confirmed" &&
            userAlertConfig?.enabled &&
            userAlertConfig?.location
          ) {
            const dist = getDistanceInKm(
              userAlertConfig.location.lat,
              userAlertConfig.location.lng,
              report.location.lat,
              report.location.lng
            );
            console.log(`Distance Calculated: ${dist.toFixed(2)} km. Alert Radius: ${userAlertConfig.radius} km`);

            if (dist <= userAlertConfig.radius) {
              console.log("FIRE THE ALERT!");
              if (Notification.permission === "granted") {
                new Notification(`⚠️ DANGER NEARBY!`, {
                  body: `${report.title} has been VERIFIED within ${dist.toFixed(1)}km of your location.`,
                  icon: report.imageUrl || "https://cdn-icons-png.flaticon.com/512/564/564619.png",
                });
              } else {
                console.log("Permission was not granted!")
              }
            } else {
              console.log("No Alert Needed - Incident is too far away.")
            }
          } else {
            console.log("No Alert Needed - Incident is not confirmed or settings are not enabled.")
          }
        }
      });
    });
    return () => unsubscribe();
  }, [userAlertConfig]);

  // --- 2. Auth Listener (FIXED) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check database for user role
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          // ERROR FIXED HERE: data is an object, not a function
          setUserRole(data.role || "user");

          if (data.alertConfig) {
            setUserAlertConfig(data.alertConfig);
          }
        } else {
          // Create new user if not exists
          await setDoc(userRef, {
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            role: "user",
            createdAt: new Date(),
          });
          setUserRole("user");
        }
      } else {
        setUserRole(null);
        setUserAlertConfig(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Handlers ---
  const handleSaveAlertSettings = async (newSettings) => {
    const locationToSave = newSettings.location || userAlertConfig?.location;
    const updatedConfig = {
      enabled: newSettings.enabled,
      radius: newSettings.radius,
      location: locationToSave,
    };
    setUserAlertConfig(updatedConfig);

    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { alertConfig: updatedConfig });
      alert("Alert settings saved!");
    }
    if (newSettings.enabled && newSettings.location && user) {
      await requestNotificationPermission(user.uid, newSettings.location);
    }
  };

  const startPickingHome = () => {
    setShowAlertSettings(false);
    setPickingHome(true);
    alert("Click your home location on the map.");
  };

  const handleMapClick = (location) => {
    if (pickingHome) {
      if (window.confirm("Set this as your Home Location for alerts?")) {
        handleSaveAlertSettings({
          ...userAlertConfig,
          location: location,
          enabled: true,
        });
        setPickingHome(false);
        setShowAlertSettings(true);
      }
      return;
    }

    if (selectMode) {
      setTempLocation(location);
      setSelectMode(false);
      setShowForm(true);
    }
  };

  // Filter Logic
  const filteredReports = reports.filter((report) => {
    const categoryMatch = activeFilters.categories[report.category] === true;
    const currentStatus = report.status || "Unconfirmed";
    const statusMatch = activeFilters.statuses[currentStatus] === true;
    return categoryMatch && statusMatch;
  });

  const handleFilterApply = (newFilters) => setActiveFilters(newFilters);
  const handleLogin = async () => { try { await signInWithPopup(auth, googleProvider); } catch (error) { console.error(error); } };
  const handleLogout = async () => { await signOut(auth); };
  const startReporting = () => { setSelectMode(true); alert("Click on the map to set the incident location."); };

  const handleAddReport = async (reportData) => {
    setIsUploading(true);
    try {
      let imageUrl = null;
      if (reportData.file) {
        const imageRef = ref(storage, `reports/${Date.now()}_${reportData.file.name}`);
        const snapshot = await uploadBytes(imageRef, reportData.file);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      await addDoc(collection(db, "reports"), {
        title: reportData.title,
        category: reportData.category,
        location: tempLocation,
        imageUrl: imageUrl,
        timestamp: new Date(),
        userId: user ? user.uid : "guest",
        userName: user ? user.displayName : "Anonymous",
        userPhoto: user ? user.photoURL : null,
        confirmVotes: 0,
        denyVotes: 0,
        status: "Unconfirmed",
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
    if (!user) { alert("You must be logged in to vote!"); return; }
    const voteId = `${reportId}_${user.uid}`;
    const voteRef = doc(db, "votes", voteId);
    const reportRef = doc(db, "reports", reportId);
    try {
      const voteSnap = await getDoc(voteRef);
      if (voteSnap.exists()) { alert("You have already voted on this report!"); return; }
      await setDoc(voteRef, { userId: user.uid, reportId: reportId, voteType: voteType, timestamp: new Date() });
      await updateDoc(reportRef, { [voteType === "confirm" ? "confirmVotes" : "denyVotes"]: increment(1) });
    } catch (error) { console.error("Error voting:", error); alert("Failed to vote."); }
  };

  const handleVerifyReport = async (reportId) => { await updateDoc(doc(db, "reports", reportId), { status: "Confirmed" }); alert("Report verified!"); };
  const handleDeleteReport = async (reportId) => { await deleteDoc(doc(db, "reports", reportId)); };

  const handleFlyTo = (location) => { setFlyToLocation([location.lat, location.lng]); setShowSidebar(false); };
  const myReports = user ? reports.filter((r) => r.userId === user.uid) : [];

  return (
    <div>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={{ margin: 0, fontSize: "1.2rem" }}>GeoSafe</h2>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => setShowAlertSettings(true)} style={styles.iconBtn} title="Alert Settings">🔔</button>
            <button onClick={() => setShowSidebar(true)} style={styles.outlineBtn}>My Reports</button>

            {/* ADMIN BUTTON - Only shows if userRole is correctly set to 'admin' */}
            {userRole === "admin" && (
              <button onClick={() => setShowAdmin(true)} style={styles.adminBtn}>Admin Dashboard</button>
            )}

            <img
              src={user.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png"}
              alt="User"
              style={styles.avatar}
              onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/847/847969.png" }}
            />
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        ) : (
          <button onClick={handleLogin} style={styles.loginBtn}>Sign in</button>
        )}
      </div>

      {/* Components */}
      {!selectMode && <FilterControl onFilterApply={handleFilterApply} />}

      <AlertSettings
        isOpen={showAlertSettings}
        onClose={() => setShowAlertSettings(false)}
        currentSettings={userAlertConfig}
        onSave={handleSaveAlertSettings}
        onPickLocation={startPickingHome}
      />

      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        user={user}
        userReports={myReports}
        onFlyTo={handleFlyTo}
      />

      <Map
        onMapClick={handleMapClick}
        reports={filteredReports}
        onVote={handleVote}
        userId={user ? user.uid : null}
        flyToLocation={flyToLocation}
      />

      {/* Floating Action Button */}
      {!selectMode && !showForm && (
        <button onClick={startReporting} style={styles.fab}>+ Report Incident</button>
      )}

      {/* Banners & Overlays */}
      {pickingHome && <div style={{ ...styles.banner, backgroundColor: "#17a2b8", color: "white" }}>Tap exact location of your home...</div>}
      {selectMode && <div style={styles.banner}>Tap map to select location...</div>}

      {showForm && (
        <ReportForm
          preSelectedLocation={tempLocation}
          isGuest={!user}
          onSubmit={handleAddReport}
          onCancel={() => { setShowForm(false); setSelectMode(false); }}
        />
      )}

      {isUploading && <div style={styles.loadingOverlay}>Uploading...</div>}

      {/* Admin Dashboard - Needs showAdmin to be true */}
      {showAdmin && (
        <div style={styles.adminOverlay}>
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
  header: { position: "absolute", top: 0, left: 0, right: 0, height: "60px", backgroundColor: "white", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", zIndex: 1000, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" },
  avatar: { width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" },
  loginBtn: { padding: "8px 15px", backgroundColor: "#4285F4", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" },
  logoutBtn: { padding: "5px 10px", backgroundColor: "#eee", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem" },
  adminBtn: { backgroundColor: "black", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" },
  outlineBtn: { background: "none", border: "1px solid #ddd", padding: "6px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.9rem" },
  iconBtn: { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" },
  fab: { position: "absolute", bottom: "30px", right: "30px", zIndex: 999, padding: "15px 20px", fontSize: "16px", backgroundColor: "#e63946", color: "white", border: "none", borderRadius: "50px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" },
  banner: { position: "absolute", top: "70px", left: "50%", transform: "translateX(-50%)", zIndex: 999, backgroundColor: "white", padding: "10px 20px", borderRadius: "30px", boxShadow: "0 2px 10px rgba(0,0,0,0.2)", fontWeight: "bold" },
  loadingOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, fontSize: "1.5rem", fontWeight: "bold" },
  adminOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: "white", overflowY: "auto" },
};

export default App;