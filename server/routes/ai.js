const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { suggestTaskDetails } = require('../controllers/aiController');

router.use(protect);

router.post('/suggest', suggestTaskDetails);

module.exports = router;