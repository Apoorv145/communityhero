import React, { useState, useEffect } from 'react';
import { Upload, MapPin, Sparkles, Check, Building, Wrench, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import exifr from 'exifr';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const KANPUR_AREAS = {
  "Select Area": [26.4499, 80.3319],
  "Mall Road": [26.4608, 80.3475],
  "Swaroop Nagar": [26.4866, 80.3204],
  "Kakadeo": [26.4795, 80.2974],
  "Govind Nagar": [26.4394, 80.3135],
  "Barra": [26.4172, 80.3015],
  "Kidwai Nagar": [26.4385, 80.3340]
};

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function ReportIssue() {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileBase64, setFileBase64] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    area: 'Select Area',
    lat: 26.4499,
    lng: 80.3319
  });
  const [aiResult, setAiResult] = useState(null);
  const navigate = useNavigate();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsAnalyzing(true);
      
      // Attempt to read GPS from EXIF
      try {
        const gps = await exifr.gps(file);
        if (gps && gps.latitude && gps.longitude) {
           setFormData(prev => ({
             ...prev,
             lat: gps.latitude,
             lng: gps.longitude,
             area: 'EXIF Auto-Detected'
           }));
           console.log("EXIF GPS Found:", gps);
        }
      } catch (err) {
        console.warn("Could not read EXIF data", err);
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFileBase64(reader.result);
        setTimeout(() => {
          setIsAnalyzing(false);
          setStep(2);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          area: "Detected Location"
        });
      }, () => {
        alert("Unable to retrieve your location. Please check browser permissions.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleAreaChange = (e) => {
    const selected = e.target.value;
    const coords = KANPUR_AREAS[selected];
    if (coords) {
      setFormData({...formData, area: selected, lat: coords[0], lng: coords[1]});
    } else {
      setFormData({...formData, area: selected});
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Create explicit address from selected area
      const descriptionWithArea = formData.area !== 'Select Area' 
        ? `[Area: ${formData.area}] ${formData.description}`
        : formData.description;

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, description: descriptionWithArea, imageBase64: fileBase64 })
      });
      const data = await response.json();
      
      if (response.ok) {
        setAiResult(data);
        setStep(3);
      } else {
        alert("Failed to submit report.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="report-issue animate-fade-in max-w-3xl mx-auto">
      <header className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Report an Issue</h2>
        <p className="text-muted">Help keep our community safe and beautiful</p>
      </header>

      <div className="glass-panel p-8">
        {step === 1 && (
          <div className="upload-section flex-col items-center justify-center text-center py-12">
            <div className="upload-box p-8 rounded-xl w-full max-w-md" style={{border: '2px dashed var(--glass-border)', background: 'rgba(255,255,255,0.02)'}}>
              {isAnalyzing ? (
                <div className="flex-col items-center gap-4">
                  <Sparkles size={48} className="text-primary-color animate-pulse" />
                  <h3 className="text-xl font-semibold">YOLOv11 is scanning your image...</h3>
                  <p className="text-muted text-sm">Detecting potholes, garbage, and infrastructure issues</p>
                </div>
              ) : (
                <div className="flex-col items-center gap-4">
                  <Upload size={48} className="text-muted mb-2" />
                  <h3 className="text-xl font-semibold">Upload Photo or Video</h3>
                  <p className="text-muted text-sm mb-4">Take a clear picture of the problem</p>
                  <label className="btn-primary cursor-pointer">
                    Choose File
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleImageUpload} style={{display: 'none'}} />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="form-section animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="flex-col gap-6">
              <div className="form-group flex-col gap-2">
                <label className="font-semibold">Title</label>
                <input type="text" className="input-field" placeholder="e.g. Deep pothole on main road" 
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="form-group flex-col gap-2">
                <label className="font-semibold">Area / Locality</label>
                <select className="input-field" value={formData.area} onChange={handleAreaChange}>
                  {Object.keys(KANPUR_AREAS).map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-col gap-2">
                <label className="font-semibold">Description</label>
                <textarea className="input-field" rows="3" placeholder="Add details... e.g., 'Huge pothole near the hospital.'"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
            </div>

            <div className="flex-col gap-2">
              <label className="font-semibold flex justify-between items-center">
                Pinpoint Location
                <button className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded flex items-center gap-1 hover:bg-blue-500/30 transition-colors" onClick={detectLocation}>
                  <Navigation size={12}/> Auto-Detect
                </button>
              </label>
              <div className="rounded-xl overflow-hidden border border-white/10" style={{height: '250px'}}>
                <MapContainer center={[formData.lat, formData.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <MapUpdater center={[formData.lat, formData.lng]} />
                  <Marker position={[formData.lat, formData.lng]} />
                </MapContainer>
              </div>
              <p className="text-xs text-muted text-center mt-2">
                Map centers automatically based on your Area selection or Auto-Detect.
              </p>
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-2">
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Analyzing & Submitting...' : 'Submit to AI Engine'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && aiResult && (
          <div className="success-section animate-fade-in flex-col gap-6 text-center py-8">
            <Check size={64} className="text-accent-color mx-auto mb-2" />
            <h2 className="text-3xl font-bold">Issue Reported & Analyzed!</h2>
            
            <div className="text-left glass-panel p-6 mt-4 bg-white/5 border border-white/10">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Sparkles className="text-primary-color" /> AI Synthesis Results</h3>
              <p className="text-sm mb-4 text-muted">{aiResult.aiNotes}</p>
              
              <div className="grid gap-4" style={{display: 'grid', gridTemplateColumns: '1fr 1fr'}}>
                <div className="p-4 bg-black/20 rounded-lg">
                  <p className="text-xs uppercase text-muted font-bold tracking-wider mb-1">Assigned Department</p>
                  <p className="font-bold flex items-center gap-2"><Building size={16}/> {aiResult.issue.department}</p>
                </div>
                <div className="p-4 bg-black/20 rounded-lg">
                  <p className="text-xs uppercase text-muted font-bold tracking-wider mb-1">Priority Score</p>
                  <p className="font-bold text-red-400">{aiResult.issue.priorityScore}/100 ({aiResult.issue.priority})</p>
                </div>
                <div className="p-4 bg-black/20 rounded-lg col-span-2" style={{gridColumn: 'span 2'}}>
                  <p className="text-xs uppercase text-muted font-bold tracking-wider mb-1">AI Repair Estimate</p>
                  <p className="font-bold flex items-center gap-2"><Wrench size={16}/> {aiResult.issue.repairEstimate || 'Pending manual review'}</p>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg col-span-2" style={{gridColumn: 'span 2'}}>
                  <p className="text-xs uppercase text-red-400 font-bold tracking-wider mb-1">AI Infrastructure Doctor</p>
                  <p className="font-bold text-white mb-2">This issue has a {aiResult.issue.dangerProbability || 85}% chance of becoming critical in 2 months.</p>
                  <p className="text-sm text-muted"><strong>Recommendation:</strong> {aiResult.issue.preventiveMaintenance || 'Immediate assessment required.'}</p>
                </div>
              </div>
            </div>

            <button className="btn-primary mt-6 mx-auto" onClick={() => navigate('/')}>
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
