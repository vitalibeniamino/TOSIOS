import { CircleJSON } from './Circle';

export enum BulletType {
    Magic = 1,
}
export interface BulletJSON extends CircleJSON {
    type: BulletType;
    playerId: string;
    fromX: number;
    fromY: number;
    active: boolean;
    shotAt: number;
}
