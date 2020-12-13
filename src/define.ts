import React from 'react';

export interface Live2dProps {
    model: [ 
        name: string, 
        path: string
    ],
    className?: string;
    id?: string;
    style?: React.CSSProperties;
}