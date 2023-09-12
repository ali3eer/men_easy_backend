const readline = require("readline");
const create = require("./createContent");
const FsServices = require("./FsServices");
const currentPath = process.cwd();

const createEntity = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const questions = [
    "What is the name of this field?",
    "Is this field a relation with another field? (yes/no)",
    "Write the ref value as of the Collection you want to relate?",
    "What is the type of this field? (String, Number)",
    "Is this field required? (true/false)",
  ];

  const ans = ["name", "relation", "ref", "type", "required"];

  // An array to store responses for each person
  const responsesArray = [];

  // Function to ask questions for a single person
  function askQuestionsForPerson(personIndex, numPersons, entity) {
    console.log(entity);
    if (personIndex < numPersons) {
      console.log(`Field ${personIndex + 1}-------------`);
      const responses = {};

      function askQuestion(index) {
        if (index < questions.length) {
          rl.question(questions[index] + " ", (answer) => {
            // Check if we should ask the next question based on the response to question 1
            if (index === 1 && answer.toLowerCase() === "no") {
              askQuestion(index + 2);
            } else if (index === 2 && answer.toLowerCase() !== "") {
              responses[ans[index + 1]] = "id";
              askQuestion(index + 2);
            } else if (index === 1 && answer.toLowerCase() === "yes") {
              askQuestion(index + 1);
            } else {
              responses[ans[index]] = answer;
              askQuestion(index + 1);
            }
          });
        } else {
          // All questions have been answered for this person
          responsesArray.push(responses);
          askQuestionsForPerson(personIndex + 1, numPersons, entity);
        }
      }

      // Start asking questions for this person
      askQuestion(0);
    } else {
      responsesArray.forEach((responses, personIndex) => {
        console.log(`${personIndex + 1}st field ${responses?.name}*******`);
        console.log(responses);
      });

      // Ask the user to proceed
      proceed(responsesArray, entity);
    }
  }

  const proceed = (res, entity) => {
    rl.question("Do you want to proceed? (yes/no) ", (bool) => {
      if (bool !== "yes") {
        rl.close();
      } else {
        console.log(`Creating Entity ${entity} for you please wait...`);
        create(res, entity);
        rl.close();
      }
    });
  };

  const gettingFields = (entity) => {
    // Ask the user for the number of persons
    rl.question("How many fields do you want to create? ", (numPersons) => {
      numPersons = parseInt(numPersons);
      if (isNaN(numPersons) || numPersons <= 0) {
        console.log("Invalid input. Please enter a positive number.");
        rl.close();
      } else {
        askQuestionsForPerson(0, numPersons, entity);
      }
    });
  };

  if (FsServices.checkPath("./backend/server.js")) {
    // Ask the user for the number of persons
    rl.question(
      "What is the name of the entity you want to create? ",
      (entity) => {
        gettingFields(entity);
      }
    );
  } else {
    console.log("Please run the setup first");
    rl.close();
  }
};

module.exports = createEntity;
