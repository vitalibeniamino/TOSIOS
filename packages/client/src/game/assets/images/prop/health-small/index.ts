import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import healthSmall1 from './health-small_1.png';
import healthSmall2 from './health-small_2.png';
import healthSmall3 from './health-small_3.png';
import healthSmall4 from './health-small_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const HealthSmall: PropAnimations = {
    idle: [Texture.from(healthSmall3)],
    anim: [
        Texture.from(healthSmall1),
        Texture.from(healthSmall2),
        Texture.from(healthSmall3),
        Texture.from(healthSmall4),
    ],
};
