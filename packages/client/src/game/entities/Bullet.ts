import { Trail100Texture, Trail25Texture, Trail50Texture, TrailConfig } from '../assets/particles';
import { Circle } from './Circle';
import { Emitter } from 'pixi-particles';
import { Models } from '@tosios/common';
import { ParticlesManager } from '../managers/ParticlesManager';
import { WeaponTextures } from '../assets/images';

const ZINDEXES = {
    BULLET: 0,
};

export class Bullet extends Circle {
    //
    // Sync fields
    //
    private _type: Models.BulletType = Models.BulletType.Magic;

    private _playerId: string = '';

    //
    // Local fields
    //
    private _shotAt: number = 0;

    private _trailEmitter: Emitter;

    //
    // Lifecycle
    //
    constructor(bullet: Models.BulletJSON, particlesContainer: ParticlesManager) {
        super({
            id: bullet.id,
            x: bullet.x,
            y: bullet.y,
            radius: bullet.radius,
            rotation: bullet.rotation,
            textures: WeaponTextures.fire,
            zIndex: ZINDEXES.BULLET,
        });

        // Trail emitter
        this._trailEmitter = new Emitter(particlesContainer, [Trail100Texture, Trail50Texture, Trail25Texture], {
            ...TrailConfig,
        });
        this._trailEmitter.autoUpdate = true;

        // Bullet
        this.rotation = bullet.rotation;
        this.playerId = bullet.playerId;
        this.shotAt = bullet.shotAt;

        // Sort rendering order
        this.container.sortChildren();
    }

    //
    // Methods
    //
    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    reset(bullet: Models.BulletJSON) {
        this.x = bullet.x;
        this.y = bullet.y;
        this.rotation = bullet.rotation;
        this.playerId = bullet.playerId;
        this.shotAt = bullet.shotAt;
        this._trailEmitter.cleanup();
        this.updateTrail();
    }

    move = (speed: number) => {
        this.x += Math.cos(this.rotation) * speed;
        this.y += Math.sin(this.rotation) * speed;

        this._trailEmitter.updateSpawnPos(this.x, this.y);
    };

    updateTrail = () => {
        this._trailEmitter.updateSpawnPos(this.x, this.y);

        this._trailEmitter.emit = true;
        this.container.rotation = this.rotation;
    };

    kill = () => {
        this._trailEmitter.destroy();
    };

    //
    // Setters
    //
    set type(type: Models.BulletType) {
        this._type = type;
    }

    set playerId(playerId: string) {
        this._playerId = playerId;
    }

    set shotAt(shotAt: number) {
        this._shotAt = shotAt;
    }

    //
    // Getters
    //
    get type(): Models.BulletType {
        return this._type;
    }

    get playerId() {
        return this._playerId;
    }

    get shotAt() {
        return this._shotAt;
    }
}
