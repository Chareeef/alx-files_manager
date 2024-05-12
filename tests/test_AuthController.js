import app from '../server';
import dbClient from '../utils/db';
import chai from 'chai';
import chaiHttp from 'chai-http';
import waitConnection from './wait_connection.js';
import sha1 from 'sha1';

const expect = chai.expect;
chai.use(chaiHttp);


describe('Test AuthController routes', () => {
  
  let server;

  before((done) => {

    // Start listening
    server = app.listen(3000, async () => {

      // Wait for connection
      await waitConnection();

      // Feed our Test Database (Change DB_DATABASE environmemt var)
      await dbClient.insertOne('users', { email: 'ycok@myorg.com', password: sha1('mlop789') });

      done();
    });

  });

  after(async () => {

    // Clear database
    await dbClient.deleteMany('users', {});

    // Stop listening
    server.close();
  });

  it('Test GET /connect with correct credentials', async () => {

    const auth64 = Buffer.from('ycok@myorg.com:mlop789').toString('base64');
    const res = await chai.request(server)
      .get('/connect')
      .set('Authorization', `Basic ${auth64}`);

    expect(res).to.have.status(200);
    expect(Object.keys(res.body).includes('token')).to.be.true;
  });

  it('Test GET /connect with wrong email', async () => {

    const auth64 = Buffer.from('okyc@orgocop.com:mlop789').toString('base64');
    const res = await chai.request(server)
      .get('/connect')
      .set('Authorization', `Basic ${auth64}`);

    expect(res).to.have.status(401);
    expect(res.body).to.eql({ error: 'Unauthorized' });
  });

  it('Test GET /connect with wrong password', async () => {

    const auth64 = Buffer.from('ycok@myorg.com:mlop987').toString('base64');
    const res = await chai.request(server)
      .get('/connect')
      .set('Authorization', `Basic ${auth64}`);

    expect(res).to.have.status(401);
    expect(res.body).to.eql({ error: 'Unauthorized' });
  });
});
