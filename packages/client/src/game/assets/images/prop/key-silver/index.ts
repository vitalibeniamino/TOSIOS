import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import keySilver1 from './key-silver_1.png';
import keySilver2 from './key-silver_2.png';
import keySilver3 from './key-silver_3.png';
import keySilver4 from './key-silver_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const KeySilver: PropAnimations = {
    idle: [Texture.from(keySilver3)],
    anim: [Texture.from(keySilver1), Texture.from(keySilver2), Texture.from(keySilver3), Texture.from(keySilver4)],
};
