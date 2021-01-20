import { Constants, Maths, Models } from '@tosios/common';
import { Trail100Texture, Trail25Texture, Trail50Texture, TrailConfig } from '../assets/particles';
import { Circle } from './Circle';
import { Container } from 'pixi.js';
import { Emitter } from 'pixi-particles';
import { ExplosionSound } from '../assets/sounds';
import { WeaponTextures } from '../assets/images';

const ZINDEXES = {
    BULLET: 0,
};

export class Bullet extends Circle {
    //
    // Sync fields
    //
    private _playerId: string = '';

    //
    // Local fields
    //
    private _active: boolean = false;

    private _shotAt: number = 0;

    private _trailEmitter: Emitter;

    //
    // Lifecycle
    //
    constructor(bullet: Models.BulletJSON, particlesContainer: Container) {
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
        this.active = bullet.active;
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
        this.active = bullet.active;
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

        if (this.active) {
            this._trailEmitter.emit = true;
            this.container.rotation = this.rotation;
        } else {
            this._trailEmitter.emit = false;
        }
    };

    kill = (playerDistance: number) => {
        this.active = false;

        setTimeout(() => {
            const volume = Maths.clamp(1 - Maths.normalize(playerDistance, 0, Constants.PLAYER_HEARING_DISTANCE), 0, 1);
            ExplosionSound.volume(volume);
            ExplosionSound.play();
        }, 100);
    };

    //
    // Setters
    //
    set playerId(playerId: string) {
        this._playerId = playerId;
    }

    set active(active: boolean) {
        this._active = active;
        this.sprite.visible = active;

        this.updateTrail();
    }

    set shotAt(shotAt: number) {
        this._shotAt = shotAt;
    }

    //
    // Getters
    //
    get playerId() {
        return this._playerId;
    }

    get active() {
        return this._active;
    }

    get shotAt() {
        return this._shotAt;
    }
}
