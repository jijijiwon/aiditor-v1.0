const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const AWS = require("aws-sdk");
const fs = require("fs");
const axios = require("axios");
const async = require("async");
const dotenv = require("dotenv");
const querystring = require("querystring");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const ID_M = process.env.ID_M;
const SECRET_M = process.env.SECRET_M;
const BUCKET_NAME_M = process.env.BUCKET_NAME_M;
const MYREGION_M = process.env.REGION_M;
const PYTHON_MAIN = process.env.PYTHON_MAIN;
const PYTHON_SUB = process.env.PYTHON_SUB;
let NODE_SUB;

const upload = multer({ dest: "uploads/" });

const s3 = new AWS.S3({
  accessKeyId: ID_M,
  secretAccessKey: SECRET_M,
  region: MYREGION_M,
});

router.use(function (req, res, next) {
  NODE_SUB = "http://" + req.get("host").replace("8000", "8500");
  next();
});

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    NODE_SUB: NODE_SUB,
    PYTHON_MAIN: PYTHON_MAIN,
    PYTHON_SUB: PYTHON_SUB,
  });
});

router.get("/popup", function (req, res, next) {
  res.render("pop_upload", {
    NODE_SUB: NODE_SUB,
    PYTHON_MAIN: PYTHON_MAIN,
    PYTHON_SUB: PYTHON_SUB,
  });
});

router.get("/moderation", function (req, res, next) {
  res.render("moderation", {
    NODE_SUB: NODE_SUB,
    PYTHON_MAIN: PYTHON_MAIN,
    PYTHON_SUB: PYTHON_SUB,
  });
});

router.get("/moderation-confirm", function (req, res, next) {
  res.render("moderation_con", {
    NODE_SUB: NODE_SUB,
    PYTHON_MAIN: PYTHON_MAIN,
    PYTHON_SUB: PYTHON_SUB,
  });
});

// complete 페이지 라우터
router.get("/moderation-complete", (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send("url is required");
  }

  // complete 페이지를 렌더링
  res.render("moderation_complete", {
    downloadUrl: url,
    NODE_SUB: NODE_SUB,
    PYTHON_MAIN: PYTHON_MAIN,
    PYTHON_SUB: PYTHON_SUB,
  });
});

// api

async function sendRequest(method, url, queryParams = {}, body = {}) {
  try {
    const queryString = querystring.stringify(queryParams);
    const config = {
      method: method.toUpperCase(),
      url: queryString ? `${url}?${queryString}` : url,
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw error;
  }
}

router.post("/upload", upload.single("videoFile"), (req, res) => {
  // 'videoFile'로 수정
  const file = req.file;
  const fileStream = fs.createReadStream(file.path);

  const params = {
    Bucket: BUCKET_NAME_M,
    Key: `raw-video/${file.originalname}`, // 원본 파일명을 정확히 사용
    Body: fileStream,
    ContentType: file.mimetype,
  };

  s3.upload(params, (err, data) => {
    fs.unlinkSync(file.path); // 업로드 후 서버에서 파일 삭제
    if (err) {
      console.error("Error uploading to S3:", err);
      return res.status(500).send({ message: "Error uploading file" });
    }
    res.send({ message: "File uploaded successfully", data });
  });
});

router.get("/letsdown", async (req, res) => {
  const { newVideoName } = req.query;
  if (!newVideoName) {
    return res.status(400).send("newVideoName is required");
  }

  try {
    const urlData = await sendRequest("GET", `${PYTHON_MAIN}/get-url`, {
      newVideoName: newVideoName,
    });

    console.log(urlData);

    // URL 정보를 포함한 complete 페이지로 리디렉션
    res.redirect(`/moderation-complete?url=${encodeURIComponent(urlData.url)}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error while processing request");
  }
});

module.exports = router;
