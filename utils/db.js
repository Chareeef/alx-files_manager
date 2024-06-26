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

  // Insert one document into a collection
  async insertOne(coll, doc) {
    return this.db.collection(coll).insertOne(doc);
  }

  // Insert many documents into a collection
  async insertMany(coll, docs) {
    return this.db.collection(coll).insertMany(docs);
  }

  // Find a document inside a collection
  async findOne(coll, filter) {
    return this.db.collection(coll).findOne(filter);
  }

  // Delete many documents from a collection
  async deleteMany(coll, filter) {
    return this.db.collection(coll).deleteMany(filter);
  }

  // Delete one document from a collection
  async deleteOne(coll, filter) {
    return this.db.collection(coll).deleteOne(filter);
  }
}

// Export a DBClient instance
const dbClient = new DBClient();
export default dbClient;
