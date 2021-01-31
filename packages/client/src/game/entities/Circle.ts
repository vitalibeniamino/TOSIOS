import { AnimatedSprite, Container, Graphics, Texture } from 'pixi.js';
import { Constants, Geometry } from '@tosios/common';
import { Entity, IEntity } from './Entity';

export interface ICircle extends IEntity {
    x: number;
    y: number;
    radius: number;
    rotation: number;
    textures: Texture[];
    zIndex?: number;
}

export class Circle extends Entity {
    container: Container;

    sprite: AnimatedSprite;

    body: Geometry.CircleBody;

    debug?: Graphics;

    //
    // Lifecycle
    //
    constructor(attributes: ICircle) {
        super(attributes);
        this.container = new Container();

        // Sprite
        this.sprite = new AnimatedSprite(attributes.textures);
        this.sprite.anchor.set(0.5);
        this.sprite.position.set(attributes.radius, attributes.radius);
        this.sprite.width = attributes.radius * 2;
        this.sprite.height = attributes.radius * 2;
        this.sprite.animationSpeed = 0.1;
        this.sprite.zIndex = attributes.zIndex || 0;
        this.sprite.play();
        this.container.addChild(this.sprite);

        // Debug
        if (Constants.DEBUG) {
            this.debug = new Graphics();
            this.debug.lineStyle(0.5, 0xff00ff);
            this.debug.drawCircle(this.container.width / 2, this.container.height / 2, this.container.width / 2);
            this.debug.drawRect(0, 0, this.container.width, this.container.height);
            this.debug.endFill();
            this.container.addChild(this.debug);
        }

        // Container
        this.container.pivot.set(this.container.width / 2, this.container.height / 2);
        this.container.x = attributes.x;
        this.container.y = attributes.y;
        this.container.sortChildren();

        // Body
        this.body = new Geometry.CircleBody(attributes.x, attributes.y, attributes.radius);
    }

    //
    // Methods
    //
    playAnimation = (anim: Texture[], idle: Texture[]) => {
        this.sprite.stop();
        this.sprite.loop = false;
        this.sprite.textures = anim;
        this.sprite.onComplete = () => {
            this.sprite.textures = idle;
            this.sprite.loop = true;
            this.sprite.play();
        };

        this.sprite.play();
    };

    //
    // Setters
    //
    set visible(visible: boolean) {
        this.container.visible = visible;
    }

    set x(x: number) {
        this.container.x = x;
        this.body.x = x;
    }

    set y(y: number) {
        this.container.y = y;
        this.body.y = y;
    }

    set rotation(rotation: number) {
        this.sprite.rotation = rotation;
    }

    //
    // Getters
    //
    get visible(): boolean {
        return this.container.visible;
    }

    get x(): number {
        return this.body.x;
    }

    get y(): number {
        return this.body.y;
    }

    get width(): number {
        return this.body.width;
    }

    get height(): number {
        return this.body.height;
    }

    get rotation(): number {
        return this.sprite.rotation;
    }
}
