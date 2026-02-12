// src/components/FilterControl.jsx
import { useState } from 'react';

function FilterControl({ onFilterApply }) {
  const [isOpen, setIsOpen] = useState(false);

  // 1. Categories (Multi-select)
  const [categories, setCategories] = useState({
    Hazard: true,
    Flood: true,
    Fire: true,
    Accident: true,
  });

  // 2. Status (Multi-select)
  const [statuses, setStatuses] = useState({
    Confirmed: true,
    Unconfirmed: true
  });

  // 3. Time Range (Single-select) - NEW FEATURE
  const [timeRange, setTimeRange] = useState("all"); // 'all', '24h', '7d'

  const handleCategoryChange = (e) => {
    setCategories({ ...categories, [e.target.name]: e.target.checked });
  };

  const handleStatusChange = (e) => {
    setStatuses({ ...statuses, [e.target.name]: e.target.checked });
  };

  const handleApply = () => {
    // Send all 3 filters back to App.jsx
    onFilterApply({ categories, statuses, timeRange });
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'absolute', top: '80px', left: '20px', zIndex: 1000 }}>

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: 'white', border: 'none', padding: '12px 20px',
          borderRadius: '50px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '14px'
        }}
      >
        <span>⚙️ Filter Map</span>
      </button>

      {/* The Popup Panel */}
      {isOpen && (
        <div style={{
          marginTop: '15px', backgroundColor: 'white', padding: '20px',
          borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          width: '250px', position: 'absolute', left: '0'
        }}>

          {/* --- SECTION 1: TIME (The Clutter Killer) --- */}
          <h4 style={headerStyle}>📅 Time Range</h4>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            {['all', '24h', '7d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  flex: 1, padding: '5px', borderRadius: '5px',
                  border: timeRange === range ? '2px solid #007bff' : '1px solid #ddd',
                  backgroundColor: timeRange === range ? '#e7f1ff' : 'white',
                  cursor: 'pointer', fontSize: '12px'
                }}
              >
                {range === 'all' ? 'All' : range === '24h' ? '24h' : '7 Days'}
              </button>
            ))}
          </div>

          {/* --- SECTION 2: STATUS --- */}
          <h4 style={headerStyle}>✅ Status</h4>
          <div style={groupStyle}>
            {Object.keys(statuses).map(stat => (
              <label key={stat} style={labelStyle}>
                <input
                  type="checkbox" name={stat}
                  checked={statuses[stat]}
                  onChange={handleStatusChange}
                />
                {stat}
              </label>
            ))}
          </div>

          {/* --- SECTION 3: CATEGORY --- */}
          <h4 style={headerStyle}>⚠️ Category</h4>
          <div style={groupStyle}>
            {Object.keys(categories).map(cat => (
              <label key={cat} style={labelStyle}>
                <input
                  type="checkbox" name={cat}
                  checked={categories[cat]}
                  onChange={handleCategoryChange}
                />
                {cat}
              </label>
            ))}
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            style={{
              width: '100%', marginTop: '10px', padding: '10px',
              backgroundColor: '#007bff', color: 'white', border: 'none',
              borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
}

// Simple styles for cleanliness
const headerStyle = { margin: '0 0 8px 0', fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px' };
const groupStyle = { marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' };

export default FilterControl;