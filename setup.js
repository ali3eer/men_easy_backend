const content = require("./setupContent");
const FsServices = require("./FsServices");
const currentPath = process.cwd() + "\\backend";

const setup = () => {
  const test = () => {
    for (let index = 0; index < content.length; index++) {
      const path = content[index].filePath.split("/");
      if (path.length > 2) {
        let newPath = ".";
        for (let index = 1; index < path.length - 1; index++) {
          newPath = newPath + "/" + path[index];
          console.log(newPath);
          FsServices.createFolder(newPath);
        }
      }

      FsServices.createFile(
        content[index].filePath,
        content[index].fileContent
      );
    }
  };
  test();

  FsServices.runScripts(currentPath, "npm install");
};

module.exports = setup;
