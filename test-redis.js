const Redis = require('ioredis');
const redis = new Redis({
  port: 6379,
  host: '127.0.0.1',
});

redis
  .ping()
  .then(console.log)
  .catch((err) => {
    console.log(`Error connecting to Redis: ${err}`);
  });

console.log('redis', redis.status);
