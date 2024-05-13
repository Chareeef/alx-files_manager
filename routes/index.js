import express from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import { getConnect, disconnect } from '../controllers/AuthController';
import { postNew, getMe } from '../controllers/UsersController';
import {
  postUpload, getShow, getIndex, publish, unpublish, getFile,
} from '../controllers/FilesController';

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

// 'POST /files' route
router.post('/files', async (req, res) => {
  await postUpload(req, res);
});

// 'GET /files/:id' route
router.get('/files/:id', async (req, res) => {
  await getShow(req, res);
});

// 'GET /files' route
router.get('/files', async (req, res) => {
  await getIndex(req, res);
});

// 'PUT /files/:id/publish' route
router.put('/files/:id/publish', async (req, res) => {
  await publish(req, res);
});

// 'PUT /files/:id/unpublish' route
router.put('/files/:id/unpublish', async (req, res) => {
  await unpublish(req, res);
});

// 'GET /files/:id/data' route
router.get('/files/:id/data', async (req, res) => {
  await getFile(req, res);
});

// Export router
export default router;
