import { ObjectId } from 'mongodb';
import sha1 from 'sha1';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Create a Bull Queue to welcome users
const userQueue = new Queue('userQueue');

// Create new user
export async function postNew(req, res) {
  const email = req.body ? req.body.email : null;
  const password = req.body ? req.body.password : null;

  // Check that credentials are provided
  if (!email) {
    res.status(400).json({ error: 'Missing email' });
    res.end();
    return;
  }
  if (!password) {
    res.status(400).json({ error: 'Missing password' });
    res.end();
    return;
  }

  // Check if email already exists
  const user = await dbClient.db.collection('users').findOne({ email });
  if (user) {
    res.status(400).json({ error: 'Already exist' });
    res.end();
    return;
  }

  // Insert user
  const insertInfo = await dbClient.db.collection('users').insertOne({
    email,
    password: sha1(password),
  });

  // Get user's id
  const userId = insertInfo.insertedId;

  // Create a job for userQueue
  userQueue.add({ userId });

  // Return response
  res.status(201).json({ id: userId.toString(), email });
}

export async function getMe(req, res) {
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

  // Return user's ID & email
  return res.json({ id: user._id, email: user.email });
}
