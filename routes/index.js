import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import { postNew } from '../controllers/UsersController';

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

router.post('/postNew', async (req, res) => {
  res.json(await postNew(req, res));
});

// Export router
export default router;
