import { EntityJSON } from './Entity';

export interface CircleJSON extends EntityJSON {
    x: number;
    y: number;
    radius: number;
    rotation: number;
}
