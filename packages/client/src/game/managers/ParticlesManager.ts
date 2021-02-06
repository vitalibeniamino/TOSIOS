import {
    BulletConfig,
    Fog1Texture,
    Fog2Texture,
    HealConfig,
    HurtConfig,
    ImpactTexture,
    ManaConfig,
    PropConfig,
    SmokeConfig,
    SmokeTexture,
    Trail25Texture,
} from '../assets/particles';
import { Container, Texture } from 'pixi.js';
import { Emitter, OldEmitterConfig } from 'pixi-particles';
import { Circle } from '../entities';

export type ParticleType = 'bullet' | 'heal' | 'hurt' | 'mana' | 'prop' | 'smoke';

const ParticlesMap: {
    [key: string]: {
        config: OldEmitterConfig;
        textures: Texture[];
    };
} = {
    bullet: { config: BulletConfig as OldEmitterConfig, textures: [ImpactTexture] },
    heal: { config: HealConfig as OldEmitterConfig, textures: [Fog1Texture, Fog2Texture] },
    hurt: { config: HurtConfig as OldEmitterConfig, textures: [Trail25Texture] },
    mana: { config: ManaConfig as OldEmitterConfig, textures: [Fog1Texture, Fog2Texture] },
    prop: { config: PropConfig as OldEmitterConfig, textures: [Trail25Texture] },
    smoke: { config: SmokeConfig as OldEmitterConfig, textures: [SmokeTexture] },
};

export class ParticlesManager extends Container {
    constructor() {
        super();
        this.name = 'Particles';
    }

    //
    // Methods
    //
    spawn(type: ParticleType, circle: Circle) {
        const { config, textures } = ParticlesMap[type];

        new Emitter(this, textures, {
            ...config,
            pos: {
                x: circle.x,
                y: circle.y,
            },
        }).playOnceAndDestroy();
    }
}
