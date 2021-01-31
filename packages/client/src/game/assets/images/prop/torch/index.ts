import { SCALE_MODES, settings } from 'pixi.js';
import { PropAnimations } from '../types';
import { Texture } from 'pixi.js';

import torch1 from './torch_1.png';
import torch2 from './torch_2.png';
import torch3 from './torch_3.png';
import torch4 from './torch_4.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const Torch: PropAnimations = {
    idle: [Texture.from(torch3)],
    anim: [Texture.from(torch1), Texture.from(torch2), Texture.from(torch3), Texture.from(torch4)],
};
