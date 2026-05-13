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

const homeIcon = new L.divIcon({
  html: '<div style="font-size: 28px; text-shadow: 0px 2px 5px rgba(0,0,0,0.5);">🏠</div>',
  className: 'custom-home-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15]
});

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

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <button
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
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Controller to handle movement */}
        <MapController center={flyToLocation} />

        {/* Click Listener Helper */}
        {onMapClick && <LocationPicker onLocationSelect={onMapClick} />}

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
          <HeatmapLayer points={reports} />
        ) : (
          <>
            {reports.map((report) => {
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
