import { SCALE_MODES, settings } from 'pixi.js';
import { MonsterAnimations } from '../types';
import { Texture } from 'pixi.js';

import idle1 from './Bandit_Idle_1.png';
import idle2 from './Bandit_Idle_2.png';
import idle3 from './Bandit_Idle_3.png';
import idle4 from './Bandit_Idle_4.png';
import walk1 from './Bandit_Walk_1.png';
import walk2 from './Bandit_Walk_2.png';
import walk3 from './Bandit_Walk_3.png';
import walk4 from './Bandit_Walk_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const Bandit: MonsterAnimations = {
    idle: [Texture.from(idle1), Texture.from(idle2), Texture.from(idle3), Texture.from(idle4)],
    walk: [Texture.from(walk1), Texture.from(walk2), Texture.from(walk3), Texture.from(walk4)],
};
