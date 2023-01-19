const { sendDataLog } = require('../controller/logController');

const { exec } = require('child_process');
const spawn = require('cross-spawn-with-kill');
const path = require('path');

const buildDirectory = path.join(__dirname, '../../../gatsby-frontend');
const gatsbyCommand = 'gatsby';

let processes = [];
let cancelledBuilds = [];

const cancelProcess = async (buildId) => {
  console.log('Cancelling job');
  cancelledBuilds[buildId] = true;
  if (processes[buildId]) {
    console.log('Killing process');
    processes[buildId].kill();
  }
};

const gatsbyClean = async (buildId) => {
  return new Promise((resolve, reject) => {
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
      console.log('code', code);
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

const gatsbyServe = async (buildId) => {
  return new Promise((resolve, reject) => {
    const outputDirectory = 'testing';
    const command = `rm -rf ${outputDirectory} && mkdir ${outputDirectory} && cp -r public/* ${outputDirectory}`;
    exec(
      command,
      {
        shell: true,
        cwd: buildDirectory,
      },
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          sendDataLog(buildId, error?.message);
          reject();
          return;
        }
        if (stderr) {
          console.log(`stderr: ${stderr}`);
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
