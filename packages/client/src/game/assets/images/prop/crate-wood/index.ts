import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import crateWood1 from './crate-wood_1.png';
import crateWood2 from './crate-wood_2.png';
import crateWood3 from './crate-wood_3.png';
import crateWood4 from './crate-wood_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const CrateWood: PropAnimations = {
    idle: [Texture.from(crateWood3)],
    anim: [Texture.from(crateWood1), Texture.from(crateWood2), Texture.from(crateWood3), Texture.from(crateWood4)],
};
