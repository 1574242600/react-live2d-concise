import React, { LegacyRef } from 'react';
import { Live2dProps } from './define';
import { Delegate } from './live2d/delegate';


export default class Live2d extends React.Component<Live2dProps> {
    wrapper: React.RefObject<unknown>;
    canvas: LegacyRef<HTMLCanvasElement>;

    constructor(props: Readonly<Live2dProps>) {
        super(props);
        this.canvas = React.createRef();
    }

    componentDidMount(){
        if (Delegate.getInstance().initialize((this.canvas as unknown as HTMLCanvasElement)) == false) {
            return;
          }
        
        Delegate.getInstance().run();
    }

    render() {
        const { model , ...props } = this.props;
        return (<canvas {...props} ref={this.canvas}> </canvas>)
    }
}