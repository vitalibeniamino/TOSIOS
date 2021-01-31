import { Circle } from '.';
import { ICircle } from './Circle';
import { PropType } from '@halftheopposite/dungeon';
import { type } from '@colyseus/schema';

export interface IProp extends ICircle {
    type: PropType;
    lives?: number;
}

export class Prop extends Circle {
    //
    // Sync fields
    //
    @type('number')
    public type: PropType;

    //
    // Local fields
    //
    private lives?: number;

    //
    // Lifecycle
    //
    constructor(attributes: IProp) {
        super(attributes);

        this.type = attributes.type;
        this.lives = attributes.lives;
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
