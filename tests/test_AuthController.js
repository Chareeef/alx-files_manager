import chai from 'chai';
import chaiHttp from 'chai-http';
import sha1 from 'sha1';
import app from '../server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import waitConnection from './wait_connection.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('test AuthController routes', () => {
  let server;
  let userId;

  before((done) => {
    // Start listening
    server = app.listen(3000, async () => {
      // Wait for connection
      await waitConnection();

      // Feed our Test Database (Change DB_DATABASE environmemt var)
      const { insertedId } = await dbClient.insertOne('users', { email: 'ycok@myorg.com', password: sha1('mlop789') });
      userId = insertedId.toString();

      done();
    });
  });

  after(async () => {
    // Clear database
    await dbClient.deleteMany('users', {});

    // Stop listening
    server.close();
  });

  it('test GET /connect with correct credentials', async () => {
    const auth64 = Buffer.from('ycok@myorg.com:mlop789').toString('base64');
    const res = await chai.request(server)
      .get('/connect')
      .set('Authorization', `Basic ${auth64}`);

    expect(res).to.have.status(200);

    expect(Object.keys(res.body).includes('token')).to.be.true;

    const key = `auth_${res.body.token}`;
    expect(await redisClient.get(key)).to.equal(userId);
  });

  it('test GET /connect with wrong email', async () => {
    const auth64 = Buffer.from('okyc@orgocop.com:mlop789').toString('base64');
    const res = await chai.request(server)
      .get('/connect')
      .set('Authorization', `Basic ${auth64}`);

    expect(res).to.have.status(401);
    expect(res.body).to.eql({ error: 'Unauthorized' });
  });

  it('test GET /connect with wrong password', async () => {
    const auth64 = Buffer.from('ycok@myorg.com:mlop987').toString('base64');
    const res = await chai.request(server)
      .get('/connect')
      .set('Authorization', `Basic ${auth64}`);

    expect(res).to.have.status(401);
    expect(res.body).to.eql({ error: 'Unauthorized' });
  });

  it('test GET /disconnect', async () => {
    // Create token by making a connection
    const auth64 = Buffer.from('ycok@myorg.com:mlop789').toString('base64');
    const resConnect = await chai.request(server)
      .get('/connect')
      .set('Authorization', `Basic ${auth64}`);

    // Verify that a token was stored
    expect(resConnect).to.have.status(200);
    const { token } = resConnect.body;
    const key = `auth_${token}`;
    expect(await redisClient.get(key)).to.equal(userId);

    // Disconnect
    const resDisconnect = await chai.request(server)
      .get('/disconnect')
      .set('X-Token', `${token}`);

    // Verify token was deleted
    expect(resDisconnect).to.have.status(204);
    expect(await redisClient.get(key)).to.equal(null);
  });
});
