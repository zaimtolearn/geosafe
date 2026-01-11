// src/components/Map.jsx
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import VoteControls from './VoteControls';

// --- CUSTOM ICONS ---
// Standard Blue Marker (Unconfirmed)
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Green Marker (Confirmed)
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
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

function Map({ onMapClick, reports = [], onVote, userId, flyToLocation }) {
  const usmPosition = [5.3556, 100.3025]; 

  return (
    <MapContainer center={usmPosition} zoom={15} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Controller to handle movement */}
      <MapController center={flyToLocation} />

      {/* Click Listener Helper */}
      {onMapClick && <LocationPicker onLocationSelect={onMapClick} />}

      {reports.map((report) => (
        <Marker 
          key={report.id} 
          position={[report.location.lat, report.location.lng]}
          // DYNAMIC ICON SELECTION
          icon={report.status === 'Confirmed' ? greenIcon : blueIcon}
        >
          <Popup>
            <div style={{minWidth: '200px'}}>
              {/* STATUS BADGE */}
              <div style={{
                marginBottom: '5px', 
                padding: '4px 8px', 
                borderRadius: '4px',
                display: 'inline-block',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                backgroundColor: report.status === 'Confirmed' ? '#d4edda' : '#f8d7da',
                color: report.status === 'Confirmed' ? '#155724' : '#721c24'
              }}>
                {report.status === 'Confirmed' ? '✅ VERIFIED' : '⚠️ UNCONFIRMED'}
              </div>

              <h3 style={{margin: '5px 0', fontSize: '1rem'}}>{report.title}</h3>
              <span style={{color: '#666', fontSize: '0.85rem'}}>{report.category}</span>
              
              {report.imageUrl && (
                <div style={{marginTop: '8px'}}>
                  <img 
                    src={report.imageUrl} 
                    alt="Evidence" 
                    style={{width: '100%', maxHeight: '120px', borderRadius: '4px', objectFit: 'cover'}} 
                  />
                </div>
              )}
              
              <div style={{fontSize: '0.75rem', marginTop: '5px', color: '#888'}}>
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
    </MapContainer>
  );
}

export default Map;