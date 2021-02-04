import { Circle, ICircle } from './Circle';
import { Constants, Models } from '@tosios/common';
import { type } from '@colyseus/schema';

export interface IPlayer extends ICircle {
    type: Models.PlayerType;
    name: string;
    lives: number;
    maxLives: number;
}

export class Player extends Circle {
    //
    // Sync fields
    //
    @type('number')
    public type: Models.PlayerType;

    @type('string')
    public name: string;

    @type('number')
    public lives: number;

    @type('number')
    public maxLives: number;

    @type('number')
    public ack: number;

    //
    // Local fields
    //
    public lastShootAt: number;

    public lastHurtAt: number;

    //
    // Lifecycle
    //
    constructor(attributes: IPlayer) {
        super(attributes);
        this.type = attributes.type;
        this.name = validateName(attributes.name);
        this.lives = attributes.lives;
        this.maxLives = attributes.maxLives;
        this.ack = undefined;
        this.lastShootAt = undefined;
        this.lastHurtAt = undefined;
    }

    //
    // Methods
    //
    move(dirX: number, dirY: number, speed: number) {
        const { x, y } = Models.movePlayer(
            { x: this.x, y: this.y, w: this.radius * 2, h: this.radius * 2 },
            { x: dirX, y: dirY },
            speed,
        );
        this.setPosition(x, y);
    }

    hurt() {
        if (this.lives === 0) {
            return;
        }

        this.lives -= 1;
        this.lastHurtAt = Date.now();
    }

    heal() {
        if (this.lives === this.maxLives) {
            return;
        }

        this.lives += 1;
    }

    canBeHurt(): boolean {
        return !this.lastHurtAt || this.lastHurtAt + Constants.PLAYER_HURT_BACKOFF < Date.now();
    }

    //
    // Getters
    //
    get isAlive(): boolean {
        return this.lives > 0;
    }

    get isFullLives(): boolean {
        return this.lives === this.maxLives;
    }

    //
    // Setters
    //
    setName(name: string) {
        this.name = validateName(name);
    }
}

const validateName = (name: string) => name.trim().slice(0, 16);
