
const express = require('express');
const router = express.Router();

router.get('/new-endpoint', (req, res) => {
  res.json({"message":"This is a dynamically created endpoint stored in the filesystem!"});
});

module.exports = {
  endpoint: '/new-endpoint',
  router
};
