import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';

// Create router
const router = express.Router();

// 'GET /status' route
router.get('/status', (req, res) => {
  res.json(getStatus());
});

// 'GET /stats' route
router.get('/stats', async (req, res) => {
  res.json(await getStats());
});

router.post('/postNew');

// Export router
export default router;
