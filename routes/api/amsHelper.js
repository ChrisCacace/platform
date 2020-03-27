/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for
 * license information.
 */
'use strict';

const os = require("os");
const async = require('async');
const util = require('util');
const uuidv4 = require('uuid/v4');
const path = require('path');
const url = require('url');
const fs = require('fs');
const config = require('config');

const MediaServices = require('azure-arm-mediaservices');
const msRestAzure = require('ms-rest-azure');
const msRest = require('ms-rest');
const azureStorage = require('azure-storage');

const setTimeoutPromise = util.promisify(setTimeout);

const timeoutSeconds = 60 * 10;
const sleepInterval = 1000 * 15;
let azureMediaServicesClient;

const outputFolder = "Temp";
const namePrefix = "prefix2";

function setAzureMediaServicesClient(amsClient){
  azureMediaServicesClient = amsClient;
}
async function downloadResults(resourceGroup, accountName, assetName, resultsFolder) {
  let date = new Date();
  date.setHours(date.getHours() + 1);
  let input = {
    permissions: "Read",
    expiryTime: date
  }
  let assetContainerSas = await azureMediaServicesClient.assets.listContainerSas(resourceGroup, accountName, assetName, input);

  let containerSasUrl = assetContainerSas.assetContainerSasUrls[0] || null;
  let sasUri = url.parse(containerSasUrl);
  let sharedBlobService = azureStorage.createBlobServiceWithSas(sasUri.host, sasUri.search);
  let containerName = sasUri.pathname.replace(/^\/+/g, '');
  let directory = path.join(resultsFolder, assetName);
  try {
    fs.mkdirSync(directory);
  } catch (err) {
    // directory exists
  }
  console.log(`gathering blobs in container ${containerName}...`);
  function createBlobListPromise() {
    return new Promise(function (resolve, reject) {
      return sharedBlobService.listBlobsSegmented(containerName, null, (err, result, response) => {
        if (err) { reject(err); }
        resolve(result);
      });
    });
  }
  let blobs = await createBlobListPromise();
  console.log("downloading blobs to local directory in background...");
  for (let i = 0; i < blobs.entries.length; i++){
    let blob = blobs.entries[i];
    if (blob.blobType == "BlockBlob"){
      sharedBlobService.getBlobToLocalFile(containerName, blob.name, path.join(directory, blob.name), (error, result) => {
        if (error) console.log(error);
      });
    }
  }
}

async function waitForJobToFinish(resourceGroup, accountName, transformName, jobName) {
  let timeout = new Date();
  timeout.setSeconds(timeout.getSeconds() + timeoutSeconds);

  async function pollForJobStatus() {
    let job = await azureMediaServicesClient.jobs.get(resourceGroup, accountName, transformName, jobName);
    console.log(job.state);
    if (job.state == 'Finished' || job.state == 'Error' || job.state == 'Canceled') {
      return job;
    } else if (false/*new Date() > timeout*/) {
      console.log(`Job ${job.name} timed out.`);
      return job;
    } else {
      await setTimeoutPromise(sleepInterval, null);
      return pollForJobStatus();
    }
  }

  return await pollForJobStatus();
}

async function submitJob(resourceGroup, accountName, transformName, jobName, jobInput, outputAssetName) {
  let jobOutputs = [
    {
      odatatype: "#Microsoft.Media.JobOutputAsset",
      assetName: outputAssetName
    }
  ];

  return await azureMediaServicesClient.jobs.create(resourceGroup, accountName, transformName, jobName, {
    input: jobInput,
    outputs: jobOutputs
  });
}


async function getJobInputFromArguments(resourceGroup, accountName, uniqueness, inputFile) {
  if (inputFile) {
    let filepath = inputFile.path;
    let assetName = namePrefix + "-input-" + uniqueness;
    await createInputAsset(resourceGroup, accountName, assetName, inputFile);
    return {
      odatatype: "#Microsoft.Media.JobInputAsset",
      assetName: assetName
    }
  } else {
    return {
      odatatype: "#Microsoft.Media.JobInputHttp",
      files: [inputUrl]
    }
  }
}

