import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import lamp1 from './lamp_1.png';
import lamp2 from './lamp_2.png';
import lamp3 from './lamp_3.png';
import lamp4 from './lamp_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const Lamp: PropAnimations = {
    idle: [Texture.from(lamp3)],
    anim: [Texture.from(lamp1), Texture.from(lamp2), Texture.from(lamp3), Texture.from(lamp4)],
};
