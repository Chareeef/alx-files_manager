import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.isConnected = false;

    this.client
      .on('error', (err) => console.log(err))
      .on('connect', () => (this.isConnected = true));
  }

  isAlive() {
    return this.isConnected;
  }
}
