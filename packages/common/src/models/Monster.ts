import { CircleJSON } from './Circle';
import { MonsterType } from '@halftheopposite/dungeon';

export type MonsterState = 'idle' | 'patrol' | 'chase';
export interface MonsterJSON extends CircleJSON {
    type: MonsterType;
    state: MonsterState;
}
