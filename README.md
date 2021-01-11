# React-live2d-concise
A simple live2d React component

[简体中文](https://github.com/1574242600/react-live2d-concise/blob/main/README_CN.md)
## Install
```bash
npm install react-live2d-concise -save
```

## Use
Need to reference live2dcubismcore.js first  

```html
<script src="https://cdn.jsdelivr.net/gh/1574242600/react-live2d-concise/lib/Core/live2dcubismcore.min.js"></script>
```
Then use it like other components that need to request data  

```js
import React from'react';
import Live2d, {toBlob} from'react-live2d-concise';

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      blobUrl: null
    }
  }

  componentDidMount() {
    //Absolute address of model entry json
    //File name is not required
    toBlob('http://*.*/*.model3.json').then((blobUrl) => {
      this.setState({
        blobUrl: blobUrl
      })
    })
  }
  render() {
    const {blobUrl} = this.state;

    return (
      <div>
            {blobUrl !== null && <Live2d model={[blobUrl]} />}
      </div>
    );
  }
}

```

## Demo
demo1: [https://vy9ge.csb.app/](https://vy9ge.csb.app/)  
demo2(Loading animation): [https://iwnck.csb.app/](https://iwnck.csb.app/)  
demo3(Event listen): [https://mxgp5.csb.app/](https://mxgp5.csb.app/)  

## Documentation
Components:

| Attribute | Description                   | Type                | Default Value         |
| --------- | ----------------------------- | ------------------- | --------------------- |
| model     | model blob url and model name | [string, string]    | [Required, undefined] |
| on        | canvas dom events               | object              | undefined             |
| width     | HTMLCanvasElement.width       | string \| number    | 1280                  |
| height    | HTMLCanvasElement.height      | string \| number    | 720                   |
| className | React classNam                | string              | undefined             |
| id        | Element id                    | string              | undefined             |
| style     | React CSS                     | React.CSSProperties | undefined             |
<br />

```js
on?: {
    ontouchstart?: (e: TouchEvent) => void,
    ontouchmove?: (e: TouchEvent) => void,
    ontouchend?: (e: TouchEvent) => void,
    ontouchcancel?: (e: TouchEvent) => void ,
    onmousemove?: [
      isWindow: boolean,  // Whether to listen to mousemove events on the window If you listen on the window, please make sure that no other js listens to the mousemove events on the window
      onmousemove: (e: MouseEvent) => void
    ],
    onmouseup?: (e: MouseEvent) => void,
    onmousedown?: (e: MouseEvent) => void,
    //onTap?: (x: number, y: number, model: Model) => void,
}
```
---------------------------------------------------------------------------------

toBlob()

```js
/**
 * Replace all resource urls in the model json with blob url
 * @name toBlob
 * @param modelJsonUrl string model json path
 * @return string blob url of model json
 */
```

## Precautions 
Only supports moc3 and above models
<br />
<br />

## Use open source projects
Thx.
- [CubismWebFramework](https://github.com/Live2D/CubismWebFramework)- see: [LICENSE](https://github.com/Live2D/CubismWebFramework/blob/develop/LICENSE.md)
- [CubismWebSamples](https://github.com/Live2D/CubismWebSamples)- see: [LICENSE](https://github.com/Live2D/CubismWebSamples/blob/develop/LICENSE.md)

## Todo
- [ ] Event support
- [ ] Custom webGL, canvas parameters

## LICENSE
Hybrid license

Please be sure to check [LICENSE](https://github.com/1574242600/react-live2d-concise/blob/main/LICENSE)
