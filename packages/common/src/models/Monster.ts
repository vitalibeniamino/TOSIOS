import { CircleJSON } from './Circle';

export type MonsterState = 'idle' | 'patrol' | 'chase';
export type MonsterType = 'bat';
export interface MonsterJSON extends CircleJSON {
    type: MonsterType;
    state: MonsterState;
}
