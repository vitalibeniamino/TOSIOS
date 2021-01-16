import { Circle } from '.';
import { ICircle } from './Circle';
import { PropType } from '@halftheopposite/dungeon';
import { type } from '@colyseus/schema';

export interface IMonster extends ICircle {
    type: PropType;
}

export class Prop extends Circle {
    //
    // Sync fields
    //
    @type('number')
    public type: PropType;

    @type('boolean')
    public active: boolean;

    //
    // Lifecycle
    //
    constructor(attributes: IMonster) {
        super(attributes);

        this.type = attributes.type;
        this.active = true;
    }
}
