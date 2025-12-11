// src/App.jsx
import { useState } from 'react';
import Map from './components/Map';
import ReportForm from './components/ReportForm';
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

function App() {
  const [showForm, setShowForm] = useState(false);
  const [selectMode, setSelectMode] = useState(false); // New state: Are we picking a location?
  const [tempLocation, setTempLocation] = useState(null); // Where did the user click?

  // 1. User clicks the big red button
  const startReporting = () => {
    setSelectMode(true);
    alert("Click on the map to set the incident location.");
  };

  // 2. User clicks the map
  const handleMapClick = (location) => {
    if (selectMode) {
      setTempLocation(location);
      setSelectMode(false); // Stop picking
      setShowForm(true);    // Show the form
    }
  };

  // 3. User submits the form
  const handleAddReport = async (reportData) => {
    try {
      const reportsCollection = collection(db, 'reports');
      await addDoc(reportsCollection, {
        title: reportData.title,
        category: reportData.category,
        location: tempLocation, // Use the clicked location
        timestamp: new Date()
      });

      alert("Report submitted successfully!");
      setShowForm(false);
      setTempLocation(null);
    } catch (error) {
      console.error("Error adding report: ", error);
      alert("Error saving report.");
    }
  };

  return (
    <div>
       {/* Pass the click handler to the Map */}
       <Map onMapClick={handleMapClick} />

       {/* Floating Button: Only show if NOT selecting location and NOT showing form */}
       {!selectMode && !showForm && (
         <button 
           onClick={startReporting}
           style={{
             position: 'absolute', bottom: '30px', right: '30px',
             zIndex: 999, padding: '15px 20px', fontSize: '16px',
             backgroundColor: '#e63946', color: 'white', border: 'none',
             borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold'
           }}
         >
           + Report Incident
         </button>
       )}

       {/* Instruction Banner during Select Mode */}
       {selectMode && (
         <div style={{
           position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
           zIndex: 999, backgroundColor: 'white', padding: '10px 20px', 
           borderRadius: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', fontWeight: 'bold'
         }}>
           Tap map to select location...
         </div>
       )}

       {/* The Form */}
       {showForm && (
         <ReportForm 
           preSelectedLocation={tempLocation}
           onSubmit={handleAddReport} 
           onCancel={() => { setShowForm(false); setSelectMode(false); }} 
         />
       )}
    </div>
  );
}

export default App;