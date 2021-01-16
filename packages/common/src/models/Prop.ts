import { CircleJSON } from './Circle';
import { PropType } from '@halftheopposite/dungeon';

export interface PropJSON extends CircleJSON {
    type: PropType;
    active: boolean;
}
