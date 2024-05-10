import express from 'express';
import { getStatus } from '../controllers/AppController';

// Create router
const router = express.Router();

// 'GET /status' route
router.get('/status', (req, res) => {
  res.json(getStatus());
});

// Export router
export default router;
