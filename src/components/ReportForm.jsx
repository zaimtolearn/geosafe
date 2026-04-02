// src/components/ReportForm.jsx
import { useState, useEffect } from 'react';
import './ReportForm.css';

function formatAddressFromNominatim(data, fallbackLat, fallbackLng) {
  if (!data) return `${fallbackLat.toFixed(4)}, ${fallbackLng.toFixed(4)}`;

  const addr = data.address || {};

  // Build a clear, human-readable address with street + postcode.
  const streetLine = [addr.house_number, addr.road || addr.pedestrian || addr.footway]
    .filter(Boolean)
    .join(' ')
    .trim();

  const locality =
    addr.suburb ||
    addr.neighbourhood ||
    addr.village ||
    addr.town ||
    addr.city_district ||
    '';

  const city = addr.city || addr.town || addr.village || addr.county || '';
  const state = addr.state || '';
  const postcode = addr.postcode || '';
  const country = addr.country || '';

  const parts = [streetLine, locality, city, state, postcode, country].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  if (data.display_name) {
    return data.display_name;
  }

  return `${fallbackLat.toFixed(4)}, ${fallbackLng.toFixed(4)}`;
}

function ReportForm({ onSubmit, onCancel, preSelectedLocation, isGuest }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Infrastructure');
  const [file, setFile] = useState(null);
  const [address, setAddress] = useState("Fetching location details...");

  useEffect(() => {
    if (preSelectedLocation) {
      const { lat, lng } = preSelectedLocation;

      // Call the free OpenStreetMap API
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
          setAddress(formatAddressFromNominatim(data, lat, lng));
        })
        .catch(() => {
          // If the internet fails, fallback to coordinates
          setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        });
    }
  }, [preSelectedLocation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, category, file, address });
  };

  return (
    <div className="form-overlay">
      <div className="form-card">
        <h2>Report Incident</h2>
        {isGuest && <small style={{ color: 'red' }}>Reporting as Guest</small>}

        {/* Display the real address */}
        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginBottom: '15px', border: '1px solid #ddd' }}>
          <p style={{ fontSize: '0.85rem', color: '#333', margin: 0 }}>
            <strong>📍 Location:</strong><br />
            {address}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Title:</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Broken Streetlight"
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
            <label>Photo (Optional):</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="form-input"
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