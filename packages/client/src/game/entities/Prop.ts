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

    //
    // Getters
    //
    get type() {
        return this._type;
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
