import { Graphics, Texture } from 'pixi.js';
import { Circle } from '.';
import { Models } from '@tosios/common';
import { PropTextures } from '../assets/images';

const ZINDEXES = {
    SHADOW: 0,
    PROP: 1,
};

export class Prop extends Circle {
    //
    // Sync fields
    //
    private _type: Models.PropType;

    //
    // Local fields
    //
    private _active: boolean = false;

    private _shadow: Graphics;

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
            textures: getTexture(prop.type),
            zIndex: ZINDEXES.PROP,
        });

        // Shadow
        this._shadow = new Graphics();
        this._shadow.zIndex = ZINDEXES.SHADOW;
        this._shadow.pivot.set(0.5);
        this._shadow.beginFill(0x000000, 0.3);
        this._shadow.drawEllipse(prop.radius, prop.radius * 2, prop.radius / 2, prop.radius / 4);
        this._shadow.endFill();
        this.container.addChild(this._shadow);

        // Sort rendering order
        this.container.sortChildren();

        // Prop
        this._type = prop.type;
        this.active = prop.active;
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

/**
 * Return a texture given a type.
 */
const getTexture = (type: Models.PropType): Texture[] => {
    switch (type) {
        default:
            return PropTextures.potionRedTextures;
    }
};
