import { Circle, ICircle } from './Circle';
import { type } from '@colyseus/schema';

export interface IBullet extends ICircle {
    playerId: string;
    rotation: number;
    shotAt: number;
}

export class Bullet extends Circle {
    //
    // Sync fields
    //
    @type('string')
    public playerId: string;

    @type('number')
    public fromX: number;

    @type('number')
    public fromY: number;

    @type('boolean')
    public active: boolean;

    @type('number')
    public shotAt: number;

    //
    // Lifecycle
    //
    constructor(attributes: IBullet) {
        super(attributes);
        this.playerId = attributes.playerId;
        this.fromX = attributes.x;
        this.fromY = attributes.y;
        this.active = true;
        this.shotAt = attributes.shotAt;
    }

    //
    // Methods
    //
    move(speed: number) {
        this.x += Math.cos(this.rotation) * speed;
        this.y += Math.sin(this.rotation) * speed;
    }

    reset(attributes: IBullet) {
        this.id = attributes.id;
        this.x = attributes.x;
        this.y = attributes.y;
        this.radius = attributes.radius;
        this.rotation = attributes.rotation;
        this.playerId = attributes.playerId;
        this.fromX = attributes.x;
        this.fromY = attributes.y;
        this.active = true;
        this.shotAt = attributes.shotAt;
    }
}
