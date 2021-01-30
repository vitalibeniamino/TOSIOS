import { CircleJSON } from './Circle';
import { MonsterType } from '@halftheopposite/dungeon';

export type MonsterState = 'idle' | 'chase' | 'aim' | 'attack' | 'home';
export interface MonsterJSON extends CircleJSON {
    type: MonsterType;
    state: MonsterState;
}
