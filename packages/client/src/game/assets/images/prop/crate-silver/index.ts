import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import crateSilver1 from './crate-silver_1.png';
import crateSilver2 from './crate-silver_2.png';
import crateSilver3 from './crate-silver_3.png';
import crateSilver4 from './crate-silver_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const CrateSilver: PropAnimations = {
    idle: [Texture.from(crateSilver3)],
    anim: [
        Texture.from(crateSilver1),
        Texture.from(crateSilver2),
        Texture.from(crateSilver3),
        Texture.from(crateSilver4),
    ],
};
