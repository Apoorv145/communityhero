import { analyzeIssue } from '../services/aiService.js';
import { prisma } from '../lib/prisma.js';

const getOrCreateDefaultUser = async () => {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        firebaseUid: 'mock-uid-1234',
        name: 'Alex Citizen',
        email: 'alex@example.com',
      }
    });
  }
  return user;
};

export const getIssues = async (req, res) => {
  try {
    const issues = await prisma.issue.findMany({
      orderBy: { createdAt: 'desc' }
    });
    // Add fake image just for frontend compatibility since we haven't implemented image upload yet
    const mappedIssues = issues.map(i => ({
      ...i,
      img: i.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=300&q=80'
    }));
    res.status(200).json(mappedIssues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createIssue = async (req, res) => {
  try {
    const { title, description, lat, lng, imageBase64 } = req.body;
    
    // Pass coordinates to the pipeline for POI analysis
    const aiAnalysis = await analyzeIssue(imageBase64, description, lat, lng);
    
    const defaultUser = await getOrCreateDefaultUser();

    // Kanpur specific location logic
    const kanpurAreas = ["Mall Road", "Swaroop Nagar", "Kakadeo", "Govind Nagar", "Barra", "Kidwai Nagar"];
    const randomArea = kanpurAreas[Math.floor(Math.random() * kanpurAreas.length)];
    const randomStreetNum = Math.floor(Math.random() * 100) + 1;
    const generatedAddress = `${randomStreetNum} ${randomArea}, Kanpur`;

    // Jitter the coordinates slightly so map markers don't overlap if using default
    const jitter = () => (Math.random() - 0.5) * 0.05; 
    const finalLat = (lat === 26.4499 || lat === 51.505) ? 26.4499 + jitter() : lat;
    const finalLng = (lng === 80.3319 || lng === -0.09) ? 80.3319 + jitter() : lng;

    const newIssue = await prisma.issue.create({
      data: {
        title: title || 'Untitled Issue',
        description: description || '',
        lat: finalLat,
        lng: finalLng,
        address: generatedAddress,
        category: aiAnalysis.category,
        severity: aiAnalysis.severity,
        priority: aiAnalysis.priority,
        priorityScore: aiAnalysis.priorityScore,
        department: aiAnalysis.department,
        repairEstimate: aiAnalysis.repairEstimate,
        dangerProbability: aiAnalysis.dangerProbability,
        preventiveMaintenance: aiAnalysis.preventiveMaintenance,
        poiContext: aiAnalysis.poiContext, // Saved as JSON object natively in Postgres
        status: 'REPORTED',
        isDuplicate: aiAnalysis.isDuplicate,
        reporterId: defaultUser.id,
        imageUrl: null 
      }
    });

    res.status(201).json({ 
      message: 'Issue reported successfully', 
      issue: newIssue, 
      aiNotes: aiAnalysis.aiAnalysisNotes 
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: updates
    });
    
    res.status(200).json(updatedIssue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
