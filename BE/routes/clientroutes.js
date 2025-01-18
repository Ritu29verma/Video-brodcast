const express = require('express');
const { checkClient,getUserInfo } = require("../controllers/clientControllers") ;
const router = express.Router();

router.get('/login-client', checkClient);
router.get('/get-user-info', getUserInfo);


module.exports = router;