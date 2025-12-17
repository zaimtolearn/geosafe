// src/components/ReportForm.jsx
import { useState } from 'react';
import './ReportForm.css';

function ReportForm({ onSubmit, onCancel, preSelectedLocation, isGuest }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hazard');
  const [file, setFile] = useState(null); // Store the selected file

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the file along with the data
    onSubmit({ title, category, file });
  };

  return (
    <div className="form-overlay">
      <div className="form-card">
        <h2>Report Incident</h2>
        {isGuest && <small style={{color: 'red'}}>Reporting as Guest</small>}
        
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '10px' }}>
          Location: {preSelectedLocation ? 
            `${preSelectedLocation.lat.toFixed(4)}, ${preSelectedLocation.lng.toFixed(4)}` 
            : 'Unknown'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Title:</label>
            <input 
              type="text" 
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., Fallen Tree"
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
              <option value="Hazard">Hazard</option>
              <option value="Accident">Accident</option>
              <option value="Flood">Flood</option>
              <option value="Fire">Fire</option>
            </select>
          </div>

          {/* NEW: Image Upload Input */}
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