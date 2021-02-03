import { Circle } from './Circle';
import { Effects } from '../sprites';
import { Models } from '@tosios/common';
import { PropTextures } from '../assets/images';
import { PropType } from '@halftheopposite/dungeon';

const HURT_COLOR = 0xff0000;
const ZINDEXES = {
    SHADOW: 0,
    PROP: 1,
};

export class Prop extends Circle {
    //
    // Sync fields
    //
    private _type: PropType;

    private _activatedAt?: number;

    //
    // Local fields
    //
    private _toX: number = 0;

    private _toY: number = 0;

    //
    // Lifecycle
    //
    constructor(prop: Models.PropJSON) {
        super({
            id: prop.id,
            x: prop.x,
            y: prop.y,
            radius: prop.radius,
            rotation: prop.rotation,
            // @ts-ignore
            textures: PropTextures.sprites[prop.type][getDefaultAnimation(prop.type)],
            zIndex: ZINDEXES.PROP,
        });

        // Sort rendering order
        this.container.sortChildren();

        // Prop
        this._type = prop.type;
        this._activatedAt = prop.activatedAt;
        this._toX = prop.x;
        this._toY = prop.y;
    }

    //
    // Methods
    //
    hurt() {
        Effects.flash(this.sprite, HURT_COLOR, 0xffffff);

        // @ts-ignore
        this.playAnimation(PropTextures.sprites[this.type].anim, PropTextures.sprites[this.type].idle);
    }

    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    setToPosition(toX: number, toY: number) {
        this._toX = toX;
        this._toY = toY;
    }

    setActivated(activatedAt?: number) {
        if (this._activatedAt !== activatedAt) {
            this._activatedAt = activatedAt;

            if (activatedAt) {
                const playIn = activatedAt - Date.now();

                // Don't play animation if it's already passed
                if (playIn < 0) {
                    return;
                }

                setTimeout(() => {
                    // @ts-ignore
                    this.playAnimation(PropTextures.sprites[this.type].anim, PropTextures.sprites[this.type].idle);
                }, playIn);
            }
        }
    }

    //
    // Getters
    //
    get type() {
        return this._type;
    }

    get activatedAt() {
        return this._activatedAt;
    }

    get toX() {
        return this._toX;
    }

    get toY() {
        return this._toY;
    }
}

function getDefaultAnimation(type: PropType): 'idle' | 'anim' {
    switch (type) {
        case PropType.Coin:
        case PropType.Flag:
        case PropType.HealthLarge:
        case PropType.HealthSmall:
        case PropType.KeyGold:
        case PropType.KeySilver:
        case PropType.Lamp:
        case PropType.ManaLarge:
        case PropType.ManaSmall:
        case PropType.Torch:
            return 'anim';
        default:
            return 'idle';
    }
}
