// src/components/Map.jsx
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix icons
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Handles Map Clicks ---
function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      // plain object so Firestore doesn't throw error
      const cleanLocation = { 
        lat: e.latlng.lat, 
        lng: e.latlng.lng 
      };
      onLocationSelect(cleanLocation);
    },
  });
  return null;
}
// -----------------------------------------

function Map({ onMapClick, reports = [] }) {
  const usmPosition = [5.3556, 100.3025]; 

  return (
    <MapContainer 
      center={usmPosition} 
      zoom={15} 
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Enable Click Detection */}
      {onMapClick && <LocationPicker onLocationSelect={onMapClick} />}

      {/* Show existing reports (Phase 4 preview) */}
      {reports.map((report) => (
        <Marker key={report.id} position={[report.location.lat, report.location.lng]}>
          <Popup>
            <b>{report.title}</b><br/>
            <span style={{color: '#666'}}>{report.category}</span>
            
            {/* Show Image if it exists */}
            {report.imageUrl && (
              <div style={{marginTop: '5px'}}>
                <img 
                  src={report.imageUrl} 
                  alt="Evidence" 
                  style={{width: '100%', maxHeight: '100px', borderRadius: '4px', objectFit: 'cover'}} 
                />
              </div>
            )}
            
            <div style={{fontSize: '0.8rem', marginTop: '5px'}}>
              Reported by: {report.userName}
            </div>
          </Popup>
        </Marker>
      ))}

      <Marker position={usmPosition}>
        <Popup>GeoSafe HQ</Popup>
      </Marker>
    </MapContainer>
  );
}

export default Map;