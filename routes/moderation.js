var express = require("express");
const dotenv = require("dotenv");
var router = express.Router();
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

let NODE_SUB;

router.use(function (req, res, next) {
  NODE_MAIN = "http://" + req.get("host");
  next();
});

router.use(function (req, res, next) {
  NODE_SUB = "http://" + req.get("host").replace("8000", "8500");
  next();
});

const ID_M = process.env.ID;
const SECRET_M = process.env.SECRET;
const BUCKET_NAME_M = process.env.BUCKET_NAME;
const MYREGION_M = process.env.REGION;
const PYTHON_MAIN = process.env.PYTHON_MAIN;
const PYTHON_SUB = process.env.PYTHON_SUB;

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("moderation", {
    NODE_SUB: NODE_SUB,
    PYTHON_MAIN: PYTHON_MAIN,
    PYTHON_SUB: PYTHON_SUB,
  });
});

module.exports = router;
