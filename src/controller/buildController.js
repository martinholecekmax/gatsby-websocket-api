const { models } = require('../models');
const buildQueue = require('../services/queue').getInstance();
const { BUILD_STATUS } = require('../utils/constants');
const { cancelJob } = require('../jobs/job');

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
  }).save();
  const id = build.id;
  const job = await buildQueue.add({ id, clearCache, cancelBuild: false });
  build.jobId = job.id;
  await build.save();
  res.json(build);
};

const cancelBuild = async (req, res) => {
  const id = req.params.id;
  const build = await models.Build.findById(id);
  console.log('build id', build._id);
  build.status = BUILD_STATUS.CANCELLED;
  await build.save();

  // TODO: Cancel the build job
  buildQueue.removeJobs(build.jobId);
  console.log('build.jobId', build.jobId);
  const job = await buildQueue.getJob(build.jobId);
  cancelJob();
  if (job) {
    job.update({ ...job.data, cancelBuild: true });
    res.json({ message: 'Build cancelled', build, job: job.toJSON() });
  } else {
    res.json({ message: 'Build cancelled', build });
  }
  //   if (!job) {
  //     console.log('job not found');
  //     res.json({ message: 'Build not found', build });
  //   } else {
  //     console.log('job', job);

  // await job.remove();
  // if (job.isActive()) {
  //   console.log('job is active');
  //   await job.discard();
  //   // Kill the process
  // } else {
  //   console.log('job is not active');
  // }

  // }
};

module.exports = {
  triggerBuild,
  cancelBuild,
  getBuild,
  allBuilds,
};
