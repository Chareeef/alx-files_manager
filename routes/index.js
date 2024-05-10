import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import { getConnect } from '../controllers/AuthController';
import { postNew, getMe } from '../controllers/UsersController';
import { disconnect } from '../controllers/AuthController';

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

// 'POST /users' route
router.post('/users', async (req, res) => {
  await postNew(req, res);
});

// 'GET /users/me' route
router.get('/users/me', async (req, res) => {
  await getMe(req, res);
});

// 'GET /connect' route
router.get('/connect', async (req, res) => {
  await getConnect(req, res);
});

// 'GET /disconnect' route
router.get('/disconnect', async (req, res) => {
  await disconnect(req, res);
});

// Export router
export default router;
