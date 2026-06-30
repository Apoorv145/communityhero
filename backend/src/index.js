import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import issueRoutes from './routes/issues.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/issues', issueRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Civic Management API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
