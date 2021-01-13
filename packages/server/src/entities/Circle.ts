import { Entity } from '.';
import { Geometry } from '@tosios/common';
import { IEntity } from './Entity';
import { type } from '@colyseus/schema';

export interface ICircle extends IEntity {
    x: number;
    y: number;
    radius: number;
    rotation: number;
}

export class Circle extends Entity {
    //
    // Public fields
    //
    @type('number')
    public x: number;

    @type('number')
    public y: number;

    @type('number')
    public radius: number;

    @type('number')
    public rotation: number;

    //
    // Lifecycle
    //
    constructor(attributes: ICircle) {
        super(attributes);
        this.x = attributes.x;
        this.y = attributes.y;
        this.radius = attributes.radius;
        this.rotation = attributes.rotation;
    }

    //
    // Getters
    //
    get body(): Geometry.CircleBody {
        return new Geometry.CircleBody(this.x, this.y, this.radius);
    }
}
