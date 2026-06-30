import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, Circle, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertCircle, Clock, Building, Zap, Activity, Navigation, Layers, Flame, Trophy, Trash2, Car, Droplets, Sun, Beaker, CheckCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet.heat';

// Custom Marker Generators
const createColoredIcon = (color, isSimulated = false) => {
  const markerHtml = isSimulated ? `
    <div style="background: ${color}; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px ${color}; animation: pulse 1.5s infinite;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
  ` : `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32" stroke="white" stroke-width="1.5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;
  
  return L.divIcon({ html: markerHtml, className: isSimulated ? 'simulated-marker' : 'custom-colored-marker', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
};

const POI_ICON = L.divIcon({
  html: `<div style="font-size: 24px; background: white; border-radius: 50%; padding: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🏥</div>`,
  className: 'poi-marker', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16]
});

const icons = {
  pothole: createColoredIcon('#ef4444'),
  garbage: createColoredIcon('#10b981'),
  water: createColoredIcon('#3b82f6'),
  streetlight: createColoredIcon('#eab308'),
  default: createColoredIcon('#6366f1'),
  resolved: createColoredIcon('#10b981', true) // Simulated resolved icon
};

const getIconForCategory = (category, isSimulated) => {
  if (isSimulated) return icons.resolved;
  const cat = category?.toLowerCase() || '';
  if (cat.includes('pothole') || cat.includes('road')) return icons.pothole;
  if (cat.includes('garbage') || cat.includes('sanitation')) return icons.garbage;
  if (cat.includes('water') || cat.includes('leak')) return icons.water;
  if (cat.includes('light') || cat.includes('electrical')) return icons.streetlight;
  return icons.default;
};

// Heatmap Layer Component
function HeatmapLayer({ issues }) {
  const map = useMap();
  useEffect(() => {
    if (!issues || issues.length === 0) return;
    const points = issues.map(i => [i.lat, i.lng, i.severity || 5]); 
    const heatLayer = L.heatLayer(points, {
      radius: 30, blur: 20, maxZoom: 15,
      gradient: { 0.4: '#10b981', 0.6: '#eab308', 1.0: '#ef4444' }
    });
    heatLayer.addTo(map);
    return () => map.removeLayer(heatLayer);
  }, [map, issues]);
  return null;
}

// 3D Buildings Layer Component (OSMBuildings)
function Buildings3DLayer() {
  const map = useMap();
  useEffect(() => {
    if (typeof window !== 'undefined' && window.OSMBuildings) {
      const osmb = new window.OSMBuildings(map).load('https://{s}.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.json');
      return () => {
        // Safe removal if the plugin supports it, or just let Leaflet garbage collect
        try { map.removeLayer(osmb); } catch(e) {}
      };
    }
  }, [map]);
  return null;
}

// Distance Calculation for Simulator
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; 
};

// Ward Definitions & Scoring
const KANPUR_WARDS = [
  { name: 'Mall Road Zone', color: '#8b5cf6', polygon: [ [26.47, 80.34], [26.47, 80.36], [26.45, 80.36], [26.45, 80.34] ] },
  { name: 'Kakadeo Zone', color: '#f97316', polygon: [ [26.49, 80.28], [26.49, 80.31], [26.47, 80.31], [26.47, 80.28] ] },
  { name: 'Govind Nagar Zone', color: '#ec4899', polygon: [ [26.44, 80.30], [26.44, 80.33], [26.42, 80.33], [26.42, 80.30] ] }
];

const isPointInPolygon = (point, vs) => {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1], xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

