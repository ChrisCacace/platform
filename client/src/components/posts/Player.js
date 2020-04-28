import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Player extends Component {
  static propTypes = {
    ampLoadTimeout: PropTypes.number,
    sourceVideo: PropTypes.object
  }

  static defaultProps = {
    ampLoadTimeout: 300,
  };

  componentDidMount() {
    this.waitForAmp().then((amp) => {
      this.videoPlayer = this.createVideoPlayer(amp);
      this.videoPlayer.src({
        "src": "//amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest",
        "type": "application/vnd.ms-sstr+xml"
      });
    }).catch(e => console.error('Could not find Azure Media Player plugin', e));
  }

  createVideoPlayer = (amp) => {
    const video = amp(this.videoRef, {
      nativeControlsForTouch: false,
      autoplay: false,
      width: "640",
      height: "400",
      controls: true,
      logo: { enabled: false },
      techOrder: [
        'azureHtml5JS',
        'html5FairPlayHLS',
        'html5',
      ],
      plugins: {
        appInsights: {
            //add additonal plugin options here
            'debug': true
        },
        ga: {
            //'eventLabel' : 'EventLabelForTracking', //default is URL source
            'debug': false, //default is false
            'eventsToTrack': ['playerConfig', 'loaded', 'playTime', 'percentsPlayed', 'start', 'error', 'buffering', 'bitrate'], // default is ['playerConfig', 'loaded', 'playTime', 'percentsPlayed', 'start', 'end', 'play', 'pause', 'error', 'buffering', 'fullscreen', 'seek', 'bitrate']
            'percentsPlayedInterval': 20 //default is 20
        }
    }
    });

    video.addEventListener(amp.eventName.error, (errorDetails) => {
      console.log(errorDetails);
    });

    video.addEventListener('ended', function() {
      console.log('Finished!');
  });

    return video;
  }

  waitForAmp = () => {
    return new Promise((resolve, reject) => {
      let waited = 0;
      const wait = (interval) => {
        setTimeout(() => {
            waited += interval;
            const amp = window['amp'];
            if (amp !== undefined) {
            return resolve(amp);
            }
            if (waited >= this.props.ampLoadTimeout * 100) {
            return reject();
            }
            wait(interval * 2);
            return null;
        }, interval);
      };
      wait(30);
    });
  }

  render() {
    
    return (
      <div className="Player-video-container">
        <video
          className="azuremediaplayer amp-default-skin amp-big-play-centered"
          ref={(input) => { this.videoRef = input; }}
          style={{ width: '100%' }} tabIndex="0"
        >
        </video>
      </div>
    );
  }
}

export default Player;
