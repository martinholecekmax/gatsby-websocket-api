const { models } = require('../models');
const socket = require('../services/socket').getInstance();
const { spawn, exec } = require('child_process');
const path = require('path');
const stripColor = require('strip-color');

const buildDirectory = path.join(__dirname, '../../../gatsby-frontend');
const gatsbyCommand = 'gatsby';

const { BUILD_STATUS } = require('../utils/constants');

const sendDataLog = async (buildId, data) => {
  let strippedData = stripColor(data.toString())
    .split('\n')
    .filter((line) => line.trim() !== '');
  for (let i = 0; i < strippedData.length; i++) {
    const message = strippedData[i];
    console.log(`stdout: ${message}`);
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
        payload: {
          data: {
            buildLogCreated: logs,
          },
          type: 'data',
        },
      });
    }
  }
};

let currentBuildProcess = null;
let cancelBuild = false;

const cancelJob = async () => {
  console.log('Cancelling job');
  cancelBuild = true;
  if (currentBuildProcess) {
    currentBuildProcess.kill();
  }
};

const gatsbyClean = async (currentBuildProcess, buildId) => {
  return new Promise((resolve, reject) => {
    currentBuildProcess = spawn(gatsbyCommand, ['clean'], {
      cwd: buildDirectory,
      shell: true,
    });
    currentBuildProcess.stdout.on('data', (data) => {
      sendDataLog(buildId, data);
    });
    currentBuildProcess.stderr.on('data', (data) => {
      sendDataLog(buildId, data);
    });
    currentBuildProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

const gatsbyBuild = async (currentBuildProcess, buildId) => {
  return new Promise((resolve, reject) => {
    currentBuildProcess = spawn(gatsbyCommand, ['build'], {
      cwd: buildDirectory,
      shell: true,
    });
    currentBuildProcess.stdout.on('data', (data) => {
      sendDataLog(buildId, data);
    });
    currentBuildProcess.stderr.on('data', (data) => {
      sendDataLog(buildId, data);
    });
    currentBuildProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

const gatsbyServe = async (currentBuildProcess, buildId) => {
  return new Promise((resolve, reject) => {
    const outputDirectory = 'testing';
    const command = `rm -rf ${outputDirectory} && mkdir ${outputDirectory} && cp -r public/* ${outputDirectory}`;
    currentBuildProcess = exec(command, {
      shell: true,
      cwd: buildDirectory,
    });

    currentBuildProcess.stdout.on('data', (data) => {
      sendDataLog(buildId, data);
    });
    currentBuildProcess.stderr.on('data', (data) => {
      sendDataLog(buildId, data);
    });
    currentBuildProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

const job = async (job, done) => {
  console.log('job data', job.data);
  // Wait for 10 seconds before starting the build
  console.log('Waiting for 10 seconds before starting the build');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const buildId = job.data.id;

  const clearCache = job.data.clearCache;
  const build = await models.Build.findById(buildId);

  if (!build) {
    console.log('Build not found');
    return;
  }

  build.status = BUILD_STATUS.BUILDING;
  build.startedAt = new Date();
  build.jobId = job.id;
  await build.save();
  socket.emit('build-updated', {
    id: buildId,
    payload: {
      data: {
        buildUpdated: build,
      },
      type: 'data',
    },
  });

  console.log('cancelBuild', cancelBuild);
  if (!cancelBuild) {
    if (clearCache) {
      await gatsbyClean(currentBuildProcess, buildId);
      // currentBuildProcess = spawn(gatsbyCommand, ['clean'], {
      //   cwd: buildDirectory,
      //   shell: true,
      // });

      // currentBuildProcess.stdout.on('data', (data) => sendDataLog(buildId, data));
    }
  }

  if (!cancelBuild) {
    await gatsbyBuild(currentBuildProcess, buildId);
  }

  if (!cancelBuild) {
    await gatsbyServe(currentBuildProcess, buildId);
  }

  // currentBuildProcess = spawn(gatsbyCommand, ['build'], {
  //   cwd: buildDirectory,
  //   shell: true,
  // });

  // // currentBuildProcess = spawn('ls', ['-l']);
  // currentBuildProcess.stdout.on('data', (data) => sendDataLog(buildId, data));

  // currentBuildProcess.stderr.on('data', (data) => {
  //   console.error(`stderr: ${data}`);
  //   sendDataLog(buildId, data);
  // });

  // currentBuildProcess.on('close', async (code) => {
  //   if (code === 0) {
  //     console.log('Build completed successfully');
  //     // socket.emit('message', 'Build completed successfully');

  //     const outputDirectory = 'testing';
  //     const command = `rm -rf ${outputDirectory} && mkdir ${outputDirectory} && cp -r public/* ${outputDirectory}`;
  //     try {
  //       const { stdout, stderr, kill } = await execP(command, {
  //         shell: true,
  //         cwd: buildDirectory,
  //       });

  //       const log = await new models.Log({
  //         timestamp: new Date(),
  //         message: 'Build completed successfully',
  //         command: 'Gatsby',
  //         sourceStream: 'STDOUT',
  //         buildId: buildId,
  //       }).save();

  //       socket.emit('build-logs', {
  //         id: buildId,
  //         payload: {
  //           data: {
  //             buildLogCreated: [log],
  //           },
  //           type: 'data',
  //         },
  //       });
  //       // socket.emit('message', "Successfully copied build to 'testing' directory");
  //       // socket.emit('message', 'Build completed successfully');

  //       build.status = BUILD_STATUS.SUCCESS;
  //       build.endedAt = new Date();
  //       build.duration = build.endedAt - build.startedAt;
  //       await build.save();
  //       socket.emit('build-updated', {
  //         id: buildId,
  //         payload: {
  //           data: {
  //             buildUpdated: build,
  //           },
  //           type: 'data',
  //         },
  //       });
  //     } catch (error) {
  //       console.error('stderr:', stderr);
  //     }
  //   } else {
  //     console.log('Build failed');
  //     socket.emit('message', 'Build failed');
  //   }
  //   console.log(`child process exited with code ${code}`);
  //   // socket.emit('message', `child process exited with code ${code}`);
  // });
  console.log('Build completed');

  done();
};

module.exports = { job, cancelJob };
