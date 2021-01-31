import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import keyGold1 from './key-gold_1.png';
import keyGold2 from './key-gold_2.png';
import keyGold3 from './key-gold_3.png';
import keyGold4 from './key-gold_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const KeyGold: PropAnimations = {
    idle: [Texture.from(keyGold3)],
    anim: [Texture.from(keyGold1), Texture.from(keyGold2), Texture.from(keyGold3), Texture.from(keyGold4)],
};
