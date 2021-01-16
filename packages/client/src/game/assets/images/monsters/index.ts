import { Bandit } from './bandit';
import { CentaurFemale } from './centaur-female';
import { CentaurMale } from './centaur-male';
import { MonsterTextures } from './types';
import { MonsterType } from '@halftheopposite/dungeon';
import { MushroomLarge } from './mushroom-large';
import { MushroomSmall } from './mushroom-small';
import { Skeleton } from './skeleton';
import { Troll } from './troll';
import { Wolf } from './wolf';

export const sprites: MonsterTextures = {
    [`${MonsterType.Bandit}`]: Bandit,
    [`${MonsterType.CentaurFemale}`]: CentaurFemale,
    [`${MonsterType.CentaurMale}`]: CentaurMale,
    [`${MonsterType.MushroomLarge}`]: MushroomLarge,
    [`${MonsterType.MushroomSmall}`]: MushroomSmall,
    [`${MonsterType.Skeleton}`]: Skeleton,
    [`${MonsterType.Troll}`]: Troll,
    [`${MonsterType.Wolf}`]: Wolf,
};
