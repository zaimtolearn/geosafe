// src/components/ReportForm.jsx
import { useState, useEffect } from 'react';
import { containsProfanity } from '../profanityFilter';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ReportForm.css';

// Create a custom red icon for the incident pin
const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function formatAddressFromNominatim(data, fallbackLat, fallbackLng) {
  if (!data) return `${fallbackLat.toFixed(4)}, ${fallbackLng.toFixed(4)}`;
  const addr = data.address || {};
  const streetLine = [addr.house_number, addr.road || addr.pedestrian || addr.footway].filter(Boolean).join(' ').trim();
  const locality = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || '';
  const city = addr.city || addr.town || addr.village || addr.county || '';
  const state = addr.state || '';
  const postcode = addr.postcode || '';
  const country = addr.country || '';
  const parts = [streetLine, locality, city, state, postcode, country].filter(Boolean);
  if (parts.length > 0) return parts.join(', ');
  if (data.display_name) return data.display_name;
  return `${fallbackLat.toFixed(4)}, ${fallbackLng.toFixed(4)}`;
}

function ReportForm({ onSubmit, onCancel, preSelectedLocation, isGuest }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [file, setFile] = useState(null);
  const [address, setAddress] = useState("Fetching location details...");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (preSelectedLocation) {
      const { lat, lng } = preSelectedLocation;
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => { setAddress(formatAddressFromNominatim(data, lat, lng)); })
        .catch(() => { setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`); });
    }
  }, [preSelectedLocation]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (containsProfanity(title)) {
      setErrorMsg("⚠️ Inappropriate content detected. Please revise your title.");
      return;
    }

    setErrorMsg("");
    onSubmit({ title, category, file, address });
  };

  return (
    <div className="form-overlay">
      <div className="form-card">

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#111' }}>Report Incident</h2>
          {isGuest && <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>GUEST</span>}
        </div>

        {/* --- NEW: MINI-MAP LOCATION DISPLAY --- */}
        <div className="location-display-box">
          {preSelectedLocation ? (
            <div style={{ height: '140px', width: '100%', backgroundColor: '#eee' }}>
              <MapContainer
                center={[preSelectedLocation.lat, preSelectedLocation.lng]}
                zoom={16}
                zoomControl={false}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[preSelectedLocation.lat, preSelectedLocation.lng]} icon={redIcon} />
              </MapContainer>
            </div>
          ) : (
            <div style={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
              No location selected
            </div>
          )}

          <div className="location-address-text">
            <strong style={{ color: '#111' }}>📍 Incident Location:</strong><br />
            {address}
          </div>
        </div>
        {/* -------------------------------------- */}

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px', border: '1px solid #fca5a5', fontWeight: '500' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>What happened?</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder="E.g., Deep pothole blocking left lane"
              required
            />
          </div>

          <div className="input-group">
            <label>Category:</label>
            <select
              className="form-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Infrastructure">Infrastructure</option>
              <option value="Natural Hazard">Natural Hazard</option>
              <option value="Traffic">Traffic</option>
              <option value="Security">Security</option>
              <option value="Environment">Environment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="input-group">
            <label>Attach Evidence (Optional):</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="form-input"
              style={{ padding: '6px' }}
            />
          </div>

          <div className="button-group">
            <button type="button" onClick={onCancel} className="btn btn-cancel">Cancel</button>
            <button type="submit" className="btn btn-submit">
              {file ? 'Upload & Submit' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportForm;