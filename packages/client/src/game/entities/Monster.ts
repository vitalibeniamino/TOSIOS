import { Circle } from './';
import { Effects } from '../sprites';
import { Graphics } from 'pixi.js';
import { Models } from '@tosios/common';
import { MonsterType } from '@halftheopposite/dungeon';
import { MonstersTextures } from '../assets/images';

const HURT_COLOR = 0xff0000;
const ZINDEXES = {
    SHADOW: 0,
    MONSTER: 1,
};

export type MonsterDirection = 'left' | 'right';

export class Monster extends Circle {
    //
    // Sync fields
    //
    private _type: MonsterType;

    private _state: Models.MonsterState = 'idle';

    //
    // Local fields
    //
    private _toX: number = 0;

    private _toY: number = 0;

    private _direction: MonsterDirection = 'right';

    private _shadow: Graphics;

    //
    // Lifecycle
    //
    constructor(monster: Models.MonsterJSON) {
        super({
            id: monster.id,
            x: monster.x,
            y: monster.y,
            radius: monster.radius,
            rotation: monster.rotation,
            textures: [MonstersTextures.sprites[monster.type]],
            zIndex: ZINDEXES.MONSTER,
        });

        // Shadow
        this._shadow = new Graphics();
        this._shadow.zIndex = ZINDEXES.SHADOW;
        this._shadow.pivot.set(0.5);
        this._shadow.beginFill(0x000000, 0.3);
        this._shadow.drawEllipse(monster.radius, monster.radius * 2, monster.radius / 2, monster.radius / 4);
        this._shadow.endFill();
        this.container.addChild(this._shadow);

        // Sort rendering order
        this.container.sortChildren();

        // Prop
        this._type = monster.type;
        this._state = monster.state;
    }

    //
    // Methods
    //
    hurt() {
        Effects.flash(this.sprite, HURT_COLOR, 0xffffff);
    }

    //
    // Setters
    //
    set toX(toX: number) {
        this._toX = toX;
    }

    set toY(toY: number) {
        this._toY = toY;
    }

    set rotation(rotation: number) {
        this._direction = getDirection(rotation);
        switch (this._direction) {
            case 'left':
                this.sprite.scale.x = -2;
                break;
            case 'right':
                this.sprite.scale.x = 2;
                break;
            default:
                break;
        }
    }

    //
    // Getters
    //
    get toX() {
        return this._toX;
    }

    get toY() {
        return this._toY;
    }
}

/**
 * Get a direction given a rotation.
 */
function getDirection(rotation: number): MonsterDirection {
    if (rotation >= -(Math.PI / 2) && rotation <= Math.PI / 2) {
        return 'right';
    }

    return 'left';
}
