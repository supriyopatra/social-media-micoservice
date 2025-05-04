const express = require("express");
const { authenticateRequest } = require("../middleware/authMiddleware");
const { getAllSearch } = require("../controller/search-controller");

const router = express.Router();

router.use(authenticateRequest);
router.get('/posts',getAllSearch);

module.exports = router;

