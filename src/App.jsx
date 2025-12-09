// src/App.jsx
import { useEffect } from 'react';
import app from './firebase'; // Import the app to trigger initialization

function App() {
  useEffect(() => {
    // This runs once when the component mounts
    console.log("Firebase initialized:", app);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>GeoSafe</h1>
      <p>Community Incident Reporting System</p>
      <p>Status: <span style={{ color: 'green' }}>Checking Console...</span></p>
    </div>
  );
}

export default App;