import React from 'react';

export let modelBlobUrl: string = null;

export function setModelBlobUrl(blobUrl: string) {
    modelBlobUrl = blobUrl;
}

export interface Live2dDefaultProps {
    width: string | number;
    height: string | number;
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

