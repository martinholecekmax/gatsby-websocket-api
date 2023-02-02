const Redis = require('ioredis');
const redis = new Redis({
  port: 6379,
  host: '127.0.0.1',
});

redis
  .ping()
  .then(console.log('Redis connection successful'))
  .catch((err) => {
    console.log(`Error connecting to Redis: ${err}`);
  });

console.log('__dirname', __dirname);
