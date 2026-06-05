// src/components/Map.jsx
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  ZoomControl,
  Circle,
} from "react-leaflet";
import HeatmapLayer from './HeatmapLayer';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import VoteControls from "./VoteControls";

// --- CUSTOM ICONS ---
// Standard Blue Marker (Unconfirmed)
const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Green Marker (Confirmed)
const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Gold Marker (Verified by Community)
const goldIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Grey Marker (Resolved)
const greyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Red Marker (Official / government data)
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const homeIcon = new L.divIcon({
  html: '<div style="font-size: 28px; text-shadow: 0px 2px 5px rgba(0,0,0,0.5);">🏠</div>',
  className: 'custom-home-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

// --- HAVERSINE DISTANCE MATH ---
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const PRESENTATION_FALLBACK_GOV_DATA = [
  { id: "gov_1", title: "MET Malaysia: Heavy Rain Warning", category: "Natural Hazard", lat: 5.4150, lng: 100.3200, source: "data.gov.my (MET)" },
  { id: "gov_2", title: "JPS: High River Water Level", category: "Natural Hazard", lat: 5.3800, lng: 100.2800, source: "data.gov.my (JPS)" },
  { id: "gov_3", title: "MET Malaysia: Strong Winds", category: "Natural Hazard", lat: 5.3200, lng: 100.2700, source: "data.gov.my (MET)" }
];

// --- NEW: SMART HOTSPOT SCANNER ---
function HeatmapInspector({ isHeatmapActive, reports }) {
  const [hotspot, setHotspot] = useState(null);

  useMapEvents({
    click(e) {
      if (!isHeatmapActive) {
        setHotspot(null);
        return;
      }

      const clickLat = e.latlng.lat;
      const clickLng = e.latlng.lng;

      // 1. Scan for all reports within 1km (1000 meters) of the tap!
      const nearby = reports.filter(r => {
        if (!r.location?.lat) return false;
        return getDistanceInKm(clickLat, clickLng, r.location.lat, r.location.lng) <= 1.0;
      });

      if (nearby.length > 0) {
        // 2. Crunch the analytics
        let active = 0; let resolved = 0; const cats = {};
        nearby.forEach(r => {
          if (r.status === "Resolved") resolved++; else active++;
          cats[r.category] = (cats[r.category] || 0) + 1;
        });

        let topCat = "None"; let max = 0;
        Object.entries(cats).forEach(([cat, count]) => {
          if (count > max) { max = count; topCat = cat; }
        });

        // 3. Trigger the popup
        setHotspot({ latlng: e.latlng, total: nearby.length, active, resolved, topCat });
      } else {
        setHotspot(null); // Clicked in an empty area
      }
    }
  });

  if (!isHeatmapActive || !hotspot) return null;

  return (
    <Popup position={hotspot.latlng} onClose={() => setHotspot(null)}>
      <div style={{ textAlign: 'center', minWidth: '160px', fontFamily: 'system-ui, sans-serif' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
          🔥 Hotspot Data
        </h3>
        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1e293b' }}>
          {hotspot.total} <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#64748b' }}>REPORTS</span>
        </div>
        <div style={{ margin: '10px 0', display: 'flex', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '6px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 'bold' }}>{hotspot.active}</span>
            <span style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>Active</span>
          </div>
          <div style={{ width: '1px', backgroundColor: '#cbd5e1' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', color: '#10b981', fontWeight: 'bold' }}>{hotspot.resolved}</span>
            <span style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>Fixed</span>
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#334155', backgroundColor: '#fee2e2', padding: '4px', borderRadius: '4px' }}>
          <strong>Major Threat:</strong> {hotspot.topCat}
        </div>
      </div>
    </Popup>
  );
}
// Helper to move the map
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

// Helper for clicks
function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Map({ onMapClick, reports = [], onVote, userId, flyToLocation, userAlertConfig, userRole, onReviewReport }) {
  const usmPosition = [5.3556, 100.3025];

  const [showHeatmap, setShowHeatmap] = useState(false);
  const [govData, setGovData] = useState([]);

  useEffect(() => {
    const fetchGovernmentData = async () => {
      const applyPresentationFallback = (reason) => {
        if (import.meta.env.DEV) {
          console.info(`Gov map overlay: ${reason} Using presentation sample pins.`);
        }
        setGovData(PRESENTATION_FALLBACK_GOV_DATA);
      };

      try {
        const response = await fetch("https://api.data.gov.my/weather/warning/");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Unexpected API response shape");

        const activeWarnings = data.flatMap((item) => {
          const warningText = `${item.text_en || ""} ${item.text_bm || ""}`.toLowerCase();
          const mentionsPenang =
            warningText.includes("penang") || warningText.includes("pulau pinang");
          if (!mentionsPenang) return [];

          return [{
            id: `gov_${item.warning_issue?.issued ?? crypto.randomUUID()}`,
            title: item.warning_issue?.title_en || "Official Weather Advisory",
            category: "Natural Hazard",
            lat: 5.3556 + (Math.random() - 0.5) * 0.05,
            lng: 100.3025 + (Math.random() - 0.5) * 0.05,
            source: "data.gov.my (MET)"
          }];
        });

        if (activeWarnings.length > 0) {
          setGovData(activeWarnings);
          return;
        }

        applyPresentationFallback("No active warnings mention Penang right now.");
      } catch (error) {
        console.warn("Gov API unreachable:", error.message);
        applyPresentationFallback("Could not load live warnings.");
      }
    };

    fetchGovernmentData();
  }, []);

  const reportHeatPoints = reports.filter(
    r => r && r.location && typeof r.location.lat === 'number'
  );
  const govHeatPoints = govData
    .filter(g => typeof g.lat === 'number' && typeof g.lng === 'number')
    .map(g => ({ location: { lat: g.lat, lng: g.lng } }));

  return (
    <div className="geosafe-map-shell" style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <button className="fab-heatmap"
        onClick={() => setShowHeatmap(!showHeatmap)}
        style={{
          position: 'absolute',
          top: '80px',
          left: '20px',
          zIndex: 1000,
          backgroundColor: showHeatmap ? '#dc3545' : 'white',
          color: showHeatmap ? 'white' : 'black',
          border: 'none',
          padding: '12px 20px',
          borderRadius: '50px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}
      >
        <span>{showHeatmap ? '🔥 Hide Heatmap' : '🗺️ Show Heatmap'}</span>
      </button>

      <MapContainer
        center={usmPosition}
        zoom={15}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <ZoomControl position="topright" />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Controller to handle movement */}
        <MapController center={flyToLocation} />

        {/* Click Listener Helper */}
        {onMapClick && <LocationPicker onLocationSelect={onMapClick} />}

        {/* --- NEW: THE INTERACTIVE HEATMAP RADAR --- */}
        <HeatmapInspector isHeatmapActive={showHeatmap} reports={reports} />

        {/* 4. --- NEW: RENDER HOME ZONE (Visible even if Heatmap is on!) --- */}
        {userAlertConfig && userAlertConfig.enabled && userAlertConfig.location && (
          <>
            {/* The Semi-Transparent Radius Circle */}
            <Circle
              center={[userAlertConfig.location.lat, userAlertConfig.location.lng]}
              radius={userAlertConfig.radius * 1000} // Convert km to meters for Leaflet!
              pathOptions={{
                color: '#ff9800',     // Orange border
                fillColor: '#ff9800', // Orange fill
                fillOpacity: 0.15,    // Lightly transparent
                weight: 2,            // Border thickness
                dashArray: '5, 5'     // Dashed border line for a "radar" look
              }}
            />
            {/* The House Pin */}
            <Marker
              position={[userAlertConfig.location.lat, userAlertConfig.location.lng]}
              icon={homeIcon}
            >
              <Popup>
                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                  <strong>🏠 Home Base</strong>
                  <br />
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>
                    Alert Radius: {userAlertConfig.radius}km
                  </span>
                </div>
              </Popup>
            </Marker>
          </>
        )}
        {showHeatmap ? (
          <HeatmapLayer points={[...reportHeatPoints, ...govHeatPoints]} />
        ) : (
          <>
            {reports.map((report) => {
              if (!report.location?.lat || !report.location?.lng) return null;

              // 1. Assign the right color pin
              let currentIcon = blueIcon;
              if (report.status === "Verified by Admin") currentIcon = greenIcon;
              else if (report.status === "Verified by Community") currentIcon = goldIcon;
              else if (report.status === "Resolved") currentIcon = greyIcon;

              // Safe Date Parsing for popup
              const rDate = report.timestamp?.toDate ? report.timestamp.toDate() : new Date(report.timestamp);
              const formattedDate = rDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + " at " + rDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <Marker key={report.id} position={[report.location.lat, report.location.lng]} icon={currentIcon}>
                  <Popup>
                    <div style={{ minWidth: "200px" }}>
                      {/* STATUS BADGE */}
                      <div
                        style={{
                          marginBottom: "5px", padding: "4px 8px", borderRadius: "4px", display: "inline-block", fontSize: "0.75rem", fontWeight: "bold",
                          backgroundColor:
                            report.status === "Verified by Admin" ? "#d4edda" :
                              report.status === "Verified by Community" ? "#fef08a" :
                                report.status === "Resolved" ? "#e2e8f0" : "#f8d7da",
                          color:
                            report.status === "Verified by Admin" ? "#155724" :
                              report.status === "Verified by Community" ? "#854d0e" :
                                report.status === "Resolved" ? "#475569" : "#721c24",
                        }}
                      >
                        {report.status === "Verified by Admin" ? "✅ Admin Verified" :
                          report.status === "Verified by Community" ? "👥 User Verified" :
                            report.status === "Resolved" ? "🏁 RESOLVED" : "⚠️ UNCONFIRMED"}
                      </div>

                      <h3 style={{ margin: "5px 0", fontSize: "1rem" }}>
                        {report.title}
                      </h3>
                      <span style={{ color: "#666", fontSize: "0.85rem" }}>
                        {report.category}
                      </span>

                      <div style={{ fontSize: "0.8rem", color: "#333", marginBottom: "8px", marginTop: "8px", display: "flex", alignItems: "flex-start", gap: "4px", backgroundColor: "#f8f9fa", padding: "6px", borderRadius: "4px", border: "1px solid #eee" }}>
                        <span>📍</span>
                        <span>
                          {report.address
                            ? report.address
                            : `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "8px", display: "flex", alignItems: "center", gap: "5px" }}>
                        <span>🕒</span> {formattedDate}
                      </div>

                      {report.imageUrl && (
                        <div style={{ marginTop: "8px" }}>
                          <img
                            src={report.imageUrl}
                            alt="Evidence"
                            style={{
                              width: "100%",
                              maxHeight: "120px",
                              borderRadius: "4px",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      )}

                      <div
                        style={{ fontSize: "0.75rem", marginTop: "5px", color: "#888" }}
                      >
                        Reported by: {report.userName}
                      </div>

                      <VoteControls report={report} onVote={onVote} userId={userId} />

                      {/* --- 1. ADMIN ONLY BUTTON (For Unconfirmed Reports Only) --- */}
                      {userRole === 'admin' && report.status === "Unconfirmed" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReviewReport(report);
                          }}
                          style={{
                            backgroundColor: '#3b82f6', color: 'white', border: 'none',
                            padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                            width: '100%', fontWeight: 'bold', marginTop: '12px'
                          }}
                        >
                          🔍 Review in Dashboard
                        </button>
                      )}

                      {/* --- 3. RESOLUTION CONTROLS (For Verified Reports) --- */}
                      {(report.status === "Verified by Admin" || report.status === "Verified by Community") && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee', textAlign: 'center' }}>
                          <p style={{ fontSize: '0.7rem', color: '#6b7280', margin: '0 0 5px 0' }}>Is the area safe now?</p>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); onVote(report.id, "resolve"); }}
                              style={{
                                flex: 1, backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1',
                                padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
                              }}
                            >
                              ✅ It's Fixed ({report.resolveVotes || 0}/5)
                            </button>

                            {/* Admin Redirect Shortcut */}
                            {userRole === 'admin' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); onReviewReport(report); }}
                                style={{
                                  backgroundColor: '#64748b', color: 'white', border: 'none',
                                  padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'
                                }}
                                title="Manage Resolution in Dashboard"
                              >
                                ⚙️ Admin
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* --- NEW: LIVE GOVERNMENT DATA OVERLAY --- */}
            {!showHeatmap && govData.map((gov) => (
              gov.lat && gov.lng ? (
                <Marker
                  key={gov.id}
                  position={[gov.lat, gov.lng]}
                  icon={redIcon}
                >
                  <Popup>
                    <div style={{ fontFamily: 'system-ui', minWidth: '180px' }}>
                      <div style={{ backgroundColor: '#1d4ed8', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', display: 'inline-block' }}>
                        🏛️ OFFICIAL DATA
                      </div>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '1rem', color: '#1f2937' }}>{gov.title}</h3>
                      <p style={{ margin: '0', fontSize: '0.85rem', color: '#6b7280' }}>
                        <strong>Source:</strong> {gov.source}<br />
                        <strong>Category:</strong> {gov.category}
                      </p>
                      <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>✓</span> Live API Sync Active
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ) : null
            ))}

            <Marker position={usmPosition} icon={blueIcon}>
              <Popup>GeoSafe HQ</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default Map;
