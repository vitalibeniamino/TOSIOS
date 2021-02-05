import { Bullet, Monster, Player, Prop } from '../entities';
import {
    BulletImpactConfig,
    ImpactTexture,
    MonsterImpactConfig,
    PropImpactConfig,
    SmokeConfig,
    SmokeTexture,
    Trail25Texture,
} from '../assets/particles';
import { Container, Texture } from 'pixi.js';
import { Emitter, OldEmitterConfig } from 'pixi-particles';

export class ParticlesManager extends Container {
    constructor() {
        super();
        this.name = 'Particles';
    }

    //
    // Methods
    //
    spawnBulletImpact(bullet: Bullet) {
        this.spawn(bullet.x, bullet.y, BulletImpactConfig as OldEmitterConfig, [ImpactTexture]);
    }

    spawnPropImpact(prop: Prop) {
        this.spawn(prop.x, prop.y, PropImpactConfig as OldEmitterConfig, [Trail25Texture]);
    }

    spawnMonsterImpact(monster: Monster) {
        this.spawn(monster.x, monster.y, MonsterImpactConfig as OldEmitterConfig, [Trail25Texture]);
    }

    spawnPlayerSmoke(player: Player) {
        this.spawn(player.x, player.y + player.width / 4, SmokeConfig as OldEmitterConfig, [SmokeTexture]);
    }

    private spawn(x: number, y: number, config: OldEmitterConfig, textures: Texture[]) {
        new Emitter(this, textures, {
            ...config,
            pos: {
                x,
                y,
            },
        }).playOnceAndDestroy();
    }
}
