// require File System module
var fs = require("fs");
// require axios
var axios = require("axios");
// require json-2-csv module
const converter = require("json-2-csv");
// require sftpUpload module
var SftpUpload = require("sftp-upload");
require("dotenv").config();

// getting auth code from dotenv file so that our API codes are safe & doesn't go on Github public repos etc.
var authCode = process.env.AUTH_CODE;

// dates to query
var startDate = "2021-04-19";
var endDate = "2021-04-20";

// change it to any ID we want the script to filter to
var accountIdToFilter = "7227";

// query path - encode before making req
var queryPath = `https://data.mixpanel.com//api/2.0/export?from_date=${startDate}&to_date=${endDate}&event=["newSession - web"]&where=properties["accountID"]=="${accountIdToFilter}"`;

// axios config for GET
var config = {
  method: "get",
  url: queryPath,
  headers: {
    Authorization: `Basic ${authCode}`,
    Cookie: 'mp__origin=""; mp__origin_referrer=""',
  },
};

// sftp config
// path - Path of file to upload
// remoteDir - the remote directory to upload files to
let sftp_config = {
  host: "********************************",
  username: "********************************",
  password: "********************************",
  path: "./analytics.csv",
  remoteDir: "./dev",
};

// HTTP GET Call using Axios
axios(config)
  .then(function (res) {
    let data = res.data;

    /******************************** Processing data to be a valid JSON ********************************/
    let dataToProcess = data.replace(/}}/gi, "}}rem");
    dataToProcess = dataToProcess.substring(0, dataToProcess.length - 4);
    let arrToConvertCsv = dataToProcess.split("rem");
    let validJson = "[" + arrToConvertCsv + "]";
    /******************************** End processing data to be a valid JSON ********************************/

    /******************************** Write Parsed JSON to a CSV File ********************************/
    converter.json2csv(JSON.parse(validJson), (err, csv) => {
      if (err) {
        throw err;
      }
      fs.writeFileSync("analytics.csv", csv);
      /******************************* SFTP FILE WRITE START *******************************/
      sftp = new SftpUpload(sftp_config);
      sftp
        .on("error", function (err) {
          throw err;
        })
        .on("uploading", function (progress) {
          console.log("Uploading", progress.file);
          console.log(progress.percent + "% completed");
        })
        .on("completed", function () {
          console.log("Upload Completed");
        })
        .upload();
      /******************************* SFTP FILE WRITE ENDS *******************************/
    });
    /******************************** End Writing Parsed JSON to a CSV File ********************************/
  })
  .catch(function (error) {
    console.log(`Error: ${error}`);
    throw error;
  });
