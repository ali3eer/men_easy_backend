const fs = require("fs");
const { exec } = require("child_process");

class FsServices {
  //Get fields
  static getFields = (fields, type, dynamicShort) => {
    let res = "";
    for (let i = 0; i < fields.length; i++) {
      if (fields[i]?.type !== "id") {
        let output = "";
        switch (type) {
          case "controller":
            output = `${fields[i].name}, `;
            break;
          case "dto":
            output = `this.${fields[i].name} = ${dynamicShort}?.${fields[i]?.name}; \n`;
            break;
          case "model":
            output = `${fields[i]?.name}: {type: ${fields[i]?.type}, required:${
              fields[i]?.required || false
            }}, \n`;
            break;
          case "createValidation":
            output = `${fields[i]?.name}: Joi.${fields[
              i
            ]?.type.toLowerCase()}().${fields[i]?.required && "required()"},\n`;
            break;
          case "updateValidation":
            output = `${fields[i]?.name}: Joi.${fields[
              i
            ]?.type.toLowerCase()}(),\n`;
            break;
        }
        res = res + output;
      } else {
        let output = "";
        switch (type) {
          case "populate":
            output = `"${fields[i].name}", `;
            break;
          case "controller":
            output = `${fields[i].name}, `;
            break;
          case "dto":
            output = `this.${fields[i].name}Id = ${dynamicShort}?.${fields[i]?.name}?._id; \n`;
            break;
          case "model":
            output = `${fields[i]?.name}: {type: mongoose.SchemaTypes.ObjectId, ref:"${fields[i]?.ref}"}, \n`;
            break;
          case "createValidation":
            output = `${fields[i]?.name}: Joi.string().regex(mongodbIdPattern).required(),\n`;
            break;
          case "updateValidation":
            output = `${fields[i]?.name}: Joi.string().regex(mongodbIdPattern),\n`;
            break;
        }
        res = res + output;
      }
    }
    return res;
  };

  //Check path existance
  static checkPath = (path) => {
    if (fs.existsSync(path)) {
      return true;
    }
  };

  //Create Folder
  static createFolder = (folderPath) => {
    let folderName = folderPath.split("/");
    folderName = folderName[folderName.length - 1];
    // Check if the folder already exists
    if (!fs.existsSync(folderPath)) {
      // If it doesn't exist, create the folder
      fs.mkdirSync(folderPath);
      console.log(`${folderName} folder created successfully.`);
    } else {
      console.log(`${folderName} folder already exists.`);
    }
  };

  //Create File
  static createFile = (filePath, fileContent) => {
    const path = filePath.split("/");
    const fileName = path[path.length - 1];
    const folderName = path[path.length - 2];

    // Create the JavaScript file
    if (!fs.existsSync(filePath)) {
      fs.writeFile(filePath, fileContent, (err) => {
        if (err) {
          console.error("Error creating the JavaScript file:", err);
        } else {
          if (folderName) {
            console.log(
              `${fileName} file in ${folderName} folder created successfully.`
            );
          } else {
            console.log(`${fileName} file created successfully.`);
          }
        }
      });
    } else {
      if (folderName) {
        console.log(`${fileName} file in ${folderName} folder already exists.`);
      } else {
        console.log(`${fileName} file already exists.`);
      }
    }
  };

  //Append File
  static appendFile = (filePath, lineNumbers, fileContents) => {
    let fileName = filePath.split("/");
    fileName = fileName[fileName.length - 1];

    //Read the file
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading the file:", err);
        return;
      }
      // Split the file content into an array of lines
      const lines = data.split("\n");
      let bool = false;
      for (let index = 0; index < lineNumbers.length; index++) {
        if (lines[lineNumbers[index]] !== fileContents[index]) {
          // Insert the new content at the specified line
          lines.splice(lineNumbers[index], 0, fileContents[index]);
          bool = true;
        } else {
          console.log(
            `${fileName}-- line number: ${lineNumbers[index]} already contain "${fileContents[index]}"`
          );
        }
      }

      // Join the lines back together into a single string
      const updatedContent = lines.join("\n");

      // Write the updated content back to the file
      fs.writeFile(filePath, updatedContent, (err) => {
        if (err) {
          console.error("Error writing to the file:", err);
        } else {
          if (bool) {
            console.log(`${fileName} updated successfully`);
          } else {
            console.log(`${fileName} already upto dated`);
          }
        }
      });
    });
  };

  //Install Packages
  static runScripts = (projectDirectory, commandToRun) => {
    if (projectDirectory) {
      // Change the current working directory to the project directory
      process.chdir(projectDirectory);
    }

    // Execute the command
    const childProcess = exec(commandToRun, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        // You might want to handle the error here, e.g., exit the script or take appropriate action.
      } else {
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          // Handle any error messages in stderr.
        }
        console.log(`stdout: ${stdout}`);
      }
    });

    // You can also handle other events like 'close' or 'error' as needed.
  };
}

module.exports = FsServices;