async function createOutputAsset(resourceGroup, accountName, assetName) {
    return await azureMediaServicesClient.assets.createOrUpdate(resourceGroup, accountName, assetName, {});
}

async function createInputAsset(resourceGroup, accountName, assetName, fileToUpload) {
  let asset = await azureMediaServicesClient.assets.createOrUpdate(resourceGroup, accountName, assetName, {});
  let date = new Date();
  date.setHours(date.getHours() + 1);
  let input = {
    permissions: "ReadWrite",
    expiryTime: date
  }
  let response = await azureMediaServicesClient.assets.listContainerSas(resourceGroup, accountName, assetName, input);
  let uploadSasUrl = response.assetContainerSasUrls[0] || null;
  let fileName = fileToUpload.originalname
  let sasUri = url.parse(uploadSasUrl);
  let sharedBlobService = azureStorage.createBlobServiceWithSas(sasUri.host, sasUri.search);
  let containerName = sasUri.pathname.replace(/^\/+/g, '');
  let randomInt = Math.round(Math.random() * 100);
  let blobName = fileName + randomInt;
  console.log("uploading to blob...");

  // use createBlockBlobFromStream in case of stream
  // sharedBlobService.createAppendBlobFromStream(containerName, blobName, null, null,resolve);
  function createBlobPromise() {
    return new Promise(function (resolve, reject) {
      const stream = require('streamifier').createReadStream(fileToUpload.buffer);
      const streamLength = fileToUpload.buffer.length;
      // sharedBlobService.createAppendBlobFromBrowserFile(containerName, blobName, fileToUpload, resolve);
      sharedBlobService.createBlockBlobFromStream(containerName, blobName, stream, streamLength, resolve);
      // sharedBlobService.createBlockBlobFromLocalFile(containerName, blobName, fileToUpload, resolve);
    });
  }
  await createBlobPromise();
  return asset;
}

async function ensureTransformExists(resourceGroup, accountName, transformName, preset) {
  console.log("inside ensureTransformExists.....")
  let transform = await azureMediaServicesClient.transforms.get(resourceGroup, accountName, transformName);
  console.log("down here");

  if (!transform) {
    transform = await azureMediaServicesClient.transforms.createOrUpdate(resourceGroup, accountName, transformName, {
    name: transformName,
    location: config.region,
    outputs: [{
      preset: preset
    }]
  });
}
return transform;
}

async function createStreamingLocator(resourceGroup, accountName, assetName, locatorName)
{
  let streamingLocator = {
    assetName: assetName,
    streamingPolicyName: "Predefined_ClearStreamingOnly"
  };

  let locator = await azureMediaServicesClient.streamingLocators.create(
      resourceGroup,
      accountName,
      locatorName,
      streamingLocator);

  return locator;
}

async function getStreamingUrls(resourceGroup, accountName, locatorName)
{
  // Make sure the streaming endpoint is in the "Running" state.

  let streamingEndpoint = await azureMediaServicesClient.streamingEndpoints.get(resourceGroup, accountName, "default");

  let paths = await azureMediaServicesClient.streamingLocators.listPaths(resourceGroup, accountName, locatorName);

   for (let i = 0; i < paths.streamingPaths.length; i++){
      let path = paths.streamingPaths[i].paths[0];
      console.log("https://"+ streamingEndpoint.hostName + "//" + path);
    }
  let streamingUrl = ("https://" + streamingEndpoint.hostName +"//" + paths.streamingPaths[2].paths[0]);

  return streamingUrl;
}

module.exports.downloadResults = downloadResults;
module.exports.waitForJobToFinish = waitForJobToFinish;
module.exports.submitJob = submitJob;
module.exports.createOutputAsset = createOutputAsset;
module.exports.ensureTransformExists = ensureTransformExists;
module.exports.createStreamingLocator = createStreamingLocator;
module.exports.getStreamingUrls = getStreamingUrls;
module.exports.getJobInputFromArguments = getJobInputFromArguments;
module.exports.setAzureMediaServicesClient = setAzureMediaServicesClient;