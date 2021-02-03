import { SCALE_MODES, Texture, settings } from 'pixi.js';
import { Coin } from './coin';
import { CrateSilver } from './crate-silver';
import { CrateWood } from './crate-wood';
import { Flag } from './flag';
import { HealthLarge } from './health-large';
import { HealthSmall } from './health-small';
import { KeyGold } from './key-gold';
import { KeySilver } from './key-silver';
import { Lamp } from './lamp';
import { ManaLarge } from './mana-large';
import { ManaSmall } from './mana-small';
import { Peaks } from './peaks';
import { PropTextures } from './types';
import { PropType } from '@halftheopposite/dungeon';
import { Torch } from './torch';

import bone from './bone.png';
import handcuff1 from './handcuff-1.png';
import handcuff2 from './handcuff-2.png';
import ladder from './ladder.png';
import skull from './skull.png';
import stonesLarge from './stones-large.png';
import stonesSmall from './stones-small.png';
import webLeft from './web-left.png';
import webRight from './web-left.png';

// We don't want to scale textures linearly because they would appear blurry.
settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const textures: { [key: string]: Texture } = {
    bone: Texture.from(bone),
    'handcuff-1': Texture.from(handcuff1),
    'handcuff-2': Texture.from(handcuff2),
    ladder: Texture.from(ladder),
    skull: Texture.from(skull),
    'stones-large': Texture.from(stonesLarge),
    'stones-small': Texture.from(stonesSmall),
    'web-left': Texture.from(webLeft),
    'web-right': Texture.from(webRight),
};

export const sprites: PropTextures = {
    [`${PropType.Bone}`]: { idle: [textures.bone] },
    [`${PropType.Coin}`]: Coin,
    [`${PropType.CrateSilver}`]: CrateSilver,
    [`${PropType.CrateWood}`]: CrateWood,
    [`${PropType.Flag}`]: Flag,
    [`${PropType.Handcuff1}`]: { idle: [textures['handcuff-1']] },
    [`${PropType.Handcuff2}`]: { idle: [textures['handcuff-2']] },
    [`${PropType.HealthLarge}`]: HealthLarge,
    [`${PropType.HealthSmall}`]: HealthSmall,
    [`${PropType.KeyGold}`]: KeyGold,
    [`${PropType.KeySilver}`]: KeySilver,
    [`${PropType.Ladder}`]: { idle: [textures.ladder] },
    [`${PropType.Lamp}`]: Lamp,
    [`${PropType.ManaLarge}`]: ManaLarge,
    [`${PropType.ManaSmall}`]: ManaSmall,
    [`${PropType.Peak}`]: Peaks,
    [`${PropType.Skull}`]: { idle: [textures.skull] },
    [`${PropType.StonesLarge}`]: { idle: [textures['stones-large']] },
    [`${PropType.StonesSmall}`]: { idle: [textures['stones-small']] },
    [`${PropType.Torch}`]: Torch,
    [`${PropType.WebLeft}`]: { idle: [textures['web-left']] },
    [`${PropType.WebRight}`]: { idle: [textures['web-right']] },
};
