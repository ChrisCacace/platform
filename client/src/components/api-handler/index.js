const axios = require('axios');
const uploadEndpoint = `http://localhost:5000/upload/media`;
export async function UploadFile(uploadFile) {
    console.log("Recieved Request to Upload File");
    console.log(uploadFile);
    const formData = new FormData();
    formData.append(`Files`, uploadFile.originFileObj);

    try {
        let res = await axios.post(uploadEndpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res;
    } catch (error) {
        throw error;
    }
}