import { Bullet, Monster, Prop } from '../entities';
import {
    BulletImpactConfig,
    ImpactTexture,
    MonsterImpactConfig,
    PropImpactConfig,
    Trail25Texture,
} from '../assets/particles';
import { Container, Texture } from 'pixi.js';
import { Emitter, OldEmitterConfig } from 'pixi-particles';

export class ImpactsManager extends Container {
    constructor() {
        super();
        this.name = 'Impacts';
    }

    //
    // Methods
    //
    spawnBulletImpact(bullet: Bullet) {
        this.spawnImpact(bullet.x, bullet.y, BulletImpactConfig as OldEmitterConfig, [ImpactTexture]);
    }

    spawnPropImpact(prop: Prop) {
        this.spawnImpact(prop.x, prop.y, PropImpactConfig as OldEmitterConfig, [Trail25Texture]);
    }

    spawnMonsterImpact(monster: Monster) {
        this.spawnImpact(monster.x, monster.y, MonsterImpactConfig as OldEmitterConfig, [Trail25Texture]);
    }

    private spawnImpact(x: number, y: number, config: OldEmitterConfig, textures: Texture[]) {
        new Emitter(this, textures, {
            ...config,
            pos: {
                x,
                y,
            },
        }).playOnceAndDestroy();
    }
}
