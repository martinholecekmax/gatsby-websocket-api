const router = require("express").Router();

const {
  triggerBuild,
  cancelBuild,
  getBuild,
  allBuilds,
  getLogsByBuildId,
} = require("../controller/buildController");

router.get("/", ({ res }) => {
  return res.json({ test: "Welcome to the WebsocketAPI" });
});

router.get("/builds", allBuilds);
router.get("/builds/:id", getBuild);
router.post("/trigger-build", triggerBuild);
router.get("/cancel-build/:id", cancelBuild);
router.get("/logs/:id", getLogsByBuildId);

module.exports = router;
