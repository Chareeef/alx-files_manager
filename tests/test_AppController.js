import app from '../server';
import chai from 'chai';
import chaiHttp from 'chai-http';

const expect = chai.expect;
chai.use(chaiHttp);

describe('Test AppController routes', () => {
  
  let server;

  // Start listening
  before((done) => {
    server = app.listen(3000, () => {
      done();
    });
  });

  // Stop listening
  after(() => {
    server.close();
  });

  it('Check response of GET /status', async () => {
    const res = await chai.request(server).get('/status');

    expect(res).to.have.status(200);
    expect(res.body).to.eql({ "redis": true, "db": true })
  });
});
