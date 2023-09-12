const FsServices = require("./FsServices");

const create = (fields, entity) => {
  if (FsServices.checkPath("./backend/server.js")) {
    const Dynamic =
      entity.slice(0, 1).toUpperCase() + entity.slice(1).toLowerCase();
    const dynamicShort = entity.toLowerCase();

    const content = [
      {
        filePath: `./backend/controllers/${dynamicShort}Controller.js`,
        fileContent: `
        const ${Dynamic} = require(\`../models/${dynamicShort}\`);
        const validationSchema = require("../validation/validationSchema");
        const ${dynamicShort}ValidationSchema = require(\`../validation/${dynamicShort}ValidationSchema\`);
        const ${Dynamic}DTO = require(\`../dto/${dynamicShort}\`);
        const ${dynamicShort}Controller = {
            //create ${dynamicShort}
            async create(req, res, next) {
            const user = req.user;
            //1. Validate input using Joi
            const { error } = ${dynamicShort}ValidationSchema.create${Dynamic}Schema.validate(req.body);
            if (error) {
                return next(error);
            }
  
            //getting data from request
            const { ${FsServices.getFields(
              fields,
              "controller",
              dynamicShort
            )} } = req.body;
  
            //3. Save ${dynamicShort} in Db
            //Creating BACKEND_SERVER_PATH in env
            let new${Dynamic};
            try {
                new${Dynamic} = new ${Dynamic}({
                author: user?._id,
                ${FsServices.getFields(fields, "controller", dynamicShort)}
                });
                //saving in database
                await new${Dynamic}.save();
                await new${Dynamic}.populate(["author", ${FsServices.getFields(
          fields,
          "populate",
          dynamicShort
        )}]);
            } catch (error) {
                return next(error);
            }
            //4. Send reponse
            //creating ${Dynamic}DTO
            const ${dynamicShort}Dto = new ${Dynamic}DTO(new${Dynamic});
  
            return res.status(201).json({ ${dynamicShort}: ${dynamicShort}Dto });
            },
  
            //get all ${dynamicShort}s
            async getAll(req, res, next) {
                try {
                //1. Get ${dynamicShort}s from database
                const ${dynamicShort}s = await ${Dynamic}.find({}).populate([
                    "author",
                    "updated",
                    ${FsServices.getFields(fields, "populate", dynamicShort)}
                ]);
  
                //2. Send Response
                let ${dynamicShort}sDto = [];
                for (let i = 0; i < ${dynamicShort}s.length; i++) {
                    const dto = new ${Dynamic}DTO(${dynamicShort}s[i]);
                    ${dynamicShort}sDto.push(dto);
                }
                return res.status(200).json({ ${dynamicShort}s: ${dynamicShort}sDto });
                } catch {
                return next(error);
                }
            },
  
            //get ${dynamicShort} by id
            async getById(req, res, next) {
                //get id from req
                const { id } = req.query;
  
                //1. Validate id using Joi
                const { error } = validationSchema.getByIdSchema.validate({ id });
                if (error) {
                return next(error);
                }
  
                //2. Get ${Dynamic} from database by id
                let ${dynamicShort};
                try {
                    ${dynamicShort} = await ${Dynamic}.findOne({ _id: id }).populate([
                    "author",
                    "updated",
                    ${FsServices.getFields(fields, "populate", dynamicShort)}
                ]);
                } catch (error) {
                return next(error);
                }
  
                //3. Send Response
                const ${dynamicShort}Dto = new ${Dynamic}DTO(${dynamicShort});
                return res.status(200).json({ ${dynamicShort}: ${dynamicShort}Dto });
            },
  
            //update ${dynamicShort} by id
            async update(req, res, next) {
                const user = req?.user;
                //1. Validate input using Joi
                const { error } = ${dynamicShort}ValidationSchema.update${Dynamic}Schema.validate(req.body);
                if (error) {
                  return next(error);
                }
  
                //getting data from request
                const { ${dynamicShort}Id, ${FsServices.getFields(
          fields,
          "controller",
          dynamicShort
        )} } = req.body;
  
                //saving ${dynamicShort} in db
                try {
                  await ${Dynamic}.updateOne(
                    { _id: ${dynamicShort}Id },
                    {
                      updated: user?._id,
                      ${FsServices.getFields(
                        fields,
                        "controller",
                        dynamicShort
                      )}
                    }
                  );
                } catch (error) {
                  return next(error);
                }
  
                //getting updated ${dynamicShort} from database and sending response
                const updated${Dynamic} = await ${Dynamic}.findOne({ _id: ${dynamicShort}Id }).populate([
                  "author",
                  "updated",
                  ${FsServices.getFields(fields, "populate", dynamicShort)}
                ]);
                const ${dynamicShort}Dto = new ${Dynamic}DTO(updated${Dynamic});
                return res.status(200).json({ ${dynamicShort}: ${dynamicShort}Dto });
              },
  
              async delete(req, res, next) {
                //getting id from req
                const { id } = req.query;
  
                //1. Validate id using Joi
                const { error } = validationSchema.getByIdSchema.validate({ id });
                if (error) {
                  return next(error);
                }
  
                //2. Delete ${Dynamic}
                let response;
                try {
                  response = await ${Dynamic}.deleteOne({ _id: id });
                } catch (error) {
                  return next(error);
                }
                if (response?.deletedCount) {
                  return res.status(200).json({ message: "${Dynamic} Deleted" });
                } else {
                  return res.status(404).json({ message: "${Dynamic} Not Found" });
                }
              },
  
        };
  
        module.exports = ${dynamicShort}Controller;
          `,
      },
      {
        filePath: `./backend/dto/${dynamicShort}.js`,
        fileContent: `
        class ${Dynamic}DTO {
          constructor(${dynamicShort}) {
            this.id = ${dynamicShort}?._id;
            this.createdBy = ${dynamicShort}?.author?.username;
            this.createdById = ${dynamicShort}?.author?._id;
            this.updatedBy = ${dynamicShort}?.updated?.username;
            this.updatedById = ${dynamicShort}?.updated?._id;
            this.createdAt = ${dynamicShort}?.createdAt;
            ${FsServices.getFields(fields, "dto", dynamicShort)}
          }
        }
  
        module.exports = ${Dynamic}DTO;
        `,
      },
      {
        filePath: `./backend/models/${dynamicShort}.js`,
        fileContent: `const mongoose = require("mongoose");
  
        const { Schema } = mongoose;
  
        const ${dynamicShort} = new Schema(
          {
            ${FsServices.getFields(fields, "model", dynamicShort)}
            author: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
            updated: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
          },
          {
            timestamps: true,
          }
        );
  
        module.exports = mongoose.model("${Dynamic}", ${dynamicShort}, "${dynamicShort}s");
        `,
      },
      {
        filePath: `./backend/routes/${dynamicShort}.js`,
        fileContent: `const express = require("express");
        const auth = require("../middlewares/auth");
        const ${dynamicShort}Controller = require("../controllers/${dynamicShort}Controller");
        const router = express.Router();
  
        //create
        router.post("/${dynamicShort}", auth, ${dynamicShort}Controller.create);
  
        //read all ${dynamicShort}s
        router.get("/${dynamicShort}/all", auth, ${dynamicShort}Controller.getAll);
  
        //read ${dynamicShort} by Id
        router.get("/${dynamicShort}", auth, ${dynamicShort}Controller.getById);
  
        //update
        router.put("/${dynamicShort}", auth, ${dynamicShort}Controller.update);
  
        //delete
        router.delete("/${dynamicShort}", auth, ${dynamicShort}Controller.delete);
  
        module.exports = router;
        `,
      },
      {
        filePath: `./backend/validation/${dynamicShort}ValidationSchema.js`,
        fileContent: `
        const Joi = require("joi");
        const mongodbIdPattern = /^[0-9a-fA-F]{24}$/;
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,25}$/;
        class ${dynamicShort}ValidationSchema {
  
          //${dynamicShort} schema
          static create${Dynamic}Schema = Joi.object({
            ${FsServices.getFields(fields, "createValidation", dynamicShort)}
          });
  
          //update ${dynamicShort} schema
          static update${Dynamic}Schema = Joi.object({
            ${dynamicShort}Id: Joi.string().regex(mongodbIdPattern).required(),
            ${FsServices.getFields(fields, "updateValidation", dynamicShort)}
          });
  
        }
  
        module.exports = ${dynamicShort}ValidationSchema;
              `,
      },
    ];

    for (let index = 0; index < content.length; index++) {
      if (content[index].filePath.split("/")[2]) {
        FsServices.createFolder(`./${content[index].filePath.split("/")[1]}`);
      }
      FsServices.createFile(
        content[index].filePath,
        content[index].fileContent
      );
    }

    FsServices.appendFile(
      "./backend/server.js",
      [5, 13],
      [
        `const ${dynamicShort}Router = require("./routes/${dynamicShort}");`,
        `app.use("/api/${dynamicShort}", ${dynamicShort}Router);`,
      ]
    );
  } else {
    console.log("Please run the setup.js file first");
  }
};

module.exports = create;
