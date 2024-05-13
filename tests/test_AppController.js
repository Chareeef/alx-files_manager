import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../server';
import dbClient from '../utils/db';
import waitConnection from './wait_connection.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('test AppController routes', () => {
  let server;

  before((done) => {
    // Start listening
    server = app.listen(3000, async () => {
      // Wait for connection
      await waitConnection();

      // Feed our Test Database (Change DB_DATABASE environmemt var)
      await dbClient.insertMany('users', [{ name: 'Youssef' }, { name: 'Omar' }]);
      await dbClient.insertMany('files', [{ name: 'image.jpg' }, { name: 'poem.txt' }, { name: 'script.sh' }]);

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

  it('check response of GET /status', async () => {
    const res = await chai.request(server).get('/status');

    expect(res).to.have.status(200);
    expect(res.body).to.eql({ redis: true, db: true });
  });

  it('check response of GET /stats', async () => {
    const res = await chai.request(server).get('/stats');

    expect(res).to.have.status(200);
    expect(res.body).to.eql({ users: 2, files: 3 });
  });
});
