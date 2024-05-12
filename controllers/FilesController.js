import fs from 'fs';
import { ObjectId } from 'mongodb';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

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
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Missing name' });
  }

  // The type
  const { type } = req.body;
  if (!type || !['folder', 'file', 'image'].includes(type)) {
    return res.status(400).json({ error: 'Missing type' });
  }

  // The data
  const { data } = req.body;
  if (!data && type !== 'folder') {
    return res.status(400).json({ error: 'Missing data' });
  }

  // The Parent ID (optional)
  const parentId = req.body.parentId ? req.body.parentId : 0;
  if (parentId !== 0) {
    // Check if the parent folder exists
    const parentFolder = await dbClient.findOne('files', {
      _id: new ObjectId(parentId),
    });
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
    const folder = {
      userId,
      name,
      type,
      isPublic,
      parentId,
    };

    // Insert to DB
    await dbClient.insertOne('files', folder);

    // Return response
    return res.status(201).json({
      id: folder._id,
      userId,
      name,
      type,
      isPublic,
      parentId,
    });
  } // Image or file

  // Create directory if not exists
  const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
  await promisify(fs.mkdir)(folderPath, { recursive: true });

  // Write to file
  const localPath = `${folderPath}/${uuidv4()}`;
  await promisify(fs.writeFile)(
    localPath,
    Buffer.from(data, 'base64').toString('utf-8')
  );

  // Create file's MongoDB document
  const file = {
    userId,
    name,
    type,
    isPublic,
    parentId,
    localPath,
  };

  // Insert to DB
  await dbClient.insertOne('files', file);

  // Return response
  return res.status(201).json({
    id: file._id,
    userId,
    name,
    type,
    isPublic,
    parentId,
  });
}

// Return a file by file._id
export async function getShow(req, res) {
  // Retrieve token from 'X-Token' header
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check token
  const userId = await redisClient.get(`auth_${token}`);
  let user;
  try {
    user = await dbClient.findOne('users', { _id: new ObjectId(userId) });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Retrieve requested id
  const fileId = req.params.id;

  // Search file in DB
  const file = await dbClient.findOne('files', {
    _id: new ObjectId(fileId),
    userId: user._id.toString(),
  });

  // Ensure file's existence
  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Return response
  return res.status(200).json({
    id: file._id.toString(),
    userId: file.userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  });
}

export async function getIndex(req, res) {
  // Retrieve token from 'X-Token' header
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check token
  const userId = await redisClient.get(`auth_${token}`);
  let user;
  try {
    user = await dbClient.findOne('users', { _id: new ObjectId(userId) });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // get parentId
  const { parentId, page } = req.query;
  const pageNum = page || 0;
  const filesCollection = dbClient.db.collection('files');
  let matchQuery;

  if (!parentId) {
    matchQuery = { userId: user._id.toString() };
  } else {
    try {
      matchQuery = {
        userId: user._id.toString(),
        parentId: parentId.toString(),
      };
    } catch (err) {
      return res.json([]);
    }
  }

  // Filter files, paginate, and return results
  const files = await filesCollection
    .aggregate([
      { $match: matchQuery },
      { $skip: pageNum * 20 },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          id: '$_id',
          userId: '$userId',
          name: '$name',
          type: '$type',
          isPublic: '$isPublic',
          parentId: {
            $cond: {
              if: { $eq: ['$parentId', '0'] },
              then: 0,
              else: '$parentId',
            },
          },
        },
      },
    ])
    .toArray();

  return res.status(200).json(files);
}

export async function publish(req, res) {
  // PUT /files/:id/publish

  // Retrieve token from 'X-Token' header
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check token
  const userId = await redisClient.get(`auth_${token}`);
  let user;
  try {
    user = await dbClient.findOne('users', { _id: new ObjectId(userId) });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Retrieve requested id
  const fileId = req.params.id;

  // Search file in DB
  const file = await dbClient.findOne('files', {
    _id: new ObjectId(fileId),
    userId: user._id.toString(),
  });

  // Ensure file's existence
  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }

  dbClient.db.collection('files').updateOne(
    {
      _id: new ObjectId(fileId),
      userId: user._id.toString(),
    },
    { $set: { isPublic: true } }
  );
  const updatedFile = await dbClient.findOne('files', {
    _id: new ObjectId(fileId),
    userId: user._id.toString(),
  });

  res.status(200).json({
    fileId,
    userId,
    name: updatedFile.name,
    type: updatedFile.type,
    isPublic: true,
    parentId:
      updatedFile.parentId === '0' ? 0 : updatedFile.parentId.toString(),
  });
}

export async function unpublish(req, res) {
  // PUT /files/:id/unpublish

  // Retrieve token from 'X-Token' header
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check token
  const userId = await redisClient.get(`auth_${token}`);
  let user;
  try {
    user = await dbClient.findOne('users', { _id: new ObjectId(userId) });
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Retrieve requested id
  const fileId = req.params.id;

  // Search file in DB
  const file = await dbClient.findOne('files', {
    _id: new ObjectId(fileId),
    userId: user._id.toString(),
  });

  // Ensure file's existence
  if (!file) {
    return res.status(404).json({ error: 'Not found' });
  }

  dbClient.db.collection('files').updateOne(
    {
      _id: new ObjectId(fileId),
      userId: user._id.toString(),
    },
    { $set: { isPublic: false } }
  );
  const updatedFile = await dbClient.findOne('files', {
    _id: new ObjectId(fileId),
    userId: user._id.toString(),
  });

  res.status(200).json({
    fileId,
    userId,
    name: updatedFile.name,
    type: updatedFile.type,
    isPublic: false,
    parentId:
      updatedFile.parentId === '0' ? 0 : updatedFile.parentId.toString(),
  });
}