import React from 'react';
import ReactDOM from 'react-dom';
import { Live2dProps } from './define';
import { Delegate } from './live2d/delegate';


export default class Live2d extends React.Component<Live2dProps> {
    constructor(props: Readonly<Live2dProps>) {
        super(props);
    }

    componentDidMount(){
        const canvas = (ReactDOM.findDOMNode(this) as HTMLCanvasElement);
        if (Delegate.getInstance().initialize(canvas) == false) {
            return;
          }
        
        Delegate.getInstance().run();
    }

    render() {
        const { model , ...props } = this.props;
        return (<canvas {...props} > </canvas>)
    }
}