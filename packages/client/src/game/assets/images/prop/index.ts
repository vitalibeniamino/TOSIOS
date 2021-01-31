import { SCALE_MODES, Texture, settings } from 'pixi.js';
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
    // Decor
    bone: Texture.from(bone),
    'handcuff-1': Texture.from(handcuff1),
    'handcuff-2': Texture.from(handcuff2),
    skull: Texture.from(skull),
    'stones-large': Texture.from(stonesLarge),
    'stones-small': Texture.from(stonesSmall),
    'web-left': Texture.from(webLeft),
    'web-right': Texture.from(webRight),
    // Spawns
    ladder: Texture.from(ladder),
};

export const sprites: PropTextures = {
    // Traps
    [`${PropType.Peak}`]: Peaks,
    // Decor
    [`${PropType.Bone}`]: { idle: [textures.bone] },
    [`${PropType.Flag}`]: Flag,
    [`${PropType.CrateSilver}`]: CrateSilver,
    [`${PropType.CrateWood}`]: CrateWood,
    [`${PropType.Handcuff1}`]: { idle: [textures['handcuff-1']] },
    [`${PropType.Handcuff2}`]: { idle: [textures['handcuff-2']] },
    [`${PropType.Lamp}`]: Lamp,
    [`${PropType.Skull}`]: { idle: [textures.skull] },
    [`${PropType.StonesLarge}`]: { idle: [textures['stones-large']] },
    [`${PropType.StonesSmall}`]: { idle: [textures['stones-small']] },
    [`${PropType.Torch}`]: Torch,
    [`${PropType.WebLeft}`]: { idle: [textures['web-left']] },
    [`${PropType.WebRight}`]: { idle: [textures['web-right']] },
    // Items
    [`${PropType.HealthLarge}`]: HealthLarge,
    [`${PropType.HealthSmall}`]: HealthSmall,
    [`${PropType.KeyGold}`]: KeyGold,
    [`${PropType.KeySilver}`]: KeySilver,
    [`${PropType.ManaLarge}`]: ManaLarge,
    [`${PropType.ManaSmall}`]: ManaSmall,
    // Spawns
    [`${PropType.Ladder}`]: { idle: [textures.ladder] },
};
