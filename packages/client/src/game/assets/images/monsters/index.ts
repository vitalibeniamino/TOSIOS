import { SCALE_MODES, Texture, settings } from 'pixi.js';
import { MonsterType } from '@halftheopposite/dungeon';

import bandit from './bandit.png';
import centaurFemale from './centaur-female.png';
import centaurMale from './centaur-male.png';
import mushroomLarge from './mushroom-large.png';
import mushroonSmall from './mushroom-small.png';
import skeleton from './skeleton.png';
import troll from './troll.png';
import wolf from './wolf.png';

// We don't want to scale textures linearly because they would appear blurry.
settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const textures: { [key: string]: Texture } = {
    bandit: Texture.from(bandit),
    centaurFemale: Texture.from(centaurFemale),
    centaurMale: Texture.from(centaurMale),
    mushroomLarge: Texture.from(mushroomLarge),
    mushroonSmall: Texture.from(mushroonSmall),
    skeleton: Texture.from(skeleton),
    troll: Texture.from(troll),
    wolf: Texture.from(wolf),
};

export const sprites: { [key: string]: Texture } = {
    [`${MonsterType.Bandit}`]: textures.bandit,
    [`${MonsterType.CentaurFemale}`]: textures.centaurFemale,
    [`${MonsterType.CentaurMale}`]: textures.centaurMale,
    [`${MonsterType.MushroomLarge}`]: textures.mushroomLarge,
    [`${MonsterType.MushroomSmall}`]: textures.mushroonSmall,
    [`${MonsterType.Skeleton}`]: textures.skeleton,
    [`${MonsterType.Troll}`]: textures.troll,
    [`${MonsterType.Wolf}`]: textures.wolf,
};
