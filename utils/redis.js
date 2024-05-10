import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.isConnected = false;

    this.client
      .on('error', (err) => console.log(err.message));
  }

  // Check if the redis client is connected
  isAlive() {
    return this.client.connected;
  }

  // Get a key's value
  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);

    try {
      return await getAsync(key);
    } catch (err) {
      return null;
    }
  }

  // Set a key-value pair with expiration time
  async set(key, value, exTime) {
    const setAsync = promisify(this.client.setex).bind(this.client);
    await setAsync(key, exTime, value);
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
