import React from 'react';
import { setModelBlobUrl } from './define';
import { Delegate } from './live2d/delegate';
import { Live2dDefaultProps, Live2dProps } from './type';



export default class Live2d extends React.Component<Live2dProps> {
    private canvas: React.RefObject<HTMLCanvasElement> = React.createRef();
    static defaultProps: Readonly<Live2dDefaultProps>;

    constructor(props: Readonly<Live2dProps>) {
        super(props);
    }

    bindCanvesEvents(canves: HTMLCanvasElement): void {
        for (const v in this.props.on) {
            canves[v] = this.props.on[v];
        }
    }

    unbindCanvesEvents(canves: HTMLCanvasElement): void {
        for (const v in this.props.on) {
            canves[v] = null;
        }

        window.onmousemove = null; //可能副作用有点大。。。2333
    }

    componentDidMount(): void {
        const canves = this.canvas.current;
        setModelBlobUrl(this.props.model[0]);

        this.bindCanvesEvents(canves);
        if (Delegate.getInstance().initialize(canves) == false) {
            return;
        }

        Delegate.getInstance().run();
    }

    componentWillUnmount(): void {
        const canves = this.canvas.current;

        this.unbindCanvesEvents(canves);
        Delegate.releaseInstance();
    }

    render(): JSX.Element {
        const {...props } = this.props;
        return (<canvas {...props} ref={this.canvas}> </canvas>);
    }
}

Live2d.defaultProps = {
    width: 1280,
    height: 720,
    on: {}
};