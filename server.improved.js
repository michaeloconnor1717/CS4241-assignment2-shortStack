const { json } = require("stream/consumers");

const http = require("http"),
  fs = require("fs"),
  // IMPORTANT: you must run `npm install` in the directory for this assignment
  // to install the mime library used in the following line of code
  mime = require("mime"),
  dir = "public/",
  port = 3000;

const appdata = {
  Stats: {
    Major: {
      majorCS: 2,
      majorRBE: 0,
      majorID: 0,
      majorME: 0,
      majorEE: 1,
      majorOther: 0,
    },
    AvgAnswers: {
      outlookForIOS: 2,
      Platypus: 3,
      Perry: 2,
    },
  },
  User1: {
    fName: 'Michael',
    lName: 'O\'Connor',
    outlookRadio: '4',
    platypus: '3',
    perry: '3',
    Majors: [ 'majorCS']
  },
  User2: {
    fName: 'Qui',
    lName: 'Nguyen',
    outlookRadio: '1',
    platypus: '3',
    perry: '2',
    Majors: [ 'majorCS']
  },
  User3: {
    fName: 'Josh',
    lName: 'Hollyer',
    outlookRadio: '1',
    platypus: '3',
    perry: '1',
    Majors: [ 'majorEE' ]
  }
};

let responseCnt = 3;
var responseJSON = { ...appdata };


const server = http.createServer(function (request, response) {
  if (request.method === "GET") {
    handleGet(request, response);
  } else if (request.method === "POST") {
    handlePost(request, response);
  }
});

const handleGet = function (request, response) {
  const filename = dir + request.url.slice(1);

  if (request.url === "/") {
    sendFile(response, "public/index.html");
  } 
  else if(request.url === "/submitted"){
    console.log("requested submitted data")
    response.writeHead(200, "OK", { "Content-Type": "text/plain" });
    response.end(JSON.stringify(responseJSON));
  }
  else {
    sendFile(response, filename);
  }
};

const handlePost = function (request, response) {
  let dataString = "";

  request.on("data", function (data) {
    dataString += data;
  });

  request.on("end", function () {
    if (request.url === "/submit") {
      responseCnt++;
      console.log(dataString);

      let userData = JSON.parse(dataString);
      updateStats(userData);

      userData = handleMajors(userData);
      if(Object.keys(userData).length != 6 ){
        response.writeHead(400, "Invalid number of keys")
        response.end();
        console.log("NOT ENOUGH INPUTS: "+ Object.keys(userData).length)
        return;
      }

      let newData = {
        ["User" + responseCnt]: { ...userData },
      };
      responseJSON = { ...responseJSON, ...newData };

      response.writeHead(200, "OK", { "Content-Type": "text/plain" });
      response.end(JSON.stringify(responseJSON));
      console.log("++++");
      console.log(responseJSON);
    } else {
      console.log("definitely not submit");
      if (request.url === "/delete") {
        console.log("Delete Requested");
        const attributeRegEx = /User[0-9]+/g;
        dataString = dataString.trim();
        if (
          attributeRegEx.test(dataString.trim()) &&
          responseJSON.hasOwnProperty(dataString.trim())
        ) {
          handleDeletedUser(dataString)
          delete responseJSON[dataString.trim()];
          response.writeHead(200, "OK", { "Content-Type": "text/plain" });
          response.end(JSON.stringify(responseJSON));
        } else {
          console.log("\t\t\t FAILED TO DELETE: " + dataString.trim());
          console.log(responseJSON);
          console.log(responseJSON.keys);
          console.log(attributeRegEx.test(dataString.trim()) + " " + dataString.trim())
          response.writeHead(400, "Invalid User ID", {
            "Content-Type": "text/plain",
          });
          response.end(dataString.trim());
        }
      }
    }
  });
};

const updateStats = function (newData) {
  appdata.Stats.AvgAnswers.outlookForIOS =
    (parseInt(newData.outlookRadio) +
      appdata.Stats.AvgAnswers.outlookForIOS * (responseCnt - 1)) /
    responseCnt;
  appdata.Stats.AvgAnswers.Platypus =
    (parseInt(newData.platypus) +
      appdata.Stats.AvgAnswers.Platypus * (responseCnt - 1)) /
    responseCnt;
  appdata.Stats.AvgAnswers.Perry =
    (parseInt(newData.perry) +
      appdata.Stats.AvgAnswers.Perry * (responseCnt - 1)) /
    responseCnt;

  if (newData.hasOwnProperty("majorCS")) appdata.Stats.Major.majorCS++;
  if (newData.hasOwnProperty("majorRBE")) appdata.Stats.Major.majorRBE++;
  if (newData.hasOwnProperty("majorID")) appdata.Stats.Major.majorID++;
  if (newData.hasOwnProperty("majorME")) appdata.Stats.Major.majorME++;
  if (newData.hasOwnProperty("majorEE")) appdata.Stats.Major.majorEE++;
  if (newData.hasOwnProperty("majorOther")) appdata.Stats.Major.majorOther++;
};

function handleMajors(userData) {
  let Majors = [];
  if (userData.hasOwnProperty("majorCS")) {
    Majors.push("majorCS");
    delete userData.majorCS;
  }
  if (userData.hasOwnProperty("majorRBE")) {
    Majors.push("majorRBE");
    delete userData.majorRBE;
  }
  if (userData.hasOwnProperty("majorID")) {
    Majors.push("majorID");
    delete userData.majorID;
  }
  if (userData.hasOwnProperty("majorME")) {
    Majors.push("majorME");
    delete userData.majorME;
  }
  if (userData.hasOwnProperty("majorEE")) {
    Majors.push("majorEE");
    delete userData.majorEE;
  }
  if (userData.hasOwnProperty("majorOther")) {
    Majors.push("majorOther");
    delete userData.majorOther;
  }
  userData = { ...userData, Majors };
  return userData;
}

function handleDeletedUser(userID){
  const majorArray = responseJSON[userID].Majors;
  
  for(const major in majorArray){
    if(responseJSON.Stats.Major.hasOwnProperty(major)){
      responseJSON.Stats.Major[major]--;
    }
  }

  const numOfUsers = Object.keys(responseJSON).length-1
  responseJSON.Stats.AvgAnswers.Perry = ((responseJSON.Stats.AvgAnswers.Perry*numOfUsers)-responseJSON[userID].perry)/(numOfUsers-1)
  responseJSON.Stats.AvgAnswers.Platypus = ((responseJSON.Stats.AvgAnswers.Platypus*numOfUsers)-responseJSON[userID].platypus)/(numOfUsers-1)
  responseJSON.Stats.AvgAnswers.outlookForIOS = ((responseJSON.Stats.AvgAnswers.outlookForIOS*numOfUsers)-responseJSON[userID].outlookRadio)/(numOfUsers-1)
}

const sendFile = function (response, filename) {
  const type = mime.getType(filename);

  fs.readFile(filename, function (err, content) {
    // if the error = null, then we've loaded the file successfully
    if (err === null) {
      // status code: https://httpstatuses.com
      response.writeHeader(200, { "Content-Type": type });
      response.end(content);
    } else {
      // file not found, error code 404
      response.writeHeader(404);
      response.end("404 Error: File Not Found");
    }
  });
};

server.listen(process.env.PORT || port);
