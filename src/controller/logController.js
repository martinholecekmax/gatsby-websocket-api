const stripColor = require('strip-color');
const socket = require('../services/socket').getInstance();
const { models } = require('../models');

const sendDataLog = async (buildId, data) => {
  let strippedData = stripColor(data.toString())
    .split('\n')
    .filter((line) => line.trim() !== '');
  for (let i = 0; i < strippedData.length; i++) {
    const message = strippedData[i];
    const logs = [];
    if (message && message.trim() !== '') {
      try {
        const log = await new models.Log({
          timestamp: new Date(),
          message: message.trim(),
          command: 'Gatsby',
          sourceStream: 'STDOUT',
          buildId: buildId,
        }).save();
        logs.push(log);
      } catch (error) {
        console.log(error);
      }
    }
    if (logs.length > 0) {
      socket.emit('build-logs', {
        id: buildId,
        payload: logs,
      });
    }
  }
};

module.exports = {
  sendDataLog,
};
