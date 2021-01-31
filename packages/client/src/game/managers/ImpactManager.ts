import { Bullet, Prop } from '../entities';
import { BulletImpactConfig, ImpactTexture, Trail25Texture, WoodExplosionConfig } from '../assets/particles';
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
        this.spawnImpact(prop.x, prop.y, WoodExplosionConfig as OldEmitterConfig, [Trail25Texture]);
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
