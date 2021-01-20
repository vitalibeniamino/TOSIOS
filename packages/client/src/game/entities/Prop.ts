import { Circle } from './Circle';
import { Models } from '@tosios/common';
import { PropTextures } from '../assets/images';
import { PropType } from '@halftheopposite/dungeon';

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
            textures: [PropTextures.sprites[prop.type]],
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
