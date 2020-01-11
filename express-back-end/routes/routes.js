/**
 * express routes for intercation with react front end
 */
"use strict";

const express = require('express');
const router  = express.Router();
const db = require('../database/db');
const knex = db.knex;
const s3Client = require('../filemanager/s3bucket');
const { startVideoRekognition } = require('../rekognition/rek-videos');

const path = require('path');
const __dirhome = require('os').homedir();
const __dirupload = path.join(__dirhome, 'lighthouse/final/Demo/Videos');
const APP_VIDEO_BUCKET_NAME = 'retailer-videos';

const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirupload);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);  // do not change name
  }
})

const options = {
  storage: storage,
  limits: {
    files: 5, // allow up to 5 files per request,
    fieldSize: 1024 * 1024 * 1024 // 1GB (max file size)
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'video/mp4') {
      return cb(null, false);
    }
    cb(null, true);
  }
}

const upload = multer(options);

module.exports = function() {

  // router.get("/");   //home

  // get days having videos (filmed) uploaded, query videos table and get all the video_ids
  router.get('/videos', (req, res) => {

    knex('videos')
        .select('*')
        .orderBy('filmed_at', 'desc')
        .then( videos => {
          res.json(videos);
        })
        .catch(err => {
            console.log(err);
        });
  });

  // query recurs table with video_id
  router.get('/recurs/:vid', (req, res) => {

    knex('recurs')
        .select('*')
        .where('video_id', req.params.vid)
        .then(result => {
          res.json(result);
        })
        .catch(err => {
          console.log(err);
        });
  });  

  // query traffic and persons table with video_id
  router.get('/track/:vid', (req, res) => {

    let track = {};
    knex('persons').select('*').where('video_id', req.params.vid)
      .then( persons => {
        track.persons = persons;
        return knex('traffic').select('*').where('video_id', req.params.vid);
      })
      .then( traffic => { 
        track.traffic = traffic;
        res.json(track); 
      })
      .catch(err => {
        console.log(err);
      });

  });   
  
  // query faces table with video_id
  router.get('/faces/:vid', (req, res) => {

    knex('faces')
      .select('*')
      .where('video_id', req.params.vid)
      .then( faces => {
        res.json(faces);
      })
      .catch(err => {
        console.log(err);
      });
  });  

  // html page used to test upload file
  router.get('/', (req,res) => {
    console.log(__dirname);
    res.sendFile(__dirname + '/uploader.html'); 
  });

  // for upload a single video file
  router.post('/upload', upload.single('VID'), async (req, res, next) => {
    const file = req.file   
    if (!file) {
      return res.json({ Error: "Only mp4 video files supported" });
      const error = new Error('Please upload a file')
      error.httpStatusCode = 400
      return next(error)
    } else {
      console.log('File upload successfully');
      const fullpathname = path.join(__dirupload, file.originalname);

      // let data = await s3Client.uploadOneFile(fullpathname, APP_VIDEO_BUCKET_NAME);
      // console.log(`Uploaded ${data.length} face images to s3 successfully`);  
      db.addOneVideoFile(file.originalname);

      startVideoRekognition(file.originalname);      
    }
    res.send(file);

  })

  router.post('/uploads', upload.array('myFiles', 12), (req, res, next) => {
    const files = req.files
    if (!files) {
      const error = new Error('Please choose files')
      error.httpStatusCode = 400
      return next(error)
    }
    res.send(files)
  
  })
  
  return router;   // this router must be returned when used as a router division

};