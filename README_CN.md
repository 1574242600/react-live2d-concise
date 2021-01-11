# React-live2d-concise
一个简单的live2d React 组件

## 安装
```bash
npm install react-live2d-concise -save
```

## 使用
需要先引用 live2dcubismcore.js  

```html
<script src="https://cdn.jsdelivr.net/gh/1574242600/react-live2d-concise/lib/Core/live2dcubismcore.min.js"></script>
```

然后就像其他需要请求数据的组件一样使用  

```js
import React from 'react';
import Live2d, { toBlob } from 'react-live2d-concise';

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      blobUrl: null
    }
  }

  componentDidMount() {
    //模型入口json 的绝对地址
    //文件名没有要求
    toBlob('http://*.*/*.model3.json').then((blobUrl) => {
      this.setState({
          blobUrl: blobUrl
      })
    })
  }

  render() {
    const { blobUrl } = this.state;

    return (
      <div>
        { blobUrl !== null && <Live2d model={[blobUrl]} />}
      </div>
    );
  }
}

```

## Demo
demo1: [https://vy9ge.csb.app/](https://vy9ge.csb.app/)  
demo2(加载中动画): [https://iwnck.csb.app/](https://iwnck.csb.app/)  
demo3(事件监听): [https://mxgp5.csb.app/](https://mxgp5.csb.app/)  

## 文档
组件:  

| 属性      | 说明                       | 类型                | 默认值            |
| --------- | -------------------------- | ------------------- | ----------------- |
| model     | 模型 blob url 和 模型 name | [string, string]    | [必选, undefined] |
| on        | canvas dom 事件            | object              | undefined         |
| width     | HTMLCanvasElement.width    | string \| number    | 1280              |
| height    | HTMLCanvasElement.height   | string \| number    | 720               |
| className | React className            | string              | undefined         |
| id        | Element id                 | string              | undefined         |
| style     | React CSS                  | React.CSSProperties | undefined         |
<br />

```js
on?: {
    ontouchstart?: (e: TouchEvent) => void,
    ontouchmove?: (e: TouchEvent) => void,
    ontouchend?: (e: TouchEvent) => void,
    ontouchcancel?: (e: TouchEvent) => void ,
    onmousemove?: [
      isWindow: boolean,  // 是否在window上监听mousemove事件   如果在window上监听，请确保没有其它的js在window上监听mousemove事件
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
 * 将模型json里所有资源 url 替换为 blob url
 * @name toBlob 
 * @param modelJsonUrl string 模型json路径
 * @return string 模型json的blob url
 */
```

## 注意事项 
仅支持moc3及以上版本的模型
<br />
<br />

## 使用开源项目
Thx.
- [CubismWebFramework](https://github.com/Live2D/CubismWebFramework) - see: [LICENSE](https://github.com/Live2D/CubismWebFramework/blob/develop/LICENSE.md)
- [CubismWebSamples](https://github.com/Live2D/CubismWebSamples) - see: [LICENSE](https://github.com/Live2D/CubismWebSamples/blob/develop/LICENSE.md)

## Todo
- [ ] 事件支持
- [ ] 自定义 webGL, canvas参数

## LICENSE
混合许可  

请务必查看 [LICENSE](https://github.com/1574242600/react-live2d-concise/blob/main/LICENSE)
