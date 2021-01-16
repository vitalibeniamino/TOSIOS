import { SCALE_MODES, Texture, settings } from 'pixi.js';
import all from './all.png';
import e from './e.png';
import edge from './edge.png';
import ground from './ground.png';
import hole from './hole.png';
import n from './n.png';
import nAneAe from './n-ne-e.png';
import nAnwAw from './n-nw-w.png';
import ne from './ne.png';
import nw from './nw.png';
import s from './s.png';
import w from './w.png';
import wAe from './w-e.png';

// We don't want to scale textures linearly because they would appear blurry.
settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const textures: { [key: string]: Texture } = {
    hole: Texture.from(hole),
    edge: Texture.from(edge),
    ground: Texture.from(ground),
    n: Texture.from(n),
    s: Texture.from(s),
    e: Texture.from(e),
    w: Texture.from(w),
    ne: Texture.from(ne),
    nw: Texture.from(nw),
    'w-e': Texture.from(wAe),
    'n-nw-w': Texture.from(nAnwAw),
    'n-ne-e': Texture.from(nAneAe),
    all: Texture.from(all),
};

export const sprites: { [key: string]: Texture } = {
    '-2': textures.hole,
    '-1': textures.edge,
    0: textures.ground,
    1: textures.s,
    2: textures.s,
    3: textures.s,
    4: textures.s,
    5: textures.s,
    7: textures.s,
    6: textures.s,
    8: textures.s,
    9: textures.s,
    10: textures.s,
    11: textures.s,
    12: textures.s,
    13: textures['w-e'],
    14: textures['w-e'],
    15: textures['w-e'],
    16: textures['w-e'],
    17: textures['w-e'],
    18: textures['w-e'],
    19: textures['w-e'],
    20: textures['w-e'],
    21: textures['w-e'],
    22: textures['w-e'],
    23: textures['w-e'],
    24: textures['w-e'],
    25: textures['w-e'],
    26: textures['n-ne-e'],
    27: textures['n-ne-e'],
    28: textures.e,
    29: textures['n-ne-e'],
    30: textures['n-ne-e'],
    31: textures.e,
    32: textures['n-ne-e'],
    33: textures.e,
    34: textures['n-nw-w'],
    35: textures['n-nw-w'],
    36: textures.w,
    37: textures['n-nw-w'],
    38: textures['n-nw-w'],
    39: textures['n-nw-w'],
    40: textures.w,
    41: textures.w,
    42: textures.n,
    43: textures.n,
    44: textures.ne,
    45: textures.nw,
    46: textures.all,
    47: textures.s,
};
