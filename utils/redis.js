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

  // Check if the redis client is connected
  isAlive() {
    return this.isConnected;
  }

  // Get a key's value
  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);

    try {
      return await getAsync(key);
    } catch (err) {
      return null
    }
  }

  // Set a key-value pair with expiration time
  async set(key, value, ex_time) {
    const setAsync = promisify(this.client.setex).bind(this.client);
    await setAsync(key, ex_time, value);
  }

  // Delete a key
  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client);

    try {
      await delAsync(key);
    } catch (err) {
      console.log(err.message);
    }
  }
}

// Export a RedisClient instance
const redisClient = new RedisClient();
export default redisClient;
