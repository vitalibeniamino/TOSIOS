import { CircleJSON } from './Circle';

export interface BulletJSON extends CircleJSON {
    playerId: string;
    fromX: number;
    fromY: number;
    active: boolean;
    shotAt: number;
}
