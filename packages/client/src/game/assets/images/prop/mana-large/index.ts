import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import manaLarge1 from './mana-large_1.png';
import manaLarge2 from './mana-large_2.png';
import manaLarge3 from './mana-large_3.png';
import manaLarge4 from './mana-large_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const ManaLarge: PropAnimations = {
    idle: [Texture.from(manaLarge3)],
    anim: [Texture.from(manaLarge1), Texture.from(manaLarge2), Texture.from(manaLarge3), Texture.from(manaLarge4)],
};
