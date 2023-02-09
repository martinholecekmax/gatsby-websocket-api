const { sendDataLog } = require('../controller/logController');

const spawn = require('cross-spawn-with-kill');
const path = require('path');

const rootDirectory = path.resolve(__dirname, '../..');
let buildDirectory = path.join(rootDirectory, process.env.GATSBY_PROJECT_PATH);

// If the build directory is an absolute path, use it as is
if (process.env.GATSBY_PROJECT_PATH.startsWith('/')) {
  buildDirectory = process.env.GATSBY_PROJECT_PATH;
}

const outputDirectory = process.env.BUILD_OUTPUT_DIR;
const gatsbyCommand = 'gatsby';

let processes = [];
let cancelledBuilds = [];

const cancelProcess = async (buildId) => {
  cancelledBuilds[buildId] = true;
  if (processes[buildId]) {
    processes[buildId].kill();
  }
};

const runCommand = async (
  buildId,
  command,
  args = [],
  cwd,
  isKillable = false
) => {
  return new Promise((resolve, reject) => {
    if (isBuildCancelled(buildId)) {
      reject('CANCELLED');
      return;
    }

    const commandProcess = spawn(command, args, {
      cwd,
      shell: true,
    });

    if (isKillable) {
      processes[buildId] = commandProcess;
    }

    commandProcess.stdout.on('data', (data) => {
      sendDataLog(buildId, data);
    });

    commandProcess.stderr.on('data', (data) => {
      sendDataLog(buildId, data);
    });

    commandProcess.on('close', (code) => {
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

const gatsbyClean = async (buildId) => {
  return runCommand(buildId, gatsbyCommand, ['clean'], buildDirectory);
};

const gatsbyBuild = async (buildId) => {
  return runCommand(buildId, gatsbyCommand, ['build'], buildDirectory, true);
};

const removeDirectory = async (buildId) => {
  return runCommand(buildId, 'rm', ['-rf', outputDirectory], rootDirectory);
};

const makeDirectory = async (buildId) => {
  return runCommand(buildId, 'mkdir', [outputDirectory], rootDirectory);
};

const copyDirectory = async (buildId) => {
  const copyOutputDirectory = path.join(rootDirectory, outputDirectory);
  const publicDirectory = path.join(buildDirectory, 'public');
  return runCommand(
    buildId,
    'cp',
    ['-r', '.', copyOutputDirectory],
    publicDirectory
  );
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
  isBuildCancelled,
  makeDirectory,
  copyDirectory,
  removeDirectory,
};
