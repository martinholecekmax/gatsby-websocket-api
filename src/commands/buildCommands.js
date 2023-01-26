const { sendDataLog } = require('../controller/logController');

const { exec } = require('child_process');
const spawn = require('cross-spawn-with-kill');
const path = require('path');

let buildDirectory = path.join(__dirname, process.env.BUILD_DIR);

// If the build directory is an absolute path, use it as is
if (process.env.BUILD_DIR.startsWith('/')) {
  buildDirectory = process.env.BUILD_DIR;
}

const outputDirectory = process.env.OUTPUT_DIR;
const gatsbyCommand = 'gatsby';

let processes = [];
let cancelledBuilds = [];

const cancelProcess = async (buildId) => {
  cancelledBuilds[buildId] = true;
  if (processes[buildId]) {
    processes[buildId].kill();
  }
};

const gatsbyClean = async (buildId) => {
  return new Promise((resolve, reject) => {
    if (isBuildCancelled(buildId)) {
      reject('CANCELLED');
      return;
    }
    let gatsbyCleanProcess = spawn(gatsbyCommand, ['clean'], {
      cwd: buildDirectory,
      shell: true,
    });
    gatsbyCleanProcess.stdout.on('data', (data) => {
      sendDataLog(buildId, data);
    });
    gatsbyCleanProcess.stderr.on('data', (data) => {
      sendDataLog(buildId, data);
    });
    gatsbyCleanProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

const gatsbyBuild = async (buildId) => {
  return new Promise((resolve, reject) => {
    if (isBuildCancelled(buildId)) {
      reject('CANCELLED');
      return;
    }
    processes[buildId] = spawn(gatsbyCommand, ['build'], {
      cwd: buildDirectory,
      shell: true,
    });
    processes[buildId].stdout.on('data', (data) => {
      sendDataLog(buildId, data);
    });
    processes[buildId].stderr.on('data', (data) => {
      sendDataLog(buildId, data);
    });
    processes[buildId].on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        if (isBuildCancelled(buildId)) {
          reject('CANCELLED');
        } else {
          reject('FAILED');
        }
      }
    });
  });
};

const gatsbyServe = async (buildId) => {
  return new Promise((resolve, reject) => {
    if (isBuildCancelled(buildId)) {
      reject('CANCELLED');
      return;
    }
    const command = `rm -rf ${outputDirectory} && mkdir ${outputDirectory} && cp -r public/* ${outputDirectory}`;
    exec(
      command,
      {
        shell: true,
        cwd: buildDirectory,
      },
      (error, stdout, stderr) => {
        if (error) {
          sendDataLog(buildId, error?.message);
          reject();
          return;
        }
        if (stderr) {
          sendDataLog(buildId, stderr);
          reject();
          return;
        }
        console.log(`stdout: ${stdout}`);
        sendDataLog(buildId, 'Moving files to output directory completed.');
        resolve();
        return;
      }
    );
  });
};

const isBuildCancelled = (buildId) => {
  if (cancelledBuilds[buildId] === undefined) {
    cancelledBuilds[buildId] = false;
  }
  return cancelledBuilds[buildId];
};

module.exports = {
  cancelProcess,
  gatsbyClean,
  gatsbyBuild,
  gatsbyServe,
  isBuildCancelled,
};
