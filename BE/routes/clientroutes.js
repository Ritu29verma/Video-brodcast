const express = require('express');
const { checkClient } = require("../controllers/clientControllers") ;
const router = express.Router();

router.get('/login-client', checkClient);

module.exports = router;