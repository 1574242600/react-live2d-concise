import React from 'react';
import { Live2dProps, Live2dDefaultProps, setModelBlobUrl } from './define';
import { Delegate } from './live2d/delegate';


export default class Live2d extends React.Component<Live2dProps> {
    private canvas: React.RefObject<HTMLCanvasElement> = React.createRef();
    static defaultProps: Readonly<Live2dDefaultProps>;

    constructor(props: Readonly<Live2dProps>) {
        super(props);
    }

    bindOn(canves: HTMLCanvasElement): void {
        for (const v in this.props.on) {
            canves[v] = this.props.on[v];
        }
    }

    componentDidMount(): void {
        const canves = this.canvas.current;
        setModelBlobUrl(this.props.model[0]);

        this.bindOn(canves);
        if (Delegate.getInstance().initialize(canves) == false) {
            return;
        }

        Delegate.getInstance().run();
    }

    componentWillUnmount(): void {
        Delegate.releaseInstance();
    }

    render(): JSX.Element {
        const {...props } = this.props;
        return (<canvas {...props} ref={this.canvas}> </canvas>);
    }
}

Live2d.defaultProps = {
    width: 1280,
    height: 720
};