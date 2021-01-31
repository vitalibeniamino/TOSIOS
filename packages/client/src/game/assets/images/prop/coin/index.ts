import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import coin1 from './coin_1.png';
import coin2 from './coin_2.png';
import coin3 from './coin_3.png';
import coin4 from './coin_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const Coin: PropAnimations = {
    idle: [Texture.from(coin1)],
    anim: [Texture.from(coin1), Texture.from(coin2), Texture.from(coin3), Texture.from(coin4)],
};
