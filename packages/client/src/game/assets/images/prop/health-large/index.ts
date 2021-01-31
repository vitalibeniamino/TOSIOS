import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import healthLarge1 from './health-large_1.png';
import healthLarge2 from './health-large_2.png';
import healthLarge3 from './health-large_3.png';
import healthSmall4 from './health-large_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const HealthLarge: PropAnimations = {
    idle: [Texture.from(healthLarge3)],
    anim: [
        Texture.from(healthLarge1),
        Texture.from(healthLarge2),
        Texture.from(healthLarge3),
        Texture.from(healthSmall4),
    ],
};
