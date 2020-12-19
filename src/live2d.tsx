import React, { LegacyRef } from 'react';
import { Live2dProps } from './define';
import { Delegate } from './live2d/delegate';


export default class Live2d extends React.Component<Live2dProps> {

    private canvas: React.RefObject<HTMLCanvasElement> = React.createRef();
    
    constructor(props: Readonly<Live2dProps>) {
        super(props);
    }

    componentDidMount(){
        if (Delegate.getInstance().initialize((this.canvas.current as unknown as HTMLCanvasElement)) == false) {
            return;
        }
        
        Delegate.getInstance().run();
    }

    componentWillUnmount() {
        Delegate.releaseInstance();
    }
    
    render() {
        const { model , ...props } = this.props;
        return (<canvas {...props} ref={this.canvas}> </canvas>)
    }
}