declare module 'react-simple-maps' {
    import { ComponentType, ReactNode } from 'react';

    export interface ComposableMapProps {
        projection?: string;
        projectionConfig?: {
            scale?: number;
            center?: [number, number];
            rotate?: [number, number, number];
        };
        width?: number;
        height?: number;
        style?: React.CSSProperties;
        children?: ReactNode;
    }

    export interface ZoomableGroupProps {
        center?: [number, number];
        zoom?: number;
        minZoom?: number;
        maxZoom?: number;
        translateExtent?: [[number, number], [number, number]];
        onMoveStart?: (position: { coordinates: [number, number]; zoom: number }) => void;
        onMove?: (position: { coordinates: [number, number]; zoom: number }) => void;
        onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
        children?: ReactNode;
    }

    export interface GeographiesProps {
        geography: string | object;
        children: (props: { geographies: GeographyType[] }) => ReactNode;
    }

    export interface GeographyType {
        rsmKey: string;
        properties: Record<string, unknown>;
        geometry: object;
    }

    export interface GeographyProps {
        geography: GeographyType;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        style?: {
            default?: React.CSSProperties & { outline?: string };
            hover?: React.CSSProperties & { outline?: string };
            pressed?: React.CSSProperties & { outline?: string };
        };
        onClick?: () => void;
        onMouseEnter?: () => void;
        onMouseLeave?: () => void;
    }

    export interface MarkerProps {
        coordinates: [number, number];
        style?: React.CSSProperties;
        onClick?: () => void;
        onMouseEnter?: () => void;
        onMouseLeave?: () => void;
        children?: ReactNode;
    }

    export const ComposableMap: ComponentType<ComposableMapProps>;
    export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
    export const Geographies: ComponentType<GeographiesProps>;
    export const Geography: ComponentType<GeographyProps>;
    export const Marker: ComponentType<MarkerProps>;
}
