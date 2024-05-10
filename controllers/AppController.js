import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export function getStatus() {
  return { 'redis': redisClient.isAlive(), 'db': dbClient.isAlive() };
}
