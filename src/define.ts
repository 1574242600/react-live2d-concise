import React from 'react';

export interface Live2dProps {
    model: [ 
        name: string, 
        path: string
    ],
    width: string | number;
    height: string | number;
    className?: string;
    id?: string;
    style?: React.CSSProperties;
}