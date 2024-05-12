import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import chai from 'chai';
import chaiHttp from 'chai-http';
import waitConnection from './wait_connection.js';
import sha1 from 'sha1';

const expect = chai.expect;
chai.use(chaiHttp);


describe('Test FilesController routes', () => {
  
  let server;
  let userId;
  let token;

  before((done) => {

    // Start listening
    server = app.listen(3000, async () => {

      // Wait for connection
      await waitConnection();

      // Create user
      const { insertedId } = await dbClient.insertOne('users', { email: 'ycok@myorg.com', password: sha1('mlop789') });
      userId = insertedId

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

  it('Test POST /files with missing name', async () => {

    const res = await chai.request(server)
      .post('/files')
      .set('X-Token', `${token}`)
      .set('Content-Type', 'application/json')
      .send({ type: 'file', data: Buffer.from('Heey').toString('base64') });

    expect(res).to.have.status(400);
    expect(res.body).to.eql({ error: 'Missing name' });
  });
});
