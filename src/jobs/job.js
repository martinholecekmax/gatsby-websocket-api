const { BUILD_STATUS } = require('../utils/constants');
const { sendDataLog } = require('../controller/logController');
const { updateBuildStatus } = require('../controller/buildController');
const {
  isBuildCancelled,
  gatsbyClean,
  gatsbyBuild,
  gatsbyServe,
} = require('../commands/buildCommands');

const job = async (job, done) => {
  console.log('job data', job.data);
  // Wait for 10 seconds before starting the build
  console.log('Waiting for 10 seconds before starting the build');
  await new Promise((resolve) => setTimeout(resolve, 5000));

  const buildId = job.data.id;

  const clearCache = job.data.clearCache;
  await updateBuildStatus(buildId, BUILD_STATUS.BUILDING);

  try {
    if (!isBuildCancelled(buildId) && clearCache) {
      await gatsbyClean(buildId);
    }

    if (!isBuildCancelled(buildId)) {
      try {
        await gatsbyBuild(buildId);
        console.log('Creating Static files completed successfully');
      } catch (error) {
        console.log('Building error', error);
      }
    }

    if (!isBuildCancelled(buildId)) {
      await gatsbyServe(buildId);
    }

    if (!isBuildCancelled(buildId)) {
      sendDataLog(buildId, 'Build completed successfully');
      await updateBuildStatus(buildId, BUILD_STATUS.SUCCESS);
    } else {
      sendDataLog(buildId, 'Build cancelled');
      await updateBuildStatus(buildId, BUILD_STATUS.CANCELLED);
      console.log('Build cancelled');
    }
  } catch (error) {
    console.log('Main error', error);
    await updateBuildStatus(buildId, BUILD_STATUS.FAILED);
    sendDataLog(buildId, 'Build failed');
  }

  done();
};

module.exports = { job };
