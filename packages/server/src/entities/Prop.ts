import { Circle } from '.';
import { Collisions } from '@tosios/common';
import { ICircle } from './Circle';
import { PropType } from '@halftheopposite/dungeon';
import { type } from '@colyseus/schema';

const PROP_LIVES = 3;

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
    // Local fields
    //
    private lives?: number;

    //
    // Lifecycle
    //
    constructor(attributes: IMonster) {
        super(attributes);

        this.type = attributes.type;
        this.active = true;
        this.lives = Collisions.HURTABLE_PROPS.includes(attributes.type) ? PROP_LIVES : undefined;
    }

    //
    // Methods
    //
    hurt() {
        this.lives -= 1;
    }

    //
    // Getters
    //
    get isAlive(): boolean {
        return this.lives > 0;
    }
}
