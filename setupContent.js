const content = [
  //CONTROLLERS
  //authController.js
  {
    filePath: "./backend/controllers/authController.js",
    fileContent: `
  const User = require("../models/user");
  const bcrypt = require("bcryptjs");
  const UserDTO = require("../dto/user");
  const JWTService = require("../services/JWTService");
  const validationSchema = require("../validation/validationSchema");
  const RefreshToken = require("../models/token");
  
  const authController = {
    async register(req, res, next) {
      // 1.Validate user input
      const { error } = validationSchema.userRegisterSchema.validate(req.body);
  
      // 2.If error in validation__ return error via middleware
      if (error) {
        next(error);
      }
  
      // 3.If username or email already exist__ return error
      const { username, email, password, role } = req.body;
  
      try {
        const usernameInUse = await User.exists({ username });
        const emailInUse = await User.exists({ email });
  
        if (usernameInUse) {
          const error = {
            status: 409,
            message: "Username is not available, choose another username!",
          };
          return next(error);
        }
  
        if (emailInUse) {
          const error = {
            status: 409,
            message: "Email already registered, choose another email!",
          };
          return next(error);
        }
      } catch (error) {
        return next(error);
      }
      // 4.Password Hashed
      const hashedPassword = await bcrypt.hash(password, 10);
  
      let accessToken;
      let refreshToken;
      let user;
      try {
        // 5.Store User data in db
        const userToRegister = new User({
          username,
          email,
          password: hashedPassword,
          role,
        });
  
        user = await userToRegister.save();
  
        //generate token
        accessToken = JWTService.signAccessToken(
          { _id: user._id, email: user.email },
          "30m"
        );
        refreshToken = JWTService.signRefreshToken({ _id: user._id }, "60m");
      } catch (error) {
        return next(error);
      }
      //saving Refresh Token in db
      await JWTService.storeRefreshToken(refreshToken, user._id);
  
      //sending response in cookie
      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
  
      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
  
      // 6.Response send
      const userDto = new UserDTO(user);
  
      return res.status(201).json({ user: userDto });
    },
  
    async login(req, res, next) {
      // 1.Validate user Input
      const { error } = validationSchema.userLoginSchema.validate(req.body);
  
      // 2.If validation error, return error
      if (error) {
        return next(error);
      }
      // 3.Match password and username
      const { username, password } = req.body;
      let user;
  
      try {
        user = await User.findOne({ username });
  
        if (!user) {
          const error = {
            status: 401,
            message: "Invalid Username",
          };
          return next(error);
        }
  
        const match = await bcrypt.compare(password, user.password);
  
        if (!match) {
          const error = {
            status: 401,
            message: "Invalid Password",
          };
          return next(error);
        }
      } catch (error) {
        return next(error);
      }
  
      const accessToken = JWTService.signAccessToken({ _id: user._id }, "30m");
      const refreshToken = JWTService.signRefreshToken({ _id: user._id }, "60m");
  
      //updating refreshToken in db if exists otherwise storing it
      await JWTService.updateRefreshToken(refreshToken, user._id);
  
      //Seding response in cookie
      res.cookie("accessToken", accessToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
  
      res.cookie("refreshToken", refreshToken, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
      });
  
      // 4.Send response
      const userDto = new UserDTO(user);
  
      return res.status(200).json({ user: userDto });
    },
  
    async logout(req, res, next) {
      //1. delete refreshToken from db
      //2. clear accessToken and refreshToken from cookies
      //3. response
  
      //1.Delete refreshToken from db
      const { refreshToken } = req.cookies;
      await JWTService.deteleRefreshToken(refreshToken);
  
      //2. Delete cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
  
      //3. Response
      res.status(200).json({ user: null, auth: false });
    },
  
    async refresh(req, res, next) {
      //1. get refresh token from cookies
      //2. verify refresh token
      //3. Match the token with userId in db
      //4. generate new tokens
      //5. update db, return response
  
      //1. get refresh token from cookies
      const originalRefreshToken = req.cookies.refreshToken;
      let id;
      try {
        id = await JWTService.verifyRefreshToken(originalRefreshToken);
      } catch (e) {
        const error = {
          status: 401,
          message: "Unauthorized",
        };
        return next(error);
      }
  
      //3. Match token and userId
      try {
        const match = RefreshToken.findOne({
          _id: id,
          token: originalRefreshToken,
        });
  
        if (!match) {
          const error = {
            status: 401,
            message: "Unauthorized",
          };
          return next(error);
        }
      } catch (e) {
        return next(e);
      }
  
      try {
        const accessToken = JWTService.signAccessToken({ _id: id }, "30m");
        const refreshToken = JWTService.signRefreshToken({ _id: id }, "60m");
  
        await JWTService.updateRefreshToken(refreshToken, id);
  
        res.cookie("accessToken", accessToken, {
          maxAge: 1000 * 60 * 60 * 24,
          httpOnly: true,
        });
  
        res.cookie("refreshToken", refreshToken, {
          maxAge: 1000 * 60 * 60 * 24,
          httpOnly: true,
        });
      } catch (e) {
        return next(e);
      }
  
      const user = await User.findOne({ _id: id });
      const userDto = new UserDTO(user);
  
      res.status(200).json({ user: userDto, auth: true });
    },
  };
  
  module.exports = authController;
  
  `,
  },
  //imageController.js
  {
    filePath: "./backend/controllers/imageController.js",
    fileContent: `
      const Image = require("../models/image");
      const ImageDTO = require("../dto/image");
      
      const imageController = {
        //create category
        async upload(req, res, next) {
          const user = req.user;
          //getting data from request
          const { entityType } = req.body;
          \`\${req.protocol}://\${req.headers.host}/\${req.file.path}\`;
          const path = req.file.path;
          //3. Save category in Db
          //Creating BACKEND_SERVER_PATH in env
          let newImage;
          try {
            newImage = new Image({
              entityType,
              path,
              name: req.file.filename,
              url: imageUrl,
              author: user._id,
            });
            //saving in database
            await newImage.save();
            await newImage.populate("author");
          } catch (error) {
            return next(error);
          }
          //4. Send reponse
          //creating categoryDTO
          const imageDto = new ImageDTO(newImage);
          return res.status(201).json({ image: imageDto });
        },
      };
      
      module.exports = imageController;
      `,
  },

  //CONFIG
  //index.js
  {
    filePath: "./backend/config/index.js",
    fileContent: `const dotenv = require("dotenv").config();
  
      const PORT = process.env.PORT;
      const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING;
      const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
      const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
      const BACKEND_SERVER_PATH = process.env.BACKEND_SERVER_PATH;
      
      module.exports = {
        PORT,
        MONGODB_CONNECTION_STRING,
        ACCESS_TOKEN_SECRET,
        REFRESH_TOKEN_SECRET,
        BACKEND_SERVER_PATH,
      };`,
  },

  //DATABASE
  //index.js
  {
    filePath: "./backend/database/index.js",
    fileContent: `
      const mongoose = require("mongoose");
      const { MONGODB_CONNECTION_STRING } = require("../config/index");
      
      const dbConnect = async () => {
        try {
          const con = await mongoose.connect(MONGODB_CONNECTION_STRING);
          console.log(\`Database connected to host: \${con.connection.host}\`);
        } catch (error) {
          console.log(\`Error: \${error}\`);
        }
      };
      
      module.exports = dbConnect;
      `,
  },

  //DTO
  //images.js
  {
    filePath: "./backend/dto/image.js",
    fileContent: `class ImageDTO {
        constructor(image) {
          if (image) {
            this.id = image?._id;
            this.url = image?.url;
            this.name = image?.name;
            this.entityType = image?.entityType;
            this.createdById = image?.author?._id;
            this.createdBy = image?.author?.username;
            this.lastUpdatedAt = image?.createdAt;
          }
        }
      }
      module.exports = ImageDTO;`,
  },
  //user.js
  {
    filePath: "./backend/dto/user.js",
    fileContent: `class UserDTO {
        constructor(user) {
          this._id = user._id;
          this.username = user.username;
          this.email = user.email;
          this.role = user.role;
        }
      }
      
      module.exports = UserDTO;`,
  },

  //MIDDLEWARES
  //admin.js
  {
    filePath: "./backend/middlewares/admin.js",
    fileContent: `const UserDTO = require("../dto/user");
      const User = require("../models/user");
      const JWTService = require("../services/JWTService");
      
      const admin = async (req, res, next) => {
        try {
          const { accessToken, refreshToken } = req.cookies;
          // 1.Validating
          if (!accessToken || !refreshToken) {
            const error = {
              status: 401,
              message: "Unauthorized",
            };
            return next(error);
          }
      
          //2. Verifying AccessToken
          let _id;
          try {
            _id = await JWTService.verifyAccessToken(accessToken)._id;
          } catch (error) {
            return next(error);
          }
      
          //3. Getting User data for demo purpose
          let user;
          try {
            user = await User.findOne({ _id: _id });
          } catch (error) {
            return next(error);
          }
      
          // 1.Validating
          if (user.role !== "admin") {
            const error = {
              status: 401,
              message: "Unauthorized",
            };
            return next(error);
          }
      
          //Sending user data in req as middleWare will work in between
          //req and response
          const userDto = new UserDTO(user);
          req.user = userDto;
      
          //calling next middleware
          next();
        } catch (error) {
          return next(error);
        }
      };
      
      module.exports = admin;
      `,
  },
  //auth.js
  {
    filePath: "./backend/middlewares/auth.js",
    fileContent: `const UserDTO = require("../dto/user");
      const User = require("../models/user");
      const JWTService = require("../services/JWTService");
      
      const auth = async (req, res, next) => {
        try {
          const { accessToken, refreshToken } = req.cookies;
          // 1.Validating
          if (!accessToken || !refreshToken) {
            const error = {
              status: 401,
              message: "Unauthorized",
            };
            return next(error);
          }
      
          //2. Verifying AccessToken
          let _id;
          try {
            _id = await JWTService.verifyAccessToken(accessToken)._id;
          } catch (error) {
            return next(error);
          }
      
          //3. Getting User data for demo purpose
          let user;
          try {
            user = await User.findOne({ _id: _id });
          } catch (error) {
            return next(error);
          }
      
          //Sending user data in req as middleWare will work in between
          //req and response
          const userDto = new UserDTO(user);
          req.user = userDto;
      
          //calling next middleware
          next();
        } catch (error) {
          return next(error);
        }
      };
      
      module.exports = auth;
      `,
  },
  //errorHandler.js
  {
    filePath: "./backend/middlewares/errorHandler.js",
    fileContent: `const {ValidationError} = require('joi');
  
      const errorHandler =(error,req,res,next) => {
          //default error
          let status = 500;
          let data = {
              message:'Internal Server Error!.'
          };
      
      
          //Validation error
          if(error instanceof ValidationError){
              status = 401;
              data.message=error.message;
      
              return res.status(status).json(data);
          }
      
          //other errors
          if(error.status){
              status = error.status;
          }
          if(error.message){
              data.message=error.message;
          }
          return res.status(status).json(data);
      }
      
      module.exports = errorHandler;`,
  },
  //upload.js
  {
    filePath: "./backend/middlewares/upload.js",
    fileContent: `
      const multer = require("multer");
      const path = require("path");
      const fs = require("fs");
      const entityType = "default";
      
      function getFilename(req, file, cb) {
        cb(null, \`\${entityType}-\${Date.now()}\${path.extname(file.originalname)}\`);
      }
      
      function getDestination(req, file, cb, directory) {
        const destination = \`\${directory}/\${entityType}\`;
        fs.mkdirSync(destination, { recursive: true });
        cb(null, destination);
      }
      
      function getUploadsDestination(req, file, cb) {
        getDestination(req, file, cb, "uploads");
      }
      
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          getUploadsDestination(req, file, cb);
        },
        filename: getFilename,
      });
      
      const userUpload = multer({
        storage: storage,
        limits: { fileSize: 1000000000 },
      }).single("image");
      
      module.exports = userUpload;`,
  },

  //MODELS
  //image.js
  {
    filePath: "./backend/models/image.js",
    fileContent: `const mongoose = require("mongoose");
  
      const { Schema } = mongoose;
      
      const image = new Schema(
        {
          name: { type: String, required: true },
          url: { type: String, required: true },
          path: { type: String, required: true },
          entityType: { type: String, required: true },
          author: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
        },
        {
          timestamps: true,
        }
      );
      
      module.exports = mongoose.model("Image", image, "images");
      `,
  },
  //token.js
  {
    filePath: "./backend/models/token.js",
    fileContent: `const mongoose = require('mongoose');
  
      const {Schema} =  mongoose;
      
      const refreshTokenSchema = new Schema(
          {
              token:  {type:String,required:true},
              userId: {type:mongoose.SchemaTypes.ObjectId,ref:'User'}
          },
          {
              timestamps:true
          }
      );
      
      module.exports = mongoose.model('RefreshToken', refreshTokenSchema,'tokens');`,
  },
  //user.js
  {
    filePath: "./backend/models/user.js",
    fileContent: `const mongoose = require("mongoose");
  
      const { Schema } = mongoose;
      
      const userSchema = new Schema(
        {
          username: { type: String, required: true },
          email: { type: String, required: true },
          password: { type: String, required: true },
          role: { type: String, required: true },
        },
        {
          timestamps: true,
        }
      );
      
      module.exports = mongoose.model("User", userSchema, "users");
      `,
  },

  //ROUTES
  //auth.js
  {
    filePath: "./backend/routes/auth.js",
    fileContent: `const express = require("express");
      const auth = require("../middlewares/auth");
      const authController = require("../controllers/authController");
      const router = express.Router();
      
      //test
      router.get("/test", (req, res) => res.json({ msg: "Welcome to TEST page" }));
      
      //register
      router.post("/register", authController.register);
      
      //login
      router.post("/login", authController.login);
      
      //logout
      router.post("/logout", auth, authController.logout);
      
      //refresh for JWT tokens
      router.get("/refresh", authController.refresh);
      
      module.exports = router;
      `,
  },
  //images.js
  {
    filePath: "./backend/routes/image.js",
    fileContent: `const express = require("express");
      const auth = require("../middlewares/auth");
      const admin = require("../middlewares/admin");
      const imageController = require("../controllers/imageController");
      const router = express.Router();
      const userUpload = require("../middlewares/upload");
      
      //create
      router.post("/image", admin, userUpload, imageController.upload);
      
      module.exports = router;
      `,
  },

  //SERVICES
  //JWTServices.js
  {
    filePath: "./backend/services/JWTService.js",
    fileContent: `const jwt = require("jsonwebtoken");
      const { ACCESS_TOKEN_SECRET } = require("../config/index");
      const { REFRESH_TOKEN_SECRET } = require("../config/index");
      const RefreshToken = require("../models/token");
      
      class JWTService {
        //sign access token
        static signAccessToken(payload, expiryTime, secret = ACCESS_TOKEN_SECRET) {
          return jwt.sign(payload, secret, { expiresIn: expiryTime });
        }
      
        //sign refresh token
        static signRefreshToken(payload, expiryTime, secret = REFRESH_TOKEN_SECRET) {
          return jwt.sign(payload, secret, { expiresIn: expiryTime });
        }
      
        //verify access token
        static verifyAccessToken(token, secret = ACCESS_TOKEN_SECRET) {
          return jwt.verify(token, secret);
        }
      
        //verify refresh token
        static verifyRefreshToken(token, secret = REFRESH_TOKEN_SECRET) {
          return jwt.verify(token, secret);
        }
      
        //store refresh token in db
        static async storeRefreshToken(token, userId) {
          try {
            const newToken = new RefreshToken({
              token: token,
              userId: userId,
            });
      
            //store in database
            await newToken.save();
          } catch (error) {
            console.log(error);
          }
        }
      
        //update refresh token in db
        static async updateRefreshToken(token, userId) {
          try {
            await RefreshToken.updateOne(
              { userId: userId },
              { token: token },
              { upsert: true }
            );
          } catch (error) {
            return next(error);
          }
        }
      
        //delete refresh token from db
        static async deteleRefreshToken(token) {
          try {
            await RefreshToken.deleteOne({ token: token });
          } catch (error) {
            return next(error);
          }
        }
      }
      
      module.exports = JWTService;
      `,
  },
  //uploadServices.js
  {
    filePath: "./backend/services/UploadService.js",
    fileContent: `
    const fs = require("fs");
    
    class UploadService {
      static uploadImage(photo, author, next) {
        // 2. Handle Image and store
        // the image in reqBody is a base64 binary format data
        // 1. Need to decode using Buffer
        // 2. Allot a random name
        // 3. Store Locally using "fs"
    
        const buffer = Buffer.from(
          photo.replace(/^data:image\\/[^;]+;base64,/, ""),
          "base64"
        );
    
        const imagePath = \`\${Date.now()}-\${author}.png\`;
        try {
          fs.writeFileSync(\`storage/\${imagePath}\`, buffer);
        } catch (error) {
          return next(error);
        }
        return imagePath;
      }
    
      static async updateImage(prevPhoto, photo, author, next) {
        let prev = prevPhoto.split("/").at(-1); // getting the file name from photoPath
    
        // delete photo
        fs.unlinkSync(\`storage/\${prev}\`);
    
        // Buffering
        const buffer = Buffer.from(
          photo.replace(/^data:image\\/[^;]+;base64,/, ""),
          "base64"
        );
    
        const imagePath = \`\${Date.now()}-\${author}.png\`;
        try {
          fs.writeFileSync(\`storage/\${imagePath}\`, buffer);
        } catch (error) {
          return next(error);
        }
    
        return imagePath;
      }
    }
    
    module.exports = UploadService;
    `,
  },

  //VALIDATION
  //validationSchema.js
  {
    filePath: "./backend/validation/validationSchema.js",
    fileContent: `const Joi = require("joi");
      const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;
      class validationSchema {
        //image validation
        static createImageSchema = Joi.object({
          // file: Yup.mixed().required("File is required"),
        });
      
        //user registration schema
        static userRegisterSchema = Joi.object({
          username: Joi.string().min(5).max(30).required(),
          email: Joi.string().email().required(),
          role: Joi.string().min(1).max(15).required(),
          password: Joi.string().pattern(passwordPattern).required(),
          confirmPassword: Joi.ref("password"),
        });
      
        //user login schema
        static userLoginSchema = Joi.object({
          username: Joi.string().min(5).max(30).required(),
          password: Joi.string().pattern(passwordPattern),
        });
      
        //id schema
        static getByIdSchema = Joi.object({
          id: Joi.string().regex(mongodbIdPattern).required(),
        });
      
      }
      
      module.exports = validationSchema;
      `,
  },

  //package.json
  {
    filePath: "./backend/package.json",
    fileContent: `{
        "name": "backend",
        "version": "1.0.0",
        "description": "",
        "main": "index.js",
        "scripts": {
          "dev": "nodemon server.js",
          "start": "node server.js",
          "test": "echo \\"Error: no test specified\\" && exit 1"
        },
        "keywords": [],
        "author": "",
        "license": "ISC",
        "dependencies": {
          "bcryptjs": "^2.4.3",
          "cookie-parser": "^1.4.6",
          "dotenv": "^16.0.3",
          "express": "^4.18.2",
          "joi": "^17.9.2",
          "jsonwebtoken": "^9.0.0",
          "mongoose": "^7.1.1",
          "multer": "^1.4.5-lts.1"
        },
        "devDependencies": {
          "nodemon": "^2.0.22"
        }
      }`,
  },

  //server.js
  {
    filePath: "./backend/server.js",
    fileContent: `
      const express = require("express");
      const dbConnect = require("./database/index");
      const { PORT } = require("./config/index");
      const imageRouter = require("./routes/image");
      const authRouter = require("./routes/auth");
      const errorHandler = require("./middlewares/errorHandler");
      const cookieParser = require("cookie-parser");
      
      const app = express();
      app.use(cookieParser());
      app.use(express.json());
      app.use("/api/auth", authRouter);
      app.use("/api", imageRouter);
      
      dbConnect();
      
      app.use("/storage", express.static("storage"));
      app.use(errorHandler);
      
      app.listen(PORT, console.log(\`Backend is running on port: \${PORT}\`));
      `,
  },

  //.env
  {
    filePath: "./backend/.env",
    fileContent: `
      PORT = 4400
      MONGODB_CONNECTION_STRING = mongodb+srv://SpiderWeb:test1234@cluster0.s1xty3t.mongodb.net/?retryWrites=true&w=majority
      ACCESS_TOKEN_SECRET = test1234
      REFRESH_TOKEN_SECRET = test1234
      BACKEND_SERVER_PATH = http://localhost`,
  },
];

module.exports = content;
