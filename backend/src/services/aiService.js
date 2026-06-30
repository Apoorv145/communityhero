import dotenv from 'dotenv';
dotenv.config();

/**
 * Mocks a call to the local Python FastAPI ML Service (YOLOv11).
 */
const fetchYoloDetection = async (base64Image, lat, lng) => {
  // In production, this would make an HTTP POST to http://localhost:8000/api/v1/detect
  // We're mocking the network call here just in case the Python server isn't running.
  
  // Simulated YOLO output
  const classes = ["pothole", "garbage", "broken streetlight", "water leakage", "illegal parking", "fallen tree"];
  const detected = classes[Math.floor(Math.random() * classes.length)];
  
  return {
    detections: [
      { class: detected, confidence: 0.94 }
    ]
  };
};

/**
 * Mocks a query to OpenStreetMap Overpass API to find nearby POIs (Hospitals, Schools).
 */
const fetchPoiContext = async (lat, lng) => {
  // Simulated Overpass API response
  const hasHospital = Math.random() > 0.5;
  const hasSchool = Math.random() > 0.5;
  
  let context = [];
  if (hasHospital) context.push({ type: 'Hospital', distance: '120m', impact: 'CRITICAL' });
  if (hasSchool) context.push({ type: 'School', distance: '300m', impact: 'HIGH' });
  
  return {
    poiNearby: context,
    trafficDensity: 'High'
  };
};

/**
 * Analyzes an image and text description to automatically categorize, score, and assign a civic issue.
 */
export const analyzeIssue = async (base64Image, textDescription, lat, lng) => {
  console.log('Orchestrating AI Pipeline...');
  
  // 1. Run YOLOv11 Computer Vision detection OR NLP Intent Extraction
  let detectedIssue = 'garbage'; // fallback
  let confidenceScore = 0.85;

  if (base64Image) {
    const yoloResult = await fetchYoloDetection(base64Image, lat, lng);
    detectedIssue = yoloResult.detections[0].class;
    confidenceScore = yoloResult.detections[0].confidence;
  } else if (textDescription) {
    // Simulated NLP / LLM extraction for Voice commands (Hindi/English)
    const txt = textDescription.toLowerCase();
    if (txt.includes('pothole') || txt.includes('gaddha') || txt.includes('road')) detectedIssue = 'pothole';
    else if (txt.includes('water') || txt.includes('pani') || txt.includes('leak') || txt.includes('pipe')) detectedIssue = 'water leakage';
    else if (txt.includes('tree') || txt.includes('ped') || txt.includes('gir') || txt.includes('fall')) detectedIssue = 'fallen tree';
    else if (txt.includes('park') || txt.includes('car') || txt.includes('gadi') || txt.includes('vehicle')) detectedIssue = 'illegal parking';
    else if (txt.includes('light') || txt.includes('batti') || txt.includes('andhera') || txt.includes('dark')) detectedIssue = 'broken streetlight';
    else if (txt.includes('garbage') || txt.includes('kachra') || txt.includes('kuda') || txt.includes('waste')) detectedIssue = 'garbage';
    confidenceScore = 0.95; // High confidence for NLP
  }
  
  // 2. Fetch Geospatial Context (POIs)
  const poiContext = await fetchPoiContext(lat, lng);
  
  // 3. Synthesize with LLM (Simulated Gemini Vision / OpenAI)
  // The LLM evaluates the YOLO detection + POI Context to assign Priority and Department.
  
  let priorityScore = 30; // base score
  let department = 'Public Works';
  let repairEstimate = '$500, 3 days';
  let dangerProbability = Math.floor(Math.random() * 40) + 20; // 20-60% base
  let preventiveMaintenance = 'Routine inspection and cleaning.';
  
  // LLM Reasoning Simulation
  if (detectedIssue === 'pothole') {
    department = 'Dept of Transportation';
    repairEstimate = '$800, 2 days';
    dangerProbability += 30; // Up to 90%
    preventiveMaintenance = 'Fill with cold patch asphalt within 2 months to prevent major road degradation and vehicle damage.';
  } else if (detectedIssue === 'garbage') {
    department = 'Sanitation';
    repairEstimate = '$200, 1 day';
    dangerProbability += 10;
    preventiveMaintenance = 'Dispatch community cleaning crew and install permanent waste bins to reduce localized littering.';
  } else if (detectedIssue === 'water leakage') {
    department = 'Water & Power';
    repairEstimate = '$2000, 1 week';
    dangerProbability += 40; // Up to 100%
    preventiveMaintenance = 'Immediate valve shutdown and main pipe replacement to prevent sinkhole formation.';
  } else if (detectedIssue === 'illegal parking') {
    department = 'Traffic Enforcement';
    repairEstimate = 'No cost (Citation issuance)';
    preventiveMaintenance = 'Install bollards or paint red zones to deter future illegal parking blockages.';
  } else if (detectedIssue === 'fallen tree') {
    department = 'Parks & Recreation';
    repairEstimate = '$1500, 2 days';
    dangerProbability += 35;
    preventiveMaintenance = 'Clear debris immediately. Assess adjacent trees for root rot to prevent secondary falls.';
  } else if (detectedIssue === 'broken streetlight') {
    department = 'Electrical';
    repairEstimate = '$350, 1 day';
    dangerProbability += 25;
    preventiveMaintenance = 'Upgrade to smart LED fixture with telemetry sensors for automated fault detection.';
  }

  // Cap probability at 99%
  dangerProbability = Math.min(dangerProbability, 99);

  // Increase score based on POI
  const hasCriticalPoi = poiContext.poiNearby.some(poi => poi.impact === 'CRITICAL');
  if (hasCriticalPoi) priorityScore += 50;
  else if (poiContext.poiNearby.length > 0) priorityScore += 25;

  let priorityLevel = 'LOW';
  if (priorityScore > 75) priorityLevel = 'CRITICAL';
  else if (priorityScore > 50) priorityLevel = 'HIGH';
  else if (priorityScore > 30) priorityLevel = 'MEDIUM';

  return {
    category: detectedIssue.charAt(0).toUpperCase() + detectedIssue.slice(1),
    severity: Math.ceil(priorityScore / 10), // 1-10 mapped
    priority: priorityLevel,
    priorityScore,
    department,
    repairEstimate,
    dangerProbability,
    preventiveMaintenance,
    poiContext,
    isDuplicate: false,
    confidenceScore: confidenceScore,
    aiAnalysisNotes: base64Image ? `YOLOv11 detected ${detectedIssue}. LLM assigned ${priorityLevel} priority (Score: ${priorityScore}) and routed to ${department} due to nearby POIs.` : `Voice AI categorized issue as ${detectedIssue}. Assigned ${priorityLevel} priority (Score: ${priorityScore}) and routed to ${department}.`
  };
};
