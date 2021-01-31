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

    //
    // Local fields
    //
    private _active: boolean = false;

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
        this.active = prop.active;
    }

    //
    // Methods
    //
    hurt() {
        Effects.flash(this.sprite, HURT_COLOR, 0xffffff);

        // @ts-ignore
        this.playAnimation(PropTextures.sprites[this.type].anim);
    }

    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    //
    // Setters
    //
    set active(active: boolean) {
        this._active = active;
        this.visible = active;
    }

    //
    // Getters
    //
    get type() {
        return this._type;
    }

    get active() {
        return this._active;
    }
}

function getDefaultAnimation(type: PropType): 'idle' | 'anim' {
    switch (type) {
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
