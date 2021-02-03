import { Circle } from '.';
import { Constants } from '@tosios/common';
import { ICircle } from './Circle';
import { PropType } from '@halftheopposite/dungeon';
import { type } from '@colyseus/schema';

export interface IProp extends ICircle {
    type: PropType;
    lives?: number;
    toX?: number;
    toY?: number;
}

export class Prop extends Circle {
    //
    // Sync fields
    //
    @type('number')
    public type: PropType;

    @type('number')
    public activatedAt?: number;

    //
    // Local fields
    //
    private lives?: number;

    public toX?: number;

    public toY?: number;

    //
    // Lifecycle
    //
    constructor(attributes: IProp) {
        super(attributes);

        this.type = attributes.type;
        this.lives = attributes.lives;
        this.toX = attributes.toX;
        this.toY = attributes.toY;
    }

    //
    // Methods
    //
    hurt() {
        this.lives -= 1;
    }

    activate() {
        this.activatedAt = Date.now() + Constants.PROP_TRAP_START_DELAY;
    }

    canHurt() {
        const now = Date.now();
        return this.activatedAt < now && now < this.activatedAt + Constants.PROP_TRAP_HURT_DURATION;
    }

    canActivate() {
        return !this.activatedAt || this.activatedAt + Constants.PROP_TRAP_HURT_DURATION < Date.now();
    }

    //
    // Getters
    //
    get isAlive(): boolean {
        return this.lives > 0;
    }
}
