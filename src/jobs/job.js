const { BUILD_STATUS } = require('../utils/constants');
const { sendDataLog } = require('../controller/logController');
const { updateBuildStatus } = require('../controller/buildController');
const {
  gatsbyClean,
  gatsbyBuild,
  gatsbyServe,
} = require('../commands/buildCommands');

const job = async (job, done) => {
  const buildId = job.data.id;
  const clearCache = job.data.clearCache;
  await updateBuildStatus(buildId, BUILD_STATUS.BUILDING);

  try {
    if (clearCache) {
      await gatsbyClean(buildId);
    }

    await gatsbyBuild(buildId);
    await gatsbyServe(buildId);

    sendDataLog(buildId, 'Build completed successfully');
    await updateBuildStatus(buildId, BUILD_STATUS.SUCCESS);
  } catch (error) {
    if (error === 'CANCELLED') {
      sendDataLog(buildId, 'Build cancelled');
      await updateBuildStatus(buildId, BUILD_STATUS.CANCELLED);
    } else {
      sendDataLog(buildId, 'Build failed');
      await updateBuildStatus(buildId, BUILD_STATUS.FAILED);
    }
  }

  done();
};

module.exports = { job };
