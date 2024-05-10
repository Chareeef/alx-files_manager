import { MongoClient } from 'mongodb';

class DBClient {

  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const dbName = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}/${dbName}`;
    this.client = new MongoClient(url);

    this.client.connect();
  //  this.db = this.client.db(dbName);
  }

  // Check if the redis client is connected
  isAlive() {
    return this.client.connected;
  }

}

// Export a DBClient instance
const dbClient = new DBClient();

export default dbClient;
