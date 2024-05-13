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
  let userId, userId2;
  let folderId, privateFolderId;
  let fileId, filePath, fileData;
  let privateFileId, privateFilePath, privateFileData;
  let imageId, imagePath, imageData;
  let token, token2;

  before((done) => {
    // Start listening
    server = app.listen(3000, async () => {
      // Wait for connection
      await waitConnection();

      // Create user
      userId = (await dbClient.insertOne('users', { email: 'ycok@myorg.com', password: sha1('mlop789') })).insertedId;
      userId2 = (await dbClient.insertOne('users', { email: 'okyc@myorg.com', password: sha1('okli534') })).insertedId;

      // Create disk directory if not exists
      const dirPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      await promisify(fs.mkdir)(dirPath, { recursive: true });

      // Create public folder owned by the first user
      folderId = (await dbClient.insertOne('files',
        { userId, name: 'documents', type: 'folder', isPublic: true, parentId: '0' })).insertedId;

      // Create private folder owned by the first user
      privateFolderId = (await dbClient.insertOne('files',
        { userId, name: 'secret_documents', type: 'folder', isPublic: false, parentId: '0' })).insertedId;

      // Create public file owned by the first user
      filePath = `${dirPath}/${uuidv4()}`;
      fileData = { happy: true };
      await promisify(fs.writeFile)(filePath, JSON.stringify(fileData));
      fileId = (await dbClient.insertOne('files',
        { userId, name: 'mood.json', type: 'file', isPublic: true, parentId: folderId, localPath: filePath })).insertedId;

      // Create private file owned by the first user
      privateFilePath= `${dirPath}/${uuidv4()}`;
      privateFileData = 'Top secret';
      await promisify(fs.writeFile)(privateFilePath, privateFileData);
      privateFileId = (await dbClient.insertOne('files',
        { userId, name: 'note.txt', type: 'file', isPublic: false, parentId: folderId, localPath: privateFilePath })).insertedId;

      // Create public image owned by th first user
      imagePath = `${dirPath}/${uuidv4()}`;
      imageData = Buffer.from('^hmkkht*^$#');
      await promisify(fs.writeFile)(imagePath, imageData);
      imageId = (await dbClient.insertOne('files',
        { userId, name: 'cat.jpg', type: 'image', isPublic: true, parentId: '0', localPath: imagePath })).insertedId;

      // Get an authentication token for the first user
      const auth64 = Buffer.from('ycok@myorg.com:mlop789').toString('base64');
      const resConnect = await chai.request(server)
        .get('/connect')
        .set('Authorization', `Basic ${auth64}`);

      token = resConnect.body.token;

      // Get an authentication token for the second user
      const secondAuth64 = Buffer.from('okyc@myorg.com:okli534').toString('base64');
      const secondResConnect = await chai.request(server)
        .get('/connect')
        .set('Authorization', `Basic ${secondAuth64}`);

      token2 = secondResConnect.body.token;

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

  describe('Test GET /files/:id/data', async () => {

    it('Test with wrong file id', async () => {
      const res = await chai.request(server)
        .get(`/files/45688876557/data`)

      expect(res).to.have.status(404);
      expect(res.body).to.eql({ error: 'Not found' });
    });

    it('Test getting private file without authentication', async () => {
      const res = await chai.request(server)
        .get(`/files/${privateFileId}/data`);

      expect(res).to.have.status(404);
      expect(res.body).to.eql({ error: 'Not found' });
    });

    it('Test getting private file with wrong authentication', async () => {
      const res = await chai.request(server)
        .get(`/files/${privateFileId}/data`)
        .set('X-Token', `${token2}`)

      expect(res).to.have.status(404);
      expect(res.body).to.eql({ error: 'Not found' });
    });

    it('Test getting private folder without authentication', async () => {
      const res = await chai.request(server)
        .get(`/files/${privateFolderId}/data`);

      expect(res).to.have.status(404);
      expect(res.body).to.eql({ error: 'Not found' });
    });

    it('Test getting private folder with wrong authentication', async () => {
      const res = await chai.request(server)
        .get(`/files/${privateFolderId}/data`)
        .set('X-Token', `${token2}`);

      expect(res).to.have.status(404);
      expect(res.body).to.eql({ error: 'Not found' });
    });

    it('Test getting private folder', async () => {
      const res = await chai.request(server)
        .get(`/files/${privateFolderId}/data`)
        .set('X-Token', `${token}`);

      expect(res).to.have.status(400);
      expect(res.body).to.eql({ error: 'A folder doesn\'t have content' });
    });

    it('Test getting public folder', async () => {
      const res = await chai.request(server)
        .get(`/files/${folderId}/data`)
        .set('X-Token', `${token}`);

      expect(res).to.have.status(400);
      expect(res.body).to.eql({ error: 'A folder doesn\'t have content' });
    });

    it('Test getting inexistent file on disk', async () => {

      // Insert file document with wrong localPath
      const inexistentFileId = (await dbClient.insertOne('files', {
        userId, name: 'no-one.txt', type: 'file', isPublic: true, parentId: '0', localPath: '/tmp/files_manager/wrong'
        }))
        .insertedId;

      const res = await chai.request(server)
        .get(`/files/${inexistentFileId}/data`);

      expect(res).to.have.status(404);
      expect(res.body).to.eql({ error: 'Not found' });

      await dbClient.deleteOne('files', { _id: inexistentFileId });
    });

    it('Test getting inexistent image on disk', async () => {

      // Insert image document with wrong localPath
      const inexistentImageId = (await dbClient.insertOne('files', {
        userId, name: 'no-pic.png', type: 'image', isPublic: true, parentId: '0', localPath: '/tmp/files_manager/wrong'
        }))
        .insertedId;

      const res = await chai.request(server)
        .get(`/files/${inexistentImageId}/data`);

      expect(res).to.have.status(404);
      expect(res.body).to.eql({ error: 'Not found' });

      await dbClient.deleteOne('files', { _id: inexistentImageId });
    });

    it('Test getting public JSON file', async () => {
      const res = await chai.request(server)
        .get(`/files/${fileId}/data`)

      expect(res).to.have.status(200);
      expect(res.headers['content-type']).to.equal('application/json; charset=utf-8');
      expect(res.body).to.eql(fileData);
    });

    it('Test getting private plain text file with correct authentication', async () => {
      const res = await chai.request(server)
        .get(`/files/${privateFileId}/data`)
        .set('X-Token', `${token}`)

      expect(res).to.have.status(200);
      expect(res.headers['content-type']).to.equal('text/plain; charset=utf-8');
      expect(res.text).to.equal(privateFileData);
    });

    it('Test getting public image', async () => {
      const res = await chai.request(server)
        .get(`/files/${imageId}/data`)

      expect(res).to.have.status(200);
      expect(res.headers['content-type']).to.equal('image/jpeg');
      expect(res.body).to.eql(imageData);
    });
  });
});
