const MediaServices = require('azure-arm-mediaservices');
const msRestAzure = require('ms-rest-azure');
const uuidv4 = require('uuid/v4');
const express = require('express')
const multer = require('multer')
const config = require('config');
const router = express.Router()
const azureStorage = require('azure-storage')
const getStream = require('into-stream')
const amsHelper = require('./amsHelper');
const inMemoryStorage = multer.memoryStorage()
const uploadStrategy = multer({
  storage: inMemoryStorage
}).single('Files')


const azureConnectionString = config.get('AZURE_STORAGE_CONNECTION_STRING');

const blobService = azureStorage.createBlobService(azureConnectionString)
const containerName = 'videos';
let streamingURL = "";


const handleError = (err, res) => {
  res.status(500);
  res.render('error', {
    error: err
  });
};

const getBlobName = originalName => {
  const identifier = Math.random().toString().replace(/0\./, ''); // remove "0." from start of string
  return `${identifier}-${originalName}`;
};

router.post('/', uploadStrategy, (req, res) => {

  console.log("Uploading File to Azure Blob Storage");
  const blobName = getBlobName(req.file.originalname);
  const stream = getStream(req.file.buffer);
  const streamLength = req.file.buffer.length;

  blobService.createBlockBlobFromStream(containerName, blobName, stream,
    streamLength, (err, result) => {
      if (err) {
        console.log("Failed to Upload File to Blob");
        console.log(err);
        handleError(err);
        return;
      }
      console.log("file successfully uploaded to Blob.");
      console.log(result);
      res.json(result);
    });
});

router.post('/media', uploadStrategy, (req, res) => {

  console.log("Executing POST request /media");
  // console.log(req);
  // console.log(req.file);
  const outputFolder = "Temp";
  const namePrefix = "prefix2";

  const encodingTransformName = "TransformWithAdaptiveStreamingPreset";

  let azureMediaServicesClient;

  msRestAzure.loginWithServicePrincipalSecret(config.aadClientId, config.aadSecret, config.aadTenantId, {
    environment: {
      activeDirectoryResourceId: config.armAadAudience,
      resourceManagerEndpointUrl: config.armEndpoint,
      activeDirectoryEndpointUrl: config.aadEndpoint
    }
  }, async function (err, credentials, subscriptions) {
    if (err) return console.log(err);
    azureMediaServicesClient = new MediaServices(credentials, config.subscriptionId, config.armEndpoint, {
      noRetryPolicy: true
    });
    amsHelper.setAzureMediaServicesClient(azureMediaServicesClient);
    try {
      // Ensure that you have the desired encoding Transform. This is really a one time setup operation.
      console.log("creating encoding transform...");
      let adaptiveStreamingTransform = {
        odatatype: "##Microsoft.Media.BuiltInStandardEncoderPreset",
        presetName: "AdaptiveStreaming"
      };

      let encodingTransform = await amsHelper.ensureTransformExists(config.resourceGroup, config.accountName, encodingTransformName, adaptiveStreamingTransform);
      console.log("Ensure Transform Exists Result");
      // console.log(encodingTransform);
      
      console.log("\n\ngetting job input from arguments...");
      let uniqueness = uuidv4();
      let input = await amsHelper.getJobInputFromArguments(config.resourceGroup, config.accountName, uniqueness, req.file);
      let outputAssetName = namePrefix + '-output-' + uniqueness;
      let jobName = namePrefix + '-job-' + uniqueness;
      let locatorName = "locator" + uniqueness;

      console.log("creating output asset...");
      let outputAsset = await amsHelper.createOutputAsset(config.resourceGroup, config.accountName, outputAssetName);

      console.log("submitting job...");
      let job = await amsHelper.submitJob(config.resourceGroup, config.accountName, encodingTransformName, jobName, input, outputAsset.name);
      
      var start = new Date().getTime();

      console.log("waiting for job to finish...");
      job = await amsHelper.waitForJobToFinish(config.resourceGroup, config.accountName, encodingTransformName, jobName);
      
      var end = new Date().getTime();
      var time = end - start;
      console.log("Time Taken : "+ time);

      if (job.state == "Finished") {
        // await amsHelper.downloadResults(config.resourceGroup, config.accountName, outputAsset.name, outputFolder);

        let locator = await amsHelper.createStreamingLocator(config.resourceGroup, config.accountName, outputAsset.name, locatorName);

        let urls = await amsHelper.getStreamingUrls(config.resourceGroup, config.accountName, locator.name);

        streamingURL = urls;

        console.log("Streaming URLs ............");
        console.log(urls);
        console.log("here" + streamingURL);
        // console.log("\ndeleting jobs ...");
        // await azureMediaServicesClient.jobs.deleteMethod(config.resourceGroup, config.accountName, encodingTransformName, jobName);
        // await azureMediaServicesClient.assets.deleteMethod(resourceGroup, accountName, outputAsset.name);

        // let jobInputAsset = input;
        // if (jobInputAsset && jobInputAsset.assetName) {
        //   await azureMediaServicesClient.assets.deleteMethod(config.resourceGroup, accountName, jobInputAsset.assetName);
        // }
      } else if (job.state == "Error") {
        console.log(`${job.name} failed. Error details:`);
        console.log(job.outputs[0].error);
        console.log(job);
      } else if (job.state == "Canceled") {
        console.log(`${job.name} was unexpectedly canceled.`);
      } else {
        console.log(`${job.name} is still in progress.  Current state is ${job.state}.`);
      }
      console.log("done with sample");
      console.log(streamingURL);
      res.status(200).send([streamingURL]);
    } catch (err) {
      console.log(err);
    }
  });
});

module.exports = router;