const calculateWardHealth = (ward, allIssues) => {
  const wardIssues = allIssues.filter(issue => isPointInPolygon([issue.lat, issue.lng], ward.polygon));
  let scores = { cleanliness: 100, roadQuality: 100, streetlight: 100, drainage: 100, resolution: 100 };
  const activeIssues = wardIssues.filter(i => i.status !== 'RESOLVED');
  
  const garbage = activeIssues.filter(i => i.category?.toLowerCase().includes('garbage')).length;
  const roads = activeIssues.filter(i => i.category?.toLowerCase().includes('road') || i.category?.toLowerCase().includes('pothole')).length;
  const lights = activeIssues.filter(i => i.category?.toLowerCase().includes('light')).length;
  const water = activeIssues.filter(i => i.category?.toLowerCase().includes('water')).length;

  scores.cleanliness = Math.max(0, 100 - (garbage * 5));
  scores.roadQuality = Math.max(0, 100 - (roads * 5));
  scores.streetlight = Math.max(0, 100 - (lights * 5));
  scores.drainage = Math.max(0, 100 - (water * 5));

  if (wardIssues.length > 0) {
    const resolvedCount = wardIssues.length - activeIssues.length;
    scores.resolution = Math.round((resolvedCount / wardIssues.length) * 100);
  }
  const overall = Math.round((scores.cleanliness + scores.roadQuality + scores.streetlight + scores.drainage + (scores.resolution * 2)) / 6);

  return { wardName: ward.name, total: wardIssues.length, resolved: wardIssues.length - activeIssues.length, pending: activeIssues.length, scores, overall };
};

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [mapMode, setMapMode] = useState('markers'); // markers | heatmap | wards | leaderboard | simulator
  const [selectedWard, setSelectedWard] = useState(null);
  const [simulationState, setSimulationState] = useState(null); // { rootIssue, affectedIssues, radius }

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${API_URL}/api/issues`);
        if (!response.ok) throw new Error('Failed to fetch issues');
        const data = await response.json();
        setIssues(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
    
    // Add pulsing animation CSS globally
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
      .simulated-line { stroke-dasharray: 10; animation: dash 2s linear infinite; }
      @keyframes dash { to { stroke-dashoffset: -20; } }
    `;
    document.head.appendChild(style);
  }, []);

  const handleRouteClick = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const getLeaderboardData = () => {
    const data = KANPUR_WARDS.map(w => calculateWardHealth(w, issues));
    return data.sort((a, b) => b.overall - a.overall);
  };

  const runSimulation = (rootIssue) => {
    const radius = 800; // 800 meters
    const affected = issues.filter(i => {
      if (i.id === rootIssue.id) return false;
      const dist = getDistanceInMeters(rootIssue.lat, rootIssue.lng, i.lat, i.lng);
      return dist <= radius;
    });
    setSimulationState({ rootIssue, affectedIssues: affected, radius });
  };

  const isAffectedBySimulation = (issueId) => {
    if (!simulationState) return false;
    return simulationState.affectedIssues.some(i => i.id === issueId);
  };

  return (
    <div className="dashboard animate-fade-in flex-col gap-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">Community Hero</h2>
          <p className="text-muted">Live Tracking, AI Twin & Ward Health</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className={`btn-secondary ${mapMode === 'markers' ? 'bg-white/10' : ''}`} onClick={() => {setMapMode('markers'); setSimulationState(null);}}>
            <MapPin size={18} /> Pins
          </button>
          <button className={`btn-secondary ${mapMode === 'heatmap' ? 'bg-white/10' : ''}`} onClick={() => {setMapMode('heatmap'); setSimulationState(null);}}>
            <Flame size={18} /> Heatmap
          </button>
          <button className={`btn-secondary ${mapMode === 'wards' ? 'bg-white/10' : ''}`} onClick={() => {setMapMode('wards'); setSimulationState(null);}}>
            <Layers size={18} /> Wards
          </button>
          <button className={`btn-secondary ${mapMode === 'leaderboard' ? 'bg-white/10 border-accent-color text-accent-color' : ''}`} onClick={() => {setMapMode('leaderboard'); setSimulationState(null);}}>
            <Trophy size={18} /> Leaderboard
          </button>
          <button className={`btn-secondary ${mapMode === 'simulator' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : ''}`} onClick={() => setMapMode('simulator')}>
            <Beaker size={18} /> Digital Twin Simulator
          </button>
        </div>
      </header>
      
      {error && <div className="text-red-500 bg-red-500/10 p-4 rounded-lg">Error loading issues: {error}</div>}
      
      {mapMode === 'leaderboard' ? (
        <div className="leaderboard-view animate-fade-in glass-panel p-8">
          <div className="flex items-center gap-3 mb-8 text-center justify-center">
            <Trophy size={32} className="text-yellow-400" />
            <h3 className="text-3xl font-bold">City Health Leaderboard</h3>
          </div>
          
          <div className="grid gap-4">
            {getLeaderboardData().map((wardData, idx) => (
              <div key={wardData.wardName} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition">
                <div className="flex items-center gap-6">
                  <div className="text-4xl font-bold" style={{color: idx === 0 ? 'var(--accent-color)' : 'var(--muted-color)'}}>
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold">{wardData.wardName}</h4>
                    <p className="text-sm text-muted">{wardData.total} Total Issues Reported</p>
                  </div>
                </div>
                
                <div className="flex gap-8 text-center">
                  <div><p className="text-sm text-muted">Clean</p><p className="font-bold">{wardData.scores.cleanliness}</p></div>
                  <div><p className="text-sm text-muted">Roads</p><p className="font-bold">{wardData.scores.roadQuality}</p></div>
                  <div><p className="text-sm text-muted">Lights</p><p className="font-bold">{wardData.scores.streetlight}</p></div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">Health Score</p>
                  <p className={`text-4xl font-bold ${wardData.overall >= 80 ? 'text-green-400' : wardData.overall >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {wardData.overall}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-6 dashboard-layout" style={{flexWrap: 'wrap'}}>
          {/* Map Section */}
          <div className="glass-panel map-container" style={{flex: '1', minWidth: '300px', height: '600px', overflow: 'hidden', padding: '0.5rem', position: 'relative'}}>
            
            {mapMode === 'simulator' && !simulationState && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-lg z-[1000] animate-bounce pointer-events-none">
                Select a root issue marker to run 3D Simulation
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-full w-full">Loading Map...</div>
            ) : (
              <MapContainer center={[26.4499, 80.3319]} zoom={14} style={{ height: '100%', width: '100%', borderRadius: '12px', zIndex: 1 }} pitch={60} bearing={45}>
                {/* Always use light map tiles as requested */}
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                
                {/* 3D Buildings layered on top specifically for Simulator Mode */}
                {mapMode === 'simulator' && <Buildings3DLayer />}
                
                {mapMode === 'heatmap' && <HeatmapLayer issues={issues} />}
                
                {mapMode === 'wards' && KANPUR_WARDS.map(ward => (
                  <Polygon 
                    key={ward.name} positions={ward.polygon} 
                    pathOptions={{ color: ward.color, fillColor: ward.color, fillOpacity: 0.2 }}
                    eventHandlers={{ click: () => setSelectedWard(ward.name) }}
                  >
                    <Popup><b>{ward.name}</b><br/>Click to view Ward Health</Popup>
                  </Polygon>
                ))}

                {/* Render markers for pins, wards, and simulator modes */}
                {(mapMode === 'markers' || mapMode === 'wards' || mapMode === 'simulator') && issues.map(issue => {
                  const isSimulated = isAffectedBySimulation(issue.id);
                  return (
                    <Marker 
                      key={issue.id} 
                      position={[issue.lat, issue.lng]} 
                      icon={getIconForCategory(issue.category, isSimulated)}
                      eventHandlers={{
                        click: () => { if (mapMode === 'simulator') runSimulation(issue); }
                      }}
                    >
                      {mapMode !== 'simulator' && (
                        <Popup className="custom-popup" minWidth={250}>
                          <div className="flex-col gap-2">
                            {issue.imageUrl && <img src={issue.imageUrl} alt={issue.title} style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px'}} />}
                            <h4 className="font-bold text-md mt-1">{issue.title}</h4>
                            <p className="text-xs text-gray-500">{issue.description || 'No description provided.'}</p>
                            <div className="text-xs font-semibold mt-1">Status: <span style={{color: issue.status==='REPORTED'?'orange':'green'}}>{issue.status}</span></div>
                            <div className="text-xs font-semibold">Dept: {issue.department || 'Unassigned'}</div>
                            <div className="text-xs font-semibold">Priority: <span className="text-red-500">{issue.priorityScore}/100</span></div>
                            
                            {issue.dangerProbability && (
                              <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                                <div className="text-xs font-bold text-red-400">AI Risk: {issue.dangerProbability}% danger</div>
                                <div className="text-[10px] text-gray-400 leading-tight mt-1">{issue.preventiveMaintenance}</div>
                              </div>
                            )}

                            <div className="text-xs text-gray-400 mt-2">Reported: {new Date(issue.createdAt).toLocaleDateString()}</div>
                            <button 
                              className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 px-3 rounded flex items-center justify-center gap-1"
                              onClick={() => handleRouteClick(issue.lat, issue.lng)}
                            >
                              <Navigation size={14} /> Route via Google Maps
                            </button>
                          </div>
                        </Popup>
                      )}
                    </Marker>
                  );
                })}

                {/* Render Simulation Visuals */}
                {simulationState && (
                  <>
                    <Circle 
                      center={[simulationState.rootIssue.lat, simulationState.rootIssue.lng]} 
                      radius={simulationState.radius} 
                      pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2, dashArray: '10, 10' }} 
                    />
                    {simulationState.affectedIssues.map(affected => (
                      <Polyline 
                        key={affected.id} 
                        positions={[
                          [simulationState.rootIssue.lat, simulationState.rootIssue.lng], 
                          [affected.lat, affected.lng]
                        ]} 
                        className="simulated-line"
                        pathOptions={{ color: '#10b981', weight: 3, opacity: 0.7 }} 
                      />
                    ))}
                  </>
                )}

              </MapContainer>
            )}
          </div>

          {/* Side Panel: Dynamic based on mode */}
          <div className="glass-panel" style={{flex: '1', minWidth: '350px', padding: '1.5rem', maxHeight: '600px', overflowY: 'auto'}}>
            
            {mapMode === 'simulator' ? (
              <div className="simulation-dashboard animate-fade-in">
                <h3 className="text-2xl font-bold mb-4 text-blue-400 flex items-center gap-2"><Beaker/> Digital Twin Analysis</h3>
                
                {!simulationState ? (
                  <p className="text-muted">Engage the simulator by clicking on any reported issue marker on the 3D map. The system will calculate the cascading impact of resolving that specific problem.</p>
                ) : (
                  <div className="flex-col gap-6 animate-fade-in">
                    <div className="p-4 bg-white/5 border border-blue-500/30 rounded-lg">
                      <p className="text-xs uppercase text-blue-400 font-bold mb-1">Root Cause Selected</p>
                      <h4 className="text-lg font-bold">{simulationState.rootIssue.title}</h4>
                      <p className="text-sm text-muted">{simulationState.rootIssue.category} - {simulationState.rootIssue.department}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-4xl font-bold text-green-400">{simulationState.affectedIssues.length}</p>
                      <p className="text-sm uppercase text-muted font-bold tracking-wider">Related Issues Auto-Resolved</p>
                    </div>

                    {simulationState.affectedIssues.length > 0 && (
                      <div>
                        <h5 className="font-bold mb-2">Simulated Impact Chain:</h5>
                        <ul className="text-sm text-muted space-y-2">
                          {simulationState.affectedIssues.map(issue => (
                            <li key={issue.id} className="flex items-center gap-2">
                              <CheckCircle size={14} className="text-green-400"/> Resolves {issue.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="font-bold text-green-400 mb-1">Estimated ROI: High</p>
                      <p className="text-xs text-muted">Fixing this root node will resolve multiple cascading infrastructure complaints within a {simulationState.radius}m radius, saving municipal dispatch costs.</p>
                    </div>

                    <button className="btn-secondary w-full" onClick={() => setSimulationState(null)}>Reset Simulation</button>
                  </div>
                )}
              </div>
            ) : mapMode === 'wards' && selectedWard ? (
              <div className="ward-dashboard animate-fade-in">
                {(() => {
                  const wardDef = KANPUR_WARDS.find(w => w.name === selectedWard);
                  const stats = calculateWardHealth(wardDef, issues);
                  
                  return (
                    <>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-bold">{selectedWard} Health</h3>
                        <div className={`text-3xl font-bold ${stats.overall >= 80 ? 'text-green-400' : stats.overall >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {stats.overall}<span className="text-sm text-muted">/100</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="p-3 bg-white/5 rounded border border-white/10 text-center">
                          <p className="text-2xl font-bold">{stats.total}</p>
                          <p className="text-xs uppercase text-muted font-bold">Complaints</p>
                        </div>
                        <div className="p-3 bg-white/5 rounded border border-white/10 text-center">
                          <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
                          <p className="text-xs uppercase text-muted font-bold">Resolved</p>
                        </div>
                      </div>

                      <div className="flex-col gap-4">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-muted mb-2">Infrastructure Metrics</h4>
                        
                        <div className="flex items-center gap-3">
                          <Trash2 size={20} className="text-green-400 w-8" />
                          <div className="flex-grow">
                            <div className="flex justify-between text-xs mb-1"><span>Cleanliness</span><span>{stats.scores.cleanliness}%</span></div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{width: `${stats.scores.cleanliness}%`}}></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Car size={20} className="text-red-400 w-8" />
                          <div className="flex-grow">
                            <div className="flex justify-between text-xs mb-1"><span>Road Quality</span><span>{stats.scores.roadQuality}%</span></div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500" style={{width: `${stats.scores.roadQuality}%`}}></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Sun size={20} className="text-yellow-400 w-8" />
                          <div className="flex-grow">
                            <div className="flex justify-between text-xs mb-1"><span>Streetlights</span><span>{stats.scores.streetlight}%</span></div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-500" style={{width: `${stats.scores.streetlight}%`}}></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Droplets size={20} className="text-blue-400 w-8" />
                          <div className="flex-grow">
                            <div className="flex justify-between text-xs mb-1"><span>Drainage</span><span>{stats.scores.drainage}%</span></div>
                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{width: `${stats.scores.drainage}%`}}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )
                })()}
                <button className="btn-secondary w-full mt-6" onClick={() => setSelectedWard(null)}>Clear Selection</button>
              </div>
            ) : (
              <div className="issues-feed animate-fade-in">
                <h3 className="text-xl font-bold mb-4">Latest Reports</h3>
                {loading ? <p>Loading issues...</p> : (
                  <div className="flex-col gap-4">
                    {issues.map(issue => (
                      <div key={issue.id} className="issue-card flex gap-4 p-4 rounded-lg" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)'}}>
                        <div className="flex-col justify-center w-full">
                          <div className="flex justify-between w-full" style={{alignItems: 'center'}}>
                            <h4 className="font-bold text-lg">{issue.title}</h4>
                            <span className="text-xs font-bold px-2 py-1 rounded" style={{
                              background: issue.priority === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : issue.priority === 'HIGH' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                              color: issue.priority === 'CRITICAL' ? '#ef4444' : issue.priority === 'HIGH' ? '#f59e0b' : '#60a5fa'
                            }}>
                              {issue.priorityScore}/100
                            </span>
                          </div>
                          <p className="text-sm text-muted mt-1 flex items-center gap-1">
                            <Building size={14}/> {issue.department || 'Auto-assigning...'}
                          </p>
                          {issue.address && <p className="text-xs text-muted mt-1 flex items-center gap-1"><MapPin size={12}/> {issue.address}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
