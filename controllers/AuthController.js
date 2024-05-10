import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';

export async function getConnected(req, res) {
  const authBase64 = req.headers['Authorization'];
  if (!authBase64) {
    return res.status(401).json({ 'error': 'Unauthorized' });
  }

  // Decode and parse the Base 64 value
  const decodedAuth = Buffer.from(authBase64, 'base64').toString('utf-8');
  const [userEmail, userPassword] = decodedAuth.split(':');

  const user = dbClient.findOne('users', { email: userEmail })

  // Check credentials
  if (!user || sha1(userPassword) !== user.password) {
    return res.status(401).json({ 'error': 'Unauthorized' });
  }
  console.log('USER:', user);

  // Set a 24h token with redisClient
  const token = uuidv4();
  redisClient.set(`auth_${token}`, user._id, 24 * 3600);
  return res.json({ 'token': token });
}
