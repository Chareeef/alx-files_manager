import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import { postNew } from '../controllers/UsersController';
import { getConnect } from '../controllers/AuthController';

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

// 'GET /users' route
router.post('/users', async (req, res) => {
  await postNew(req, res);
});

// 'GET /connect' route
router.get('/connect', async (req, res) => {
  await getConnect(req, res);
});

// Export router
export default router;
