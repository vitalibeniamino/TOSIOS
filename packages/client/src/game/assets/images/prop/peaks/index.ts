import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import peaks1 from './peaks_1.png';
import peaks2 from './peaks_2.png';
import peaks3 from './peaks_3.png';
import peaks4 from './peaks_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const Peaks: PropAnimations = {
    idle: [Texture.from(peaks3)],
    anim: [Texture.from(peaks1), Texture.from(peaks2), Texture.from(peaks3), Texture.from(peaks4)],
};
