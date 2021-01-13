import { Circle, ICircle } from './Circle';
import { Maths } from '@tosios/common';
import { type } from '@colyseus/schema';

export interface IPlayer extends ICircle {
    name: string;
    lives: number;
    maxLives: number;
}

export class Player extends Circle {
    //
    // Public fields
    //
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
    // Private fields
    //
    public lastShootAt: number;

    //
    // Lifecycle
    //
    constructor(attributes: IPlayer) {
        super(attributes);
        this.name = validateName(attributes.name);
        this.lives = attributes.lives;
        this.maxLives = attributes.maxLives;
        this.kills = 0;
        this.ack = 0;
        this.lastShootAt = undefined;
    }

    //
    // Methods
    //
    move(dirX: number, dirY: number, speed: number) {
        const magnitude = Maths.normalize2D(dirX, dirY);

        const speedX = Math.round(Maths.round2Digits(dirX * (speed / magnitude)));
        const speedY = Math.round(Maths.round2Digits(dirY * (speed / magnitude)));

        this.x += speedX;
        this.y += speedY;
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
    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    setRotation(rotation: number) {
        this.rotation = rotation;
    }

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
