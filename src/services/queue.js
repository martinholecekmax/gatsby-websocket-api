const Queue = require("bull");

class BuildQueue {
  static queue;
  getInstance() {
    console.log("Build queue created");
    if (!this.queue) {
      this.queue = new Queue("build", {
        redis: {
          port: process.env.REDIS_PORT,
          host: process.env.REDIS_HOST,
        },
      });
    }
    return this.queue;
  }
}

module.exports = new BuildQueue();
