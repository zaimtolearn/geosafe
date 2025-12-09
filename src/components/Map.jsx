// src/components/Map.jsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// --- Fix for missing default icon in Leaflet + React ---
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;
// -------------------------------------------------------

function Map() {
  // Coordinates for USM, Penang (Gelugor)
  const usmPosition = [5.3556, 100.3025]; 

  return (
    <MapContainer 
      center={usmPosition} 
      zoom={15} 
      style={{ height: "100vh", width: "100%" }} // 100vh means "100% of Viewport Height"
    >
      {/* This layer provides the actual map images (tiles) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* A test marker to prove it works */}
      <Marker position={usmPosition}>
        <Popup>
          GeoSafe HQ <br /> USM School of Computer Sciences.
        </Popup>
      </Marker>
    </MapContainer>
  );
}

export default Map;