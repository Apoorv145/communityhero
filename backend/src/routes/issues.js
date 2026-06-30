import express from 'express';
import { getIssues, createIssue, updateIssue } from '../controllers/issueController.js';

const router = express.Router();

// GET all issues (supports spatial filtering if implemented)
router.get('/', getIssues);

// POST a new issue (with simulated AI analysis for now)
router.post('/', createIssue);

// PATCH update an issue (e.g., status updates by officials)
router.patch('/:id', updateIssue);

export default router;
