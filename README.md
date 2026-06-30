# 🦸 Community Hero

<div align="center">
  <img src="frontend/public/logo.png" alt="Community Hero Logo" width="200"/>
</div>

<br/>

**Community Hero** is an AI-powered Civic Management Platform designed to streamline the reporting, tracking, and resolution of civic issues (like potholes, water leaks, and broken streetlights). 

It empowers citizens to easily report problems using **Voice AI**, and provides city officials with a **Digital Twin Simulator** to manage infrastructure efficiently.

### 🔗 Live Links
- **Live Application:** [https://communityhero-frontend.vercel.app](https://communityhero-frontend.vercel.app)
- **Backend API:** [https://communityhero-kv3d.onrender.com](https://communityhero-kv3d.onrender.com)

---

## ✨ Features

- **🎙️ AI Voice Reporting:** Citizens can report issues simply by speaking into their device. Google's Gemini AI automatically transcribes the audio, translates it from Hindi (or other languages) to English, extracts the exact location, and categorizes the issue.
- **🗺️ Interactive 3D Map:** A live, dynamic map showing all reported issues in real-time using custom categorization markers.
- **🔥 Heatmaps & Wards:** City officials can view infrastructure heatmaps to identify problem zones and track the health scores of different city wards.
- **🧬 Digital Twin Simulator:** A powerful simulation engine that allows officials to click on a root infrastructure issue and see the cascading effects (which other nearby issues will automatically be resolved if this root issue is fixed).
- **🏆 Leaderboard:** Gamified tracking of Ward Health, ranking zones based on cleanliness, road quality, and response times.

## 🛠️ Technology Stack

- **Frontend:** React, Vite, Tailwind CSS, Leaflet (3D Maps), Lucide-React (Icons)
- **Backend:** Node.js, Express.js, Prisma ORM
- **Database:** PostgreSQL (hosted on Supabase)
- **Authentication:** Firebase Auth
- **AI Integration:** Google Gemini AI (Multimodal Voice Processing & Data Extraction)
- **Deployment:** Vercel (Frontend), Render (Backend)

---

## 🚀 Getting Started

If you want to run this project locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/Apoorv145/communityhero.git
   cd communityhero
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   # Add your .env file with DATABASE_URL and GEMINI_API_KEY
   npx prisma generate
   npm start
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   # Add your .env.local with VITE_API_URL and Firebase keys
   npm run dev
   ```

## 📜 License
This project was built for a hackathon/competition submission.
