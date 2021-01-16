import { Circle } from '.';
import { ICircle } from './Circle';
import { Models } from '@tosios/common';
import { type } from '@colyseus/schema';

export interface IMonster extends ICircle {
    type: Models.PropType;
}

export class Prop extends Circle {
    //
    // Sync fields
    //
    @type('string')
    public type: Models.PropType;

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
