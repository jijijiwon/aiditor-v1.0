var express = require('express');
const dotenv = require('dotenv');
var router = express.Router();
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const ID_M = process.env.ID;
const SECRET_M = process.env.SECRET;
const BUCKET_NAME_M = process.env.BUCKET_NAME;
const MYREGION_M = process.env.REGION;
const NODE_MAIN = process.env.NODE_MAIN;
const NODE_SUB = process.env.NODE_SUB;
const PYTHON_MAIN = process.env.PYTHON_MAIN;
const PYTHON_SUB = process.env.PYTHON_SUB;

/* GET home page. */
router.get('/', function (req, res, next) {
   res.render('moderation', {
      title: 'Express',
      NODE_MAIN: NODE_MAIN,
      NODE_SUB: NODE_SUB,
      PYTHON_MAIN: PYTHON_MAIN,
      PYTHON_SUB: PYTHON_SUB,
   });
});

module.exports = router;
