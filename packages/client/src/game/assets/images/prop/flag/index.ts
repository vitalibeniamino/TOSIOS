import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import flag1 from './flag_1.png';
import flag2 from './flag_2.png';
import flag3 from './flag_3.png';
import flag4 from './flag_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const Flag: PropAnimations = {
    idle: [Texture.from(flag3)],
    anim: [Texture.from(flag1), Texture.from(flag2), Texture.from(flag3), Texture.from(flag4)],
};
