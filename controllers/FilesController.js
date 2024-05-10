import dbClient from '../utils/db'
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';

export async function postUpload(req, res) {

  // Retrieve token from 'X-Token' header
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check token
  const userId = await redisClient.get(`auth_${token}`);
  const user = await dbClient.findOne('users', { _id: new ObjectId(userId) });
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Retrieve tha file's informations from req.body and handlr any missing one
  const name = req.body.name;
  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }

  const type = req.body.type;
  if (!type || !(['folder', 'file', 'image'].includes(type]))) {
    return res.status(400).json({ error: 'Missing type' });
  }

  const data = req.body.data;
  if (!data && type !== 'folder') {
    return res.status(400).json({ error: 'Missing data' });
  }

  const parentId = req.body.parentId ? req.body.parentId : 0;
  if (parentId !== 0) {

    // Check if the parent folder exists
    const parentFolder = dbClient.findOne('files', { _id: new ObjectId(parentId) });
    if (!parentFolder) {
      return res.status(400).json({ error: 'Parent not found' });
    }

    // Ensure it is a folder
    if (parentFolder.type !== 'folder') {
      return res.status(400).json({ error: 'Parent is not a folder' });
    }
  }

  const isPublic = req.body.isPublic ? req.body.isPublic : false;
}
