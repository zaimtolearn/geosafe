// src/components/FilterControl.jsx
import { useState } from 'react';

function FilterControl({ onFilterApply }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Default: All checked
  const [categories, setCategories] = useState({
    Hazard: true,
    Accident: true,
    Flood: true,
    Fire: true
  });

  const [statuses, setStatuses] = useState({
    Confirmed: true,
    Unconfirmed: true
  });

  // Handle Checkbox Changes
  const handleCategoryChange = (e) => {
    const { name, checked } = e.target;
    setCategories(prev => ({ ...prev, [name]: checked }));
  };

  const handleStatusChange = (e) => {
    const { name, checked } = e.target;
    setStatuses(prev => ({ ...prev, [name]: checked }));
  };

  // Send data back to App.jsx when "Apply" is clicked
  const handleApply = () => {
    onFilterApply({ categories, statuses });
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'absolute', top: '80px', left: '20px', zIndex: 1000 }}>
      {/* The Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          backgroundColor: 'white', border: 'none', padding: '10px 20px',
          borderRadius: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
        }}
      >
        🔍 Filter Incidents
      </button>

      {/* The Popup Menu */}
      {isOpen && (
        <div style={{
          marginTop: '10px', backgroundColor: 'white', padding: '15px',
          borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          width: '200px'
        }}>
          
          <h4 style={{margin: '0 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>Category</h4>
          {Object.keys(categories).map(cat => (
            <div key={cat} style={{marginBottom: '5px'}}>
              <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <input 
                  type="checkbox" 
                  name={cat} 
                  checked={categories[cat]} 
                  onChange={handleCategoryChange}
                />
                {cat}
              </label>
            </div>
          ))}

          <h4 style={{margin: '15px 0 10px 0', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>Status</h4>
          {Object.keys(statuses).map(stat => (
            <div key={stat} style={{marginBottom: '5px'}}>
              <label style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <input 
                  type="checkbox" 
                  name={stat} 
                  checked={statuses[stat]} 
                  onChange={handleStatusChange}
                />
                {stat}
              </label>
            </div>
          ))}

          <button 
            onClick={handleApply}
            style={{
              width: '100%', marginTop: '15px', padding: '8px', 
              backgroundColor: '#28a745', color: 'white', border: 'none', 
              borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default FilterControl;