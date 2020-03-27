const { BlobServiceClient } = require('@azure/storage-blob');
const uuidv1 = require('uuid/v1');


const blobServiceClient = await BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerName = 'quickstart' + uuidv1();
console.log('\nCreating container...');
console.log('\t', containerName);

const containerClient = await blobServiceClient.getContainerClient(containerName);
const createContainerResponse = await containerClient.create();
console.log("Container was created successfully. requestId: ", createContainerResponse.requestId);

const blobName = 'quickstart' + uuidv1() + '.txt';
const blockBlobClient = containerClient.getBlockBlobClient(blobName);

console.log('\nUploading to Azure storage as blob:\n\t', blobName);

// Upload data to the blob
const data = 'Hello, World!';
const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
console.log("Blob was uploaded successfully. requestId: ", uploadBlobResponse.requestId);