const express = require('express');
const router = express.Router();
const gameState = require('../models/gameState');

router.get('/status', (req, res) => {
  res.json(gameState);
});

module.exports = router;
