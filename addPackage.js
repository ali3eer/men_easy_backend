const FsServices = require("./FsServices");

FsServices.createFile(
  "../test/package.json",
  `{
    "name": "men_easy_backend",
    "version": "1.0.0",
    "description": "an easy backend for beginners MongoDb, Express and Node",
    "main": "index.js",
    "scripts": {
      "easy": "node node_modules/men_easy_backend/index.js"
    },
    "repository": {
      "type": "git",
      "url": "git+https://github.com/Shah3eerAli/men_easy_backend.git"
    },
    "keywords": [
      "men_easy_backend"
    ],
    "author": "Shahmir Ali",
    "license": "ISC",
    "bugs": {
      "url": "https://github.com/Shah3eerAli/men_easy_backend/issues"
    },
    "homepage": "https://github.com/Shah3eerAli/men_easy_backend#readme"
  }
  `
);
