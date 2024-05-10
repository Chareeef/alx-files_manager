import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '27017';
    const dbName = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;
    this.client = new MongoClient(url, { useUnifiedTopology: true });

    this.connected = false;
    this.client.connect((err) => {
      if (err) {
        console.log(err.message);
      } else {
        this.connected = true;
        this.db = this.client.db(dbName);
      }
    });
  }

  // Check if the redis client is connected
  isAlive() {
    return this.connected;
  }

  // Return the number of documents in `users` collection
  async nbUsers() {
    return this.db.collection('users').countDocuments({});
  }

  // Return the number of documents in `files` collection
  async nbFiles() {
    return this.db.collection('files').countDocuments({});
  }

  // Insert documents into a collection
  async insert(coll, ...docs) {
    this.db.collection(coll).insertMany(docs);
  }

  async insertOne(coll, data) {
    return this.db.collection(coll).insertOne(data);
  }

  async getUser(email) {
    const user = this.db.collection('users').find({ email }).toArray();
    if (!user.length) {
      return null;
    }
    return user[0];
  }

  async userExists(email) {
    const user = await this.getUser(email);
    if (!user) {
      return false;
    }
    return true;
  }
}

// Export a DBClient instance
const dbClient = new DBClient();

export default dbClient;
