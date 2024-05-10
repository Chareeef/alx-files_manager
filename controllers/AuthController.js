import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export async function getConnect(req, res) {
  // Retrieve 'Authorization' Basic Auth string
  const authBase64 = req.headers.authorization.slice(6);
  if (!authBase64) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Decode and parse the Base 64 value
  const decodedAuth = Buffer.from(authBase64, 'base64').toString('utf-8');
  const [userEmail, userPassword] = decodedAuth.split(':');

  // Retrieve user
  const user = await dbClient.findOne('users', { email: userEmail });

  // Check credentials
  if (!user || sha1(userPassword) !== user.password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set a 24h token with redisClient
  const token = uuidv4();
  redisClient.set(`auth_${token}`, user._id.toString(), 24 * 3600);
  return res.json({ token });
}

export async function disconnect(req, res) {
  const token = req.headers['x-token'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = redisClient.get(`auth_${token}`);
  const user = dbClient.findOne('users', { _id: new ObjectId(userId) });
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  await redisClient.del(`auth_${token}`);
  return res.status(204);
}
