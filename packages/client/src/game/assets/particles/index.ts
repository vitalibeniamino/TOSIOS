import { SCALE_MODES, Texture, settings } from 'pixi.js';

import BulletConfig from './bullet.json';
import HealConfig from './heal.json';
import HurtConfig from './hurt.json';
import ManaConfig from './mana.json';
import PropConfig from './prop.json';
import SmokeConfig from './smoke.json';
import TrailConfig from './trail.json';

import fog1Image from './fog1.png';
import fog2Image from './fog2.png';
import impactImage from './impact.png';
import smokeImage from './smoke.png';
import trail100Image from './trail100.png';
import trail25Image from './trail25.png';
import trail50Image from './trail50.png';

settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

const Fog1Texture = Texture.from(fog1Image);
const Fog2Texture = Texture.from(fog2Image);
const ImpactTexture = Texture.from(impactImage);
const SmokeTexture = Texture.from(smokeImage);
const Trail25Texture = Texture.from(trail25Image);
const Trail50Texture = Texture.from(trail50Image);
const Trail100Texture = Texture.from(trail100Image);

export {
    HurtConfig,
    BulletConfig,
    HealConfig,
    ManaConfig,
    PropConfig,
    SmokeConfig,
    TrailConfig,
    Fog1Texture,
    Fog2Texture,
    ImpactTexture,
    SmokeTexture,
    Trail25Texture,
    Trail50Texture,
    Trail100Texture,
};
