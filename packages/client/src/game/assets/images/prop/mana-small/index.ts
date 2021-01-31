import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import manaSmall1 from './mana-small_1.png';
import manaSmall2 from './mana-small_2.png';
import manaSmall3 from './mana-small_3.png';
import manaSmall4 from './mana-small_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const ManaSmall: PropAnimations = {
    idle: [Texture.from(manaSmall3)],
    anim: [Texture.from(manaSmall1), Texture.from(manaSmall2), Texture.from(manaSmall3), Texture.from(manaSmall4)],
};
