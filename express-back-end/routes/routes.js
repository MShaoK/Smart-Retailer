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
    files: 3, // allow up to 3 files per request,
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
  router.get('/events', async (req, res) => {
    // setup headers for the response in order to get the persistent HTTP connection
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    
    // compose the message
    setTimeout(() => {
      knex('videos').select('name').where('ana_status', '<', 4).then( videos => {
        if(videos.length > 0) {
          res.write(`data: ${JSON.stringify({ hasUnread: true })}`);
          res.write('\n\n'); // whenever sending two '\n', the msg is sent automatically
        }
      })
    }, 3000);
  });
 

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

  // route for get all data from db
  router.get('/all', (req, res) => {

    let pVideos = knex('videos').select('*').orderBy('filmed_at', 'desc');
    let pFaces = knex('faces').select('*').orderBy('video_id', 'desc');
    let pRecurs = knex('recurs').select('*').orderBy('video_id', 'desc');
    let pPersons = knex('persons').select('*').orderBy('video_id', 'desc');
    let pTraffic = knex('traffic').select('*').orderBy('video_id', 'desc');

    Promise.all([pVideos, pFaces, pRecurs, pPersons, pTraffic])
    .then(data => res.json({videos: data[0], faces: data[1], recurs: data[2], persons: data[3], traffic: data[4]}))
    .catch(err => console.log(err));

  });


  // query recurs table with video_id
  router.get('/recurs/:vid', (req, res) => {
    console.log(`Get Recurs Reqeuest, ${req.params.vid}`);
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

    console.log(`Get Perons and Traffic Reqeuest, ${req.params.vid}`);
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
    
    console.log(`Get Faces Reqeuest, ${req.params.vid}`);
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


  // db reset endpoints
  router.get('/reset/:type', (req, res) => {

    if (req.params.type === 'all') {
      knex('videos').select('id').orderBy('id', 'desc').then( ids => {
        console.log(ids);
        let deletes = ids.map(id => {
          return knex('videos').where('id', id.id).del();
        });
        Promise.all(deletes).then(data => {
          res.end('All videos analysis records are removed:', data);
        })
        .catch(err => {
          console.log(err);
        });
      });

    } else {

      knex('videos').select('*').orderBy('id', 'desc').then( ids => {
        if(ids.length > 0) {
          knex('videos').where('id', ids[0].id).del()
          .then( data => res.end('The last video analysis records is removed:', data));
        }          
      })
      .catch(err => {
        console.log(err);
      }); 

    }

  });


  // html page used to test upload file
  router.get('/', (req,res) => {
    console.log(__dirname);
    res.sendFile(__dirname + '/uploader.html'); 
  });

  // for upload a single video file
  router.post('/upload', upload.single('VID'), async (req, res, next) => {
    const file = req.file   
    console.log(file);
    if (!file) {
      return res.json({ Error: "Only mp4 video files supported" });
    } else {
      console.log(`File ${file.originalname} upload successfully`);
      const fullpathname = path.join(__dirupload, file.originalname);
      res.json('File Received!');

      let data = await s3Client.uploadOneFile(fullpathname, APP_VIDEO_BUCKET_NAME);
      console.log(`Uploaded ${data.length} face images to s3 successfully`);  
      db.addOneVideoFile(file.originalname);

      // startVideoRekognition(file.originalname);      
    }

  })

  router.post('/uploads', upload.array('VID', 3), (req, res, next) => {
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