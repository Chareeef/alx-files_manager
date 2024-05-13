import chai from 'chai';
import chaiHttp from 'chai-http';
import fs from 'fs';
import sha1 from 'sha1';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import waitConnection from './wait_connection.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('test FilesController routes', () => {

  let server;
  let userId;
  let folderId;
  let fileId;
  let filePath;
  let fileData;
  let imageId;
  let imagePath;
  let imageData;
  let token;

  before((done) => {
    // Start listening
    server = app.listen(3000, async () => {
      // Wait for connection
      await waitConnection();

      // Create user
      userId = (await dbClient.insertOne('users', { email: 'ycok@myorg.com', password: sha1('mlop789') })).insertedId;

      // Create disk directory if not exists
      const dirPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      await promisify(fs.mkdir)(dirPath, { recursive: true });

      // Create folder
      folderId = (await dbClient.insertOne('files',
        { userId, name: 'documents', type: 'folder', isPublic: true, parentId: '0' })).insertedId;

      // Create file
      filePath = `${dirPath}/${uuidv4()}`;
      fileData = 'You are amazing!';
      await promisify(fs.writeFile)(filePath, fileData);
      fileId = (await dbClient.insertOne('files',
        { userId, name: 'note.txt', type: 'file', isPublic: true, parentId: folderId, localePath: filePath })).insertedId;

      // Create image
      imagePath = `${dirPath}/${uuidv4()}`;
      imageData = '^hmkkht*^$#';
      await promisify(fs.writeFile)(imagePath, imageData);
      imageId = (await dbClient.insertOne('files',
        { userId, name: 'cat.jpg', type: 'image', isPublic: true, parentId: '0', localePath: imagePath })).insertedId;

      // Get an authentication token
      const auth64 = Buffer.from('ycok@myorg.com:mlop789').toString('base64');
      const resConnect = await chai.request(server)
        .get('/connect')
        .set('Authorization', `Basic ${auth64}`);

      token = resConnect.body.token;

      done();
    });
  });

  after(async () => {
    // Clear database
    await dbClient.deleteMany('users', {});
    await dbClient.deleteMany('files', {});

    // Stop listening
    server.close();
  });

  describe('Test POST /files', () => {
    it('Test with missing name', async () => {
      const res = await chai.request(server)
        .post('/files')
        .set('X-Token', `${token}`)
        .set('Content-Type', 'application/json')
        .send({ type: 'file', data: Buffer.from('Heey').toString('base64') });

      expect(res).to.have.status(400);
      expect(res.body).to.eql({ error: 'Missing name' });
    });
  });

});
