import { Texture } from 'pixi.js';

export interface PropAnimations {
    idle: Texture[];
    anim?: Texture[];
}

export type PropTextures = {
    [key: string]: PropAnimations;
};
