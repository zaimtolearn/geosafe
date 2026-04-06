// src/components/ReportForm.jsx
import { useState, useEffect } from 'react';
import './ReportForm.css';

// --- PROFANITY FILTER DICTIONARY (FR-21) ---
const BANNED_WORDS = [
  "fuck", "fuk", "fck", "shit", "bitch", "asshole", "crap", "damn", "dick", "ass",
  "pussy", "slut", "whore", "bastard", "cunt", "fag", "nigger", "nigga", "prick", "bullshit"
];

// Dictionary of common symbol substitutions
const leetMap = {
  a: '[a@4]',
  b: '[b8]',
  c: '[ck]',
  e: '[e3]',
  i: '[i1!l]',
  o: '[o0]',
  s: '[s\\$5]',
  t: '[t7]'
};

const containsProfanity = (text) => {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return BANNED_WORDS.some(word => {
    let patternStr = "";

    for (let char of word) {
      if (leetMap[char]) {
        patternStr += leetMap[char] + '+';
      } else {
        patternStr += char + '+';
      }
    }
    const regex = new RegExp(`\\b${patternStr}\\b`, 'i');
    return regex.test(lowerText);
  });
};

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

    // FR-21: Check for inappropriate content before submitting
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
        <h2 style={{ margin: '0 0 10px 0' }}>Report Incident</h2>
        {isGuest && <small style={{ color: '#dc2626', display: 'block', marginBottom: '10px' }}>Reporting as Guest</small>}

        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', marginBottom: '15px', border: '1px solid #ddd' }}>
          <p style={{ fontSize: '0.85rem', color: '#333', margin: 0 }}>
            <strong>📍 Location:</strong><br />
            {address}
          </p>
        </div>

        {/* --- INLINE ERROR MESSAGE --- */}
        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px', border: '1px solid #fca5a5' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Title:</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errorMsg) setErrorMsg(""); // Clear error when user types
              }}
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