import { Circle, ICircle } from './Circle';
import { Models } from '@tosios/common';
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
    public kills: number;

    @type('number')
    public ack: number;

    //
    // Local fields
    //
    public lastShootAt: number;

    //
    // Lifecycle
    //
    constructor(attributes: IPlayer) {
        super(attributes);
        this.type = attributes.type;
        this.name = validateName(attributes.name);
        this.lives = attributes.lives;
        this.maxLives = attributes.maxLives;
        this.kills = 0;
        this.ack = undefined;
        this.lastShootAt = undefined;
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
        this.lives -= 1;
    }

    heal() {
        this.lives += 1;
    }

    canBulletHurt(otherPlayerId: string): boolean {
        if (!this.isAlive) {
            return false;
        }

        if (this.id === otherPlayerId) {
            return false;
        }

        return true;
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
    setLives(lives: number) {
        if (lives) {
            this.lives = lives;
            this.kills = 0;
        } else {
            this.lives = 0;
        }
    }

    setName(name: string) {
        this.name = validateName(name);
    }

    setKills(kills: number) {
        this.kills = kills;
    }
}

const validateName = (name: string) => name.trim().slice(0, 16);
