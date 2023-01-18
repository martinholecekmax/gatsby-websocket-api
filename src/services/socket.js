const { Server } = require('socket.io');

// Singleton pattern
class SocketSingleton {
  static io;
  getInstance(server) {
    console.log('Getting socket instance');
    if (!this.io) {
      console.log('Creating new socket');
      this.io = new Server(server, {
        cors: {
          origin: '*',
        },
      });

      this.io.on('connection', (socket) => {
        console.log('User connected', socket.id);
        socket.on('disconnect', () => {
          console.log('User disconnected', socket.id);
        });
      });
    }
    return this.io;
  }
}

module.exports = new SocketSingleton();
