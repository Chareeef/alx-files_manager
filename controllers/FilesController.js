import dbClient from '../utils/db'
import redisClient from '../utils/redis';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

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

  // The name
  const name = req.body.name;
  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }

  // The type
  const type = req.body.type;
  if (!type || !(['folder', 'file', 'image'].includes(type))) {
    return res.status(400).json({ error: 'Missing type' });
  }

  // The data
  const data = req.body.data;
  if (!data && type !== 'folder') {
    return res.status(400).json({ error: 'Missing data' });
  }

  // The Parent ID (optional)
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

  // Is it public? (optional)
  const isPublic = req.body.isPublic ? req.body.isPublic : false;

  // Let's upload

  // If it is a folder
  if (type === 'folder') {

    // Create folder's MongoDB document
    const folder = { userId, name, type, isPublic, parentId };

    // Insert to DB
    await dbClient.insertOne('files', folder);

    // Return response
    return res.status(201).json({ id: folder._id, userId, name, type, isPublic, parentId });

  } else { // Image or file

    // Create directory if not exists
    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    await promisify(fs.mkdir)(folderPath, { recursive: true });

    // Write to file
    const localPath = `${folderPath}/${uuidv4()}`;
    await promisify(fs.writeFile)(localPath, Buffer.from(data, 'base64').toString('utf-8'));

    // Create file's MongoDB document
    const file = { userId, name, type, isPublic, parentId, localPath};

    // Insert to DB
    await dbClient.insertOne('files', file);

    // Return response
    return res.status(201).json({ id: file._id, userId, name, type, isPublic, parentId });
  }
}
