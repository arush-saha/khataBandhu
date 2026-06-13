import React, { useState } from 'react';
import { Camera } from 'react-html5-camera-photo'; // FIXED EXPORT MATCH
import 'react-html5-camera-photo/build/css/index.css'; // RESTORED FOR THE BUTTONS

function ReceiptScanner({ onScanSuccess }) {
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const handleTakePhoto = async (dataUri) => {
    setLoading(true);
    setShowCamera(false);

    try {
      // Clean up the Data URL prefix
      const parts = dataUri.split(',');
      const prefix = parts[0];
      const base64Data = parts[1];
      const detectedMimeType = prefix.match(/:(.*?);/)[1];

      // Send payload to backend
      const response = await fetch('http://localhost:5000/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          mimeType: detectedMimeType
        })
      });

      const result = await response.json();

      if (result.success) {
        onScanSuccess(result.data); // Add entry to dashboard array
      } else {
        alert("AI could not read this receipt format. Try a clearer angle.");
      }
    } catch (err) {
      console.error("Scanning error:", err);
      alert("Could not connect to the backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ margin: '20px 0', textAlign: 'center' }}>
      {loading && <h3>🤖 Gemini AI is reading your receipt...</h3>}
      
      {!showCamera && !loading && (
        <button 
          onClick={() => setShowCamera(true)}
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px', 
            cursor: 'pointer', 
            background: '#007bff', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '5px' 
          }}
        >
          📷 Scan Receipt with Camera
        </button>
      )}

      {showCamera && (
        <div style={{ maxWidth: '500px', margin: '0 auto', position: 'relative' }}>
          <Camera 
            onTakePhoto={(dataUri) => handleTakePhoto(dataUri)} 
            idealFacingMode="environment" 
          />
          <button 
            onClick={() => setShowCamera(false)} 
            style={{ marginTop: '15px', padding: '6px 12px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default ReceiptScanner;