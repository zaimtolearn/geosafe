// src/App.jsx
import { useState, useEffect, useRef } from "react";
import "./App.css";
import Map from "./components/Map";
import ReportForm from "./components/ReportForm";
import AdminDashboard from "./components/AdminDashboard";
import FilterControl from "./components/FilterControl";
import Sidebar from "./components/Sidebar";
import AlertSettings from "./components/AlertSettings";
import PublicStatsWidget from "./components/PublicStatsWidget";
import { getToken } from 'firebase/messaging';
import { messaging } from './firebase';
import * as geofire from 'geofire-common';
import { db, auth, googleProvider, storage } from "./firebase";
// BUGFIX: Switched back to signInWithPopup and added updateProfile
import { signInWithPopup, signOut, onAuthStateChanged, updateProfile } from "firebase/auth";
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

// --- Calculate distance (Haversine Formula) ---
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

const COMPACT_HEADER_QUERY = "(max-width: 640px)";

function useCompactHeaderNav() {
  const [compact, setCompact] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(COMPACT_HEADER_QUERY).matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia(COMPACT_HEADER_QUERY);
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return compact;
}

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [reports, setReports] = useState([]);

  const [showAlertSettings, setShowAlertSettings] = useState(false);
  const [userAlertConfig, setUserAlertConfig] = useState(null);
  const [pickingHome, setPickingHome] = useState(false);

  const [showSidebar, setShowSidebar] = useState(false);
  const [flyToLocation, setFlyToLocation] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    categories: {
      "Infrastructure": true, "Natural Hazard": true, "Traffic": true,
      "Security": true, "Environment": true, "Other": true
    },
    statuses: { Confirmed: true, Unconfirmed: true },
    timeRange: "7d"
  });

  const requestNotificationPermission = async (uid, location) => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: "BCKAMmMvKraEcI1BVnRYxiHRrLrzbdQvJFyneMV6Ah5oR-kTfz8bFsnulPtWlZJpaIXuzBaqL4zwiWTltBoil_k"
        });
        const hash = geofire.geohashForLocation([location.lat, location.lng]);
        await updateDoc(doc(db, 'users', uid), {
          fcmToken: token,
          alertConfig: { enabled: true, location: location, geohash: hash, radius: 5 }
        });
      }
    } catch (error) { console.error("Notification Error:", error); }
  };

  // BUGFIX: Use a ref so it doesn't reset when userAlertConfig changes
  const isFirstSnapshot = useRef(true);

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedReports = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(fetchedReports);

        const notify = !isFirstSnapshot.current;
        isFirstSnapshot.current = false;

        snapshot.docChanges().forEach((change) => {
          if (!notify) return;
          const report = change.doc.data();
          if (change.type === "modified" || change.type === "added") {
            if (report.status === "Confirmed" && userAlertConfig) {
              if (!report.location?.lat || !report.location?.lng) return;

              const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
              const now = new Date();
              const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

              if ((now - rDate) <= SEVEN_DAYS_MS) {
                const radiusKm = userAlertConfig.radius ?? 5;
                let triggerAlert = false;

                // Check 1: Home Base Alert
                if (userAlertConfig.enabled && userAlertConfig.location) {
                  const distToHome = getDistanceInKm(
                    userAlertConfig.location.lat, userAlertConfig.location.lng,
                    report.location.lat, report.location.lng
                  );
                  if (distToHome <= radiusKm) triggerAlert = true;
                }

                // Check 2: LIVE Location Alert
                if (!triggerAlert && userAlertConfig.liveEnabled && navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    const distToLive = getDistanceInKm(
                      pos.coords.latitude, pos.coords.longitude,
                      report.location.lat, report.location.lng
                    );
                    // Live alerts use a stricter 3km radius to avoid spam while driving
                    if (distToLive <= 3) {
                      if (Notification.permission === "granted") {
                        new Notification(`⚠️ LIVE DANGER NEARBY!`, {
                          body: `${report.title} verified within 3km of your current location.`,
                          icon: report.imageUrl || "/icon-192.png",
                        });
                      }
                    }
                  });
                }

                // Fire the Home Alert if triggered
                if (triggerAlert && Notification.permission === "granted") {
                  new Notification(`⚠️ DANGER NEARBY HOME!`, {
                    body: `${report.title} verified within ${radiusKm}km of your Home Base.`,
                    icon: report.imageUrl || "/icon-192.png",
                  });
                }
              }
            }
          }
        });
      },
      (err) => console.error("Reports listener failed:", err)
    );
    return () => unsubscribe();
  }, [userAlertConfig]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserRole(data.role || "user");
          if (data.alertConfig) setUserAlertConfig(data.alertConfig);
        } else {
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

  const handleSaveAlertSettings = async (newSettings) => {
    const locationToSave = newSettings.location || userAlertConfig?.location;
    const updatedConfig = {
      enabled: newSettings.enabled,
      radius: newSettings.radius,
      liveEnabled: newSettings.liveEnabled, // SAVE LIVE PREFERENCE
      location: locationToSave,
    };
    setUserAlertConfig(updatedConfig);

    if (user) {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { alertConfig: updatedConfig });
      alert("Alert settings saved!");
      if ((newSettings.enabled || newSettings.liveEnabled) && locationToSave) {
        await requestNotificationPermission(user.uid, locationToSave);
      }
    }
  };

  const startPickingHome = () => {
    setShowAlertSettings(false);
    setPickingHome(true);
    alert("Click your home location on the map.");
  };

  const processNewReportLocation = (location) => {
    const DUPLICATE_THRESHOLD_KM = 0.05;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const recentReports = reports.filter(report => {
      if (!report.timestamp) return false;
      const reportDate = report.timestamp.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
      return (now - reportDate) <= SEVEN_DAYS_MS;
    });

    const nearbyReport = recentReports.find(report => {
      const dist = getDistanceInKm(location.lat, location.lng, report.location.lat, report.location.lng);
      return dist <= DUPLICATE_THRESHOLD_KM;
    });

    if (nearbyReport) {
      const proceed = window.confirm(`⚠️ DUPLICATE WARNING ⚠️\n\nThere is already a "${nearbyReport.category}" reported recently (within 50m) at this spot: ${nearbyReport.title}.\n\nClick 'Cancel' to view and upvote the existing report, or click 'OK' if you are sure this is a completely different incident.`);
      if (!proceed) {
        setSelectMode(false);
        handleFlyTo(nearbyReport.location);
        return;
      }
    }
    setTempLocation(location);
    setSelectMode(false);
    setShowForm(true);
  };

  const handleMapClick = (location) => {
    if (pickingHome) {
      if (window.confirm("Set this as your Home Location for alerts?")) {
        handleSaveAlertSettings({ ...userAlertConfig, location: location, enabled: true });
        setPickingHome(false);
        setShowAlertSettings(true);
      }
      return;
    }
    if (selectMode) processNewReportLocation(location);
  };

  const filteredReports = reports.filter((report) => {
    const categoryMatch = activeFilters.categories[report.category] === true;
    const currentStatus = report.status || "Unconfirmed";
    const statusMatch = activeFilters.statuses[currentStatus] === true;
    let timeMatch = true;
    if (activeFilters.timeRange !== 'all' && report.timestamp) {
      const reportDate = report.timestamp.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
      const now = new Date();
      const hoursDiff = (now - reportDate) / (1000 * 60 * 60);
      if (activeFilters.timeRange === '24h') timeMatch = hoursDiff <= 24;
      else if (activeFilters.timeRange === '7d') timeMatch = hoursDiff <= (24 * 7);
    }
    return categoryMatch && statusMatch && timeMatch;
  });

  const handleFilterApply = (newFilters) => setActiveFilters(newFilters);

  // BUGFIX: Switched back to signInWithPopup for reliability
  const handleLogin = async () => {
    try { await signInWithPopup(auth, googleProvider); }
    catch (error) { console.error(error); alert("Sign in failed. Check connection or popup blockers."); }
  };
  const handleLogout = async () => { await signOut(auth); };

  const startReporting = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          if (window.confirm("📍 Location detected! Use your current location for this report?\n\nClick 'OK' to use it, or 'Cancel' to pick manually on the map.")) {
            processNewReportLocation(loc);
          } else {
            setSelectMode(true);
            alert("Tap map to select location...");
          }
        },
        (error) => { setSelectMode(true); alert("Could not detect location. Please tap map to select location..."); },
        { enableHighAccuracy: true }
      );
    } else {
      setSelectMode(true);
      alert("Tap map to select location...");
    }
  };

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
        title: reportData.title, category: reportData.category, address: reportData.address || "",
        location: tempLocation, imageUrl: imageUrl, timestamp: new Date(),
        userId: user ? user.uid : "guest", userName: user ? user.displayName : "Anonymous",
        userPhoto: user ? user.photoURL : null, confirmVotes: 0, denyVotes: 0, status: "Unconfirmed",
      });
      alert("Report submitted successfully!");
      setShowForm(false);
      setTempLocation(null);
    } catch (error) {
      console.error("Error adding report: ", error);
      alert("Error saving report.");
    } finally { setIsUploading(false); }
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

  const handleEditReport = async (reportId, updatedData) => {
    try {
      const reportRef = doc(db, "reports", reportId);
      await updateDoc(reportRef, updatedData);
      alert("Report updated successfully!");
    } catch (error) { console.error("Error updating report:", error); alert("Failed to update report."); }
  };

  // --- NEW: PROFILE UPDATER ---
  const handleUpdateProfile = async (newName) => {
    if (!user) return;
    try {
      await updateProfile(user, { displayName: newName });
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { displayName: newName });
      setUser({ ...user, displayName: newName });
      alert("Profile updated successfully!");
    } catch (error) { console.error("Error updating profile:", error); alert("Failed to update profile."); }
  };

  const handleFlyTo = (location) => { setFlyToLocation([location.lat, location.lng]); setShowSidebar(false); };
  const myReports = user ? reports.filter((r) => r.userId === user.uid) : [];
  const compactHeaderNav = useCompactHeaderNav();

  return (
    <div>
      <header className="app-header">
        <div className="app-header-brand">
          <img className="app-header-logo" src="/icon-192.png" alt="" />
          <h1 className="app-header-title">GeoSafe</h1>
        </div>

        {user ? (
          <div className="app-header-actions">
            {compactHeaderNav ? (
              <select
                className="app-nav-select"
                aria-label="Quick actions: alerts, reports, or admin"
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  e.target.value = "";
                  if (v === "alert") setShowAlertSettings(true);
                  else if (v === "reports") setShowSidebar(true);
                  else if (v === "admin") setShowAdmin(true);
                }}
              >
                <option value="">Quick actions</option>
                <option value="alert">Alerts</option>
                <option value="reports">My reports</option>
                {userRole === "admin" && <option value="admin">Admin</option>}
              </select>
            ) : (
              <>
                <button type="button" className="app-header-btn app-header-btn--alert" onClick={() => setShowAlertSettings(true)} title="Alert settings">
                  Alerts
                </button>
                <button type="button" className="app-header-btn app-header-btn--outline" onClick={() => setShowSidebar(true)}>
                  My reports
                </button>
                {userRole === "admin" && (
                  <button type="button" className="app-header-btn app-header-btn--admin" onClick={() => setShowAdmin(true)}>
                    Admin
                  </button>
                )}
              </>
            )}

            <img className="app-header-avatar" src={user.photoURL || "/icon-192.png"} alt="" onError={(e) => { e.target.src = "/icon-192.png" }} />
            <button type="button" className="app-header-btn app-header-btn--ghost" onClick={handleLogout}>Log out</button>
          </div>
        ) : (
          <button type="button" className="app-header-btn app-header-btn--primary" onClick={handleLogin}>Sign in</button>
        )}
      </header>

      {!selectMode && <FilterControl onFilterApply={handleFilterApply} />}
      {!selectMode && <PublicStatsWidget reports={reports} />}

      <AlertSettings isOpen={showAlertSettings} onClose={() => setShowAlertSettings(false)} currentSettings={userAlertConfig} onSave={handleSaveAlertSettings} onPickLocation={startPickingHome} />

      {/* BUGFIX: Pass onUpdateProfile down to the sidebar! */}
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} user={user} userReports={myReports} onFlyTo={handleFlyTo} onUpdateProfile={handleUpdateProfile} />

      <Map onMapClick={handleMapClick} reports={filteredReports} onVote={handleVote} userId={user ? user.uid : null} flyToLocation={flyToLocation} userAlertConfig={userAlertConfig} />

      {!selectMode && !showForm && (
        <button onClick={startReporting} style={styles.fab}>+ Report Incident</button>
      )}

      {pickingHome && <div style={{ ...styles.banner, backgroundColor: "#17a2b8", color: "white" }}>Tap exact location of your home...</div>}
      {selectMode && <div style={styles.banner}>Tap map to select location...</div>}

      {showForm && (
        <ReportForm preSelectedLocation={tempLocation} isGuest={!user} onSubmit={handleAddReport} onCancel={() => { setShowForm(false); setSelectMode(false); }} />
      )}

      {isUploading && <div style={styles.loadingOverlay}>Uploading...</div>}

      {showAdmin && (
        <div style={styles.adminOverlay}>
          <AdminDashboard reports={reports} onVerify={handleVerifyReport} onDelete={handleDeleteReport} onEdit={handleEditReport} onClose={() => setShowAdmin(false)} />
        </div>
      )}
    </div>
  );
}

const styles = {
  fab: { position: "absolute", bottom: "30px", right: "30px", zIndex: 999, padding: "15px 20px", fontSize: "16px", backgroundColor: "#e63946", color: "white", border: "none", borderRadius: "50px", cursor: "pointer", fontWeight: "bold", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" },
  banner: { position: "absolute", top: "70px", left: "50%", transform: "translateX(-50%)", zIndex: 999, backgroundColor: "white", padding: "10px 20px", borderRadius: "30px", boxShadow: "0 2px 10px rgba(0,0,0,0.2)", fontWeight: "bold" },
  loadingOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(255,255,255,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000, fontSize: "1.5rem", fontWeight: "bold" },
  adminOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, background: "#f8fafc", overflowX: "hidden", overflowY: "auto", WebkitOverflowScrolling: "touch" },
};

export default App;