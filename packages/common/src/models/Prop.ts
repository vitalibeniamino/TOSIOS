import { CircleJSON } from './Circle';

export type PropType = 'potion-red';
export interface PropJSON extends CircleJSON {
    type: PropType;
    active: boolean;
}
