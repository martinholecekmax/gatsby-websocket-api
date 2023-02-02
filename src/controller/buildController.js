const { cancelProcess } = require('../commands/buildCommands');
const { models } = require('../models');
const buildQueue = require('../services/queue').getInstance();
const { BUILD_STATUS } = require('../utils/constants');
const socket = require('../services/socket').getInstance();

const allBuilds = async (req, res) => {
  const builds = await models.Build.find({}).sort({ createdAt: -1 });
  res.json(builds);
};

// Get build logs by id
const getBuild = async (req, res) => {
  const id = req.params.id;
  const build = await models.Build.findById(id);
  const logs = await models.Log.find({ buildId: id });
  res.json({ build, logs });
};

const getLogsByBuildId = async (req, res) => {
  const id = req.params.id;
  const logs = await models.Log.find({ buildId: id });
  res.json(logs);
};

const updateBuildStatus = async (buildId, status) => {
  const build = await models.Build.findById(buildId);
  if (build) {
    build.status = status;
    switch (status) {
      case BUILD_STATUS.BUILDING:
        build.startedAt = new Date();
        break;
      case BUILD_STATUS.SUCCESS:
      case BUILD_STATUS.CANCELLED:
      case BUILD_STATUS.FAILED:
        build.endedAt = new Date();
        if (build.startedAt && build.endedAt) {
          build.duration = build.endedAt - build.startedAt;
        } else {
          build.duration = 0;
        }
        break;
      default:
        break;
    }
    await build.save();
    socket.emit('build-updated', {
      id: buildId,
      payload: build,
    });
  }
  return build;
};

const triggerBuild = async (req, res) => {
  const { clearCache, authorName, authorId } = req.body;
  const build = await new models.Build({
    status: BUILD_STATUS.QUEUED,
    createdAt: new Date(),
    startedAt: null,
    endedAt: null,
    duration: null,
    jobId: null,
    authorName,
    authorId,
    site: process.env.SITE,
  }).save();
  const id = build.id;
  const job = await buildQueue.add({ id, clearCache });
  build.jobId = job.id;
  await build.save();
  socket.emit('build-updated', {
    id,
    payload: build,
  });
  res.json(build);
};

const cancelBuild = async (req, res) => {
  const id = req.params.id;
  await updateBuildStatus(id, BUILD_STATUS.CANCELLED);
  cancelProcess(id);
  res.json({ message: 'Build cancelled' });
};

module.exports = {
  allBuilds,
  getBuild,
  updateBuildStatus,
  triggerBuild,
  cancelBuild,
  getLogsByBuildId,
};
