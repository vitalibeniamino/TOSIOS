import { Texture } from 'pixi.js';

export interface MonsterAnimations {
    idle: Texture[];
    walk: Texture[];
}

export type MonsterTextures = {
    [key: string]: MonsterAnimations;
};
