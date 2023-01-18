const router = require('express').Router();

const {
  triggerBuild,
  cancelBuild,
  getBuild,
  allBuilds,
} = require('../controller/buildController');

router.get('/builds', allBuilds);
router.get('/builds/:id', getBuild);
router.post('/trigger-build', triggerBuild);
router.get('/cancel-build/:id', cancelBuild);

module.exports = router;
