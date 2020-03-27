import React, { useState, Fragment} from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { addPost } from '../../actions/post';
import { Upload, Typography, Modal, Icon, notification, Spin } from 'antd';
import { v4 as uuid } from 'uuid';
import {UploadFile} from './../api-handler'

import 'antd/dist/antd.css';

const { Dragger } = Upload;
const { Title } = Typography;

const PostForm = ({ addPost }) => {
  const [text, setText] = useState('');
  const [uploadFileList, setUploadFileList] = useState([]);
  const [uploadModalVisibility, setUploadModalVisibility] = useState(false);
  // const [uploadFile, setUploadFile] = useState();

  const dummyRequest = ({ file, onSuccess }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  };

  function notifyUploadProgress(count, total, notifcationKey) {
    notification.info({
      key: notifcationKey,
      message: `Uploading ${count} of ${total} File(s)`,
      icon: <Spin />,
      placement: "bottomRight",
      duration: 0, // Never Close
    });
  }

  function endUploadProgressProgress(total, notifcationKey, isSuccess) {

    if (isSuccess) {
      notification.success({
        key: notifcationKey,
        message: `Done Uploading ${total} File(s)`,
        placement: "bottomRight",
        duration: 5,
      });
    } else {
      notification.error({
        key: notifcationKey,
        message: `Failed to Upload ${total} File(s)`,
        placement: "bottomRight",
        duration: 5,
      });
    }
  }

  async function uploadModal_OnOk() {
    // Verify that user selected a file
    if (uploadFileList.length === 0) {
      notification['warning']({
        message: 'Alert!',
        description:
          `Please Select File(s) to Upload.`,
      });
      return;
    }

    let filesToUpload = uploadFileList;
    let notifcationKey = uuid();
    setUploadFileList([]);
    setUploadModalVisibility(false);

    let count = 1;
    let failedCount = 0;
    const total = filesToUpload.length;
    console.log("Total Files to Upload..."+total);
    notifyUploadProgress(count, total, notifcationKey);
    // Instead of Uploading One by One Sending Requests in parallel.
    filesToUpload.map(async (file) => {
      let res = await UploadFile(file);
      console.log(res);
      notifyUploadProgress(count++, total, notifcationKey);
    });

    // await Promise.all(
    //   filesToUpload.map(async (file) => {
    //     let res = await UploadFile(file);
    //     notifyUploadProgress(count++, total, notifcationKey);
    //     if (res.status === 200) {
    //       let fileMeta = res.data[0];
    //      } else {
    //         failedCount++;
    //     }
    //     return res;
    //   }));

    failedCount > 0
      ? endUploadProgressProgress(total, notifcationKey, false)
      : endUploadProgressProgress(total, notifcationKey, true);

  }
  function uploadFile_OnChange(changeEvent) {
    changeEvent.file.status = 'done';
    setUploadFileList(changeEvent.fileList);
  };
  function uploadModal_OnCancel(event) {
    // Hide File Upload Dialog
    setUploadModalVisibility(false);

    // Empty File Upload List
    setUploadFileList([]);
  };

  return (
    <div className='post-form'>
      <div className='bg-primary p'>
        <h3>Say Something...</h3>
      </div>
      <form
            className='form my-1'
            onSubmit={e => {
              e.preventDefault();
              addPost({ text });
              setText('');
            }}>
        <textarea
          name='text'
          cols='30'
          rows='5'
          placeholder='Create a post'
          value={text}
          onChange={e => setText(e.target.value)}
          required
        />
        <input type='submit' className='btn btn-dark my-1' value='Post' />
        <button onClick={ () => {setUploadModalVisibility(true)}}>upload</button>
        </form>

        <Modal  visible={uploadModalVisibility}
                okText={"Submit"}
                width="50%"
                onOk={uploadModal_OnOk}
                onCancel={uploadModal_OnCancel}>
        <Fragment>
          <Title level={3}>Select File(s)</Title>
          <Dragger name='files-dragger'
            accept='.jpg, .jpeg, .png, video/*'
            listType='picture'
            fileList={uploadFileList}
            multiple={true}
            customRequest={dummyRequest}
            onChange={uploadFile_OnChange}>
            {/* <p className="ant-upload-drag-icon">
              <Icon type="inbox" />
            </p> */}
            <p className="ant-upload-text">Click or drag files to this area to upload</p>
            <p className="ant-upload-hint">
              Support for a single or bulk upload. 
            </p>
          </Dragger>
        </Fragment>
      </Modal>

    </div>
  );
};

PostForm.propTypes = {
  addPost: PropTypes.func.isRequired
};

export default connect(
  null,
  { addPost }
)(PostForm);
