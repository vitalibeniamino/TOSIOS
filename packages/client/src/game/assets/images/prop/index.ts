import { SCALE_MODES, Texture, settings } from 'pixi.js';
import { PropType } from '@halftheopposite/dungeon';

import bone from './bone.png';
import crateSilver from './crate-silver.png';
import crateWood from './crate-wood.png';
import flag from './flag.png';
import handcuff1 from './handcuff-1.png';
import handcuff2 from './handcuff-2.png';
import healthLarge from './health-large.png';
import healthSmall from './health-small.png';
import keyGold from './key-gold.png';
import keySilver from './key-silver.png';
import ladder from './ladder.png';
import lamp from './lamp.png';
import manaLarge from './mana-large.png';
import manaSmall from './mana-small.png';
import peak from './peak.png';
import skull from './skull.png';
import stonesLarge from './stones-large.png';
import stonesSmall from './stones-small.png';
import torch from './torch.png';
import webLeft from './web-left.png';
import webRight from './web-left.png';

// We don't want to scale textures linearly because they would appear blurry.
settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

export const textures: { [key: string]: Texture } = {
    // Traps
    peak: Texture.from(peak),
    // Decor
    bone: Texture.from(bone),
    'crate-silver': Texture.from(crateSilver),
    'crate-wood': Texture.from(crateWood),
    flag: Texture.from(flag),
    'handcuff-1': Texture.from(handcuff1),
    'handcuff-2': Texture.from(handcuff2),
    lamp: Texture.from(lamp),
    skull: Texture.from(skull),
    'stones-large': Texture.from(stonesLarge),
    'stones-small': Texture.from(stonesSmall),
    torch: Texture.from(torch),
    'web-left': Texture.from(webLeft),
    'web-right': Texture.from(webRight),
    // Items
    'health-large': Texture.from(healthLarge),
    'health-small': Texture.from(healthSmall),
    'key-gold': Texture.from(keyGold),
    'key-silver': Texture.from(keySilver),
    'mana-large': Texture.from(manaLarge),
    'mana-small': Texture.from(manaSmall),
    // Spawns
    ladder: Texture.from(ladder),
};

export const sprites: { [key: string]: Texture } = {
    // Traps
    [`${PropType.Peak}`]: textures.peak,
    // Decor
    [`${PropType.Bone}`]: textures.bone,
    [`${PropType.Flag}`]: textures.flag,
    [`${PropType.CrateSilver}`]: textures['crate-silver'],
    [`${PropType.CrateWood}`]: textures['crate-wood'],
    [`${PropType.Handcuff1}`]: textures['handcuff-1'],
    [`${PropType.Handcuff2}`]: textures['handcuff-2'],
    [`${PropType.Lamp}`]: textures.lamp,
    [`${PropType.Skull}`]: textures.skull,
    [`${PropType.StonesLarge}`]: textures['stones-large'],
    [`${PropType.StonesSmall}`]: textures['stones-small'],
    [`${PropType.Torch}`]: textures.torch,
    [`${PropType.WebLeft}`]: textures['web-left'],
    [`${PropType.WebRight}`]: textures['web-right'],
    // Items
    [`${PropType.HealthLarge}`]: textures['health-large'],
    [`${PropType.HealthSmall}`]: textures['health-small'],
    [`${PropType.KeyGold}`]: textures['key-gold'],
    [`${PropType.KeySilver}`]: textures['key-silver'],
    [`${PropType.ManaLarge}`]: textures['mana-large'],
    [`${PropType.ManaSmall}`]: textures['mana-small'],
    // Spawns
    [`${PropType.Ladder}`]: textures.ladder,
};
