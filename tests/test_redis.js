import redisClient from '../utils/redis';

(async () => {
  console.log(true, redisClient.isAlive());
  console.log(null, await redisClient.get('myKey'));
  console.log(true, redisClient.isAlive());
  await redisClient.set('myKey', 12, 3);
  console.log(12, await redisClient.get('myKey'));

  await redisClient.set('key', 89, 777);
  console.log(89, await redisClient.get('key'));
  await redisClient.del('key');
  console.log(null, await redisClient.get('key'));
  await redisClient.del('key');

  setTimeout(async () => {
    console.log(null, await redisClient.get('myKey'));
  }, 1000 * 4);
})();
