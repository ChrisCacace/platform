# React Azure media player

[![NPM](https://img.shields.io/npm/v/react-azure-mp.svg)](https://www.npmjs.com/package/react-azure-mp) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
  
React wrapper for the [azure media player](http://ampdemo.azureedge.net/azuremediaplayer.html)

## Install

```bash
npm install --save react-azure-mp
```

## Usage

```jsx
import React, { Component } from 'react'
import { AzureMP } from 'react-azure-mp'

class Example extends Component {
  render() {
    return <AzureMP
             skin="amp-flush"
             src={[{src: "http://amssamples.streaming.mediaservices.windows.net/91492735-c523-432b-ba01-faba6c2206a2/AzureMediaServicesPromo.ism/manifest", type: "application/vnd.ms-sstr+xml" }]}
           />
  }
}
```

## Result
![Azure MP GIF](https://media.giphy.com/media/8YvvyfJ4pSIU0Bh4tw/giphy.gif)

## License

MIT © [SidKH](https://github.com/SidKH)
