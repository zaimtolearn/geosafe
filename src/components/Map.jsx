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

function Map({ onMapClick, reports = [], onVote, userId, flyToLocation, userAlertConfig }) {
  const usmPosition = [5.3556, 100.3025];

  const [showHeatmap, setShowHeatmap] = useState(false);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <button
        onClick={() => setShowHeatmap(!showHeatmap)}
        style={{
          position: 'absolute',
          top: '140px', // Placed below your new Filter button
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
            {reports.map((report) => (
              <Marker
                key={report.id}
                position={[report.location.lat, report.location.lng]}
                icon={report.status === "Confirmed" ? greenIcon : blueIcon}
              >
                <Popup>
                  <div style={{ minWidth: "200px" }}>
                    {/* STATUS BADGE */}
                    <div
                      style={{
                        marginBottom: "5px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        display: "inline-block",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        backgroundColor:
                          report.status === "Confirmed" ? "#d4edda" : "#f8d7da",
                        color: report.status === "Confirmed" ? "#155724" : "#721c24",
                      }}
                    >
                      {report.status === "Confirmed"
                        ? "✅ VERIFIED"
                        : "⚠️ UNCONFIRMED"}
                    </div>

                    <h3 style={{ margin: "5px 0", fontSize: "1rem" }}>
                      {report.title}
                    </h3>
                    <span style={{ color: "#666", fontSize: "0.85rem" }}>
                      {report.category}
                    </span>

                    <div style={{ fontSize: "0.8rem", color: "#333", marginBottom: "8px", display: "flex", alignItems: "flex-start", gap: "4px", backgroundColor: "#f8f9fa", padding: "6px", borderRadius: "4px", border: "1px solid #eee" }}>
                      <span>📍</span>
                      <span>
                        {report.address
                          ? report.address
                          : `${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`}
                      </span>
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
                  </div>
                </Popup>
              </Marker>
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
