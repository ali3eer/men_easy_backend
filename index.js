const createEntity = require("./create");
const setup = require("./setup");

// Get the function name and arguments from command-line arguments
const args = process.argv;
const functionName = args[2];

// Check if the function name is valid and exists
if (functionName == "setup") {
  setup();
} else if (functionName == "create") {
  createEntity();
} else {
  console.error("Function not found or invalid.");
}

module.exports = { createEntity, setup };
