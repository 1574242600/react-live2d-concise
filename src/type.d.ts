import { Model } from './live2d/model';

export type ValueOf<T> = T[keyof T];

export interface Live2dDefaultProps {
    width: string | number;
    height: string | number;
    on: Live2dProps['on']
}

export interface Live2dProps {
    model: [
        path: string,
        name?: string
    ],
    width: string | number;
    height: string | number;
    className?: string;
    id?: string;
    style?: React.CSSProperties;
    on?: {
        ontouchstart?: (e: TouchEvent) => void,
        ontouchmove?: (e: TouchEvent) => void,
        ontouchend?: (e: TouchEvent) => void,
        ontouchcancel?: (e: TouchEvent) => void ,
        onmousemove?: [
            isWindow: boolean, 
            onmousemove: (e: MouseEvent) => void
        ],
        onmouseup?: (e: MouseEvent) => void,
        onmousedown?: (e: MouseEvent) => void,
        onTap?: (x: number, y: number, model: Model) => void,
    }
}

export interface model3Motion {
    File: string,
    Sound?: string,
    FadeInTime?: number,
    FadeOutTime?: number
}

export interface model3Object { //不全
    Version: 3,
    FileReferences: {
        Moc: string,
        Textures: string[],
        Physics: string,
        Pose?: string,
        UserData: string,
        Motions?: Record<string, model3Motion[]>,
        Groups?: {
            Target: string,
            Name: string,
            Ids: string[]
        }[],
        HitAreas?: {
            Id: string,
            Name: string
        }[],
        Expressions?: {
            Name: string,
            File: string,
        }[]
    }
}