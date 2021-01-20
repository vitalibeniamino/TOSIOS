import { Application, Container, SCALE_MODES, settings, utils } from 'pixi.js';
import { Bullet, Game, Monster, Player, Prop } from './entities';
import { BulletsManager, MonstersManager, PlayersManager, PropsManager } from './managers';
import { Constants, Geometry, Map, Maps, Maths, Models } from '@tosios/common';
import { ImpactConfig, ImpactTexture } from './assets/particles';
import { Emitter } from 'pixi-particles';
import { GUITextures } from './assets/images';
import { Inputs } from './utils/inputs';
import { Viewport } from 'pixi-viewport';
import { distanceBetween } from './utils/distance';
import { drawTiles } from './utils/tiles';
import { generate } from '@halftheopposite/dungeon';

// We don't want to scale textures linearly because they would appear blurry.
settings.SCALE_MODE = SCALE_MODES.NEAREST;
settings.ROUND_PIXELS = true;

const ZINDEXES = {
    GROUND: 1,
    PROPS: 2,
    PARTICLES: 3,
    PLAYERS: 4,
    ME: 5,
    MONSTERS: 6,
    BULLETS: 7,
};

// TODO: These two constants should be calculated automatically.
// They are used to interpolate movements of other players for smoothness.
const TOREMOVE_MAX_FPS_MS = 1000 / 60;
const TOREMOVE_AVG_LAG = 50;

export interface Stats {
    state: Models.GameState;
    stateEndsAt: number;
    roomName?: string;
    playerName: string;
    playerLives: number;
    playerMaxLives: number;
    players: Models.PlayerJSON[];
    playersCount: number;
    playersMaxCount: number;
}

export interface IGameState {
    screenWidth: number;
    screenHeight: number;
    onActionSend: (action: Models.ActionJSON) => void;
}

/**
 * The main entrypoint for the game logic on the client-side.
 */
export class GameState {
    //
    // Sync fields
    //
    private game: Game;

    //
    // Local fields
    //
    private app: Application;

    private viewport: Viewport;

    private tilesContainer: Container;

    private particlesContainer: Container;

    private playersManager: PlayersManager;

    private monstersManager: MonstersManager;

    private propsManager: PropsManager;

    private bulletsManager: BulletsManager;

    private onActionSend: (action: Models.ActionJSON) => void;

    private me: Player | null;

    private moveActions: Models.ActionJSON[];

    private inputs: Inputs;

    private map: Map.DungeonMap;

    //
    // Lifecycle
    //
    constructor(attributes: IGameState) {
        this.game = new Game({
            state: 'lobby',
            stateEndsAt: 0,
            roomName: '',
            maxPlayers: 0,
        });

        // App
        this.app = new Application({
            width: attributes.screenWidth,
            height: attributes.screenHeight,
            antialias: false,
            backgroundColor: utils.string2hex(Constants.BACKGROUND_COLOR),
            autoDensity: true,
            resolution: window.devicePixelRatio,
        });

        // Cursor
        const defaultIcon = `url('${GUITextures.crosshairIco}') 32 32, auto`;
        this.app.renderer.plugins.interaction.cursor = 'default';
        this.app.renderer.plugins.interaction.cursorStyles.default = defaultIcon;

        // Viewport
        this.viewport = new Viewport({
            screenWidth: attributes.screenWidth,
            screenHeight: attributes.screenHeight,
        });
        this.viewport.zoomPercent(utils.isMobile.any ? 0.25 : 1.0);
        this.viewport.sortableChildren = true;
        this.app.stage.addChild(this.viewport);

        // Tiles
        this.tilesContainer = new Container();
        this.tilesContainer.zIndex = ZINDEXES.GROUND;
        this.viewport.addChild(this.tilesContainer);

        // Particles
        this.particlesContainer = new Container();
        this.particlesContainer.zIndex = ZINDEXES.PARTICLES;
        this.viewport.addChild(this.particlesContainer);

        // Players
        this.playersManager = new PlayersManager();
        this.playersManager.zIndex = ZINDEXES.PLAYERS;
        this.viewport.addChild(this.playersManager);

        // Monsters
        this.monstersManager = new MonstersManager();
        this.monstersManager.zIndex = ZINDEXES.MONSTERS;
        this.viewport.addChild(this.monstersManager);

        // Props
        this.propsManager = new PropsManager();
        this.propsManager.zIndex = ZINDEXES.PROPS;
        this.viewport.addChild(this.propsManager);

        // Bullets
        this.bulletsManager = new BulletsManager();
        this.bulletsManager.zIndex = ZINDEXES.BULLETS;
        this.viewport.addChild(this.bulletsManager);

        // Callbacks
        this.onActionSend = attributes.onActionSend;

        //
        // Others
        //
        this.me = null;
        this.moveActions = [];
        this.inputs = new Inputs();
        this.map = new Map.DungeonMap(Constants.TILE_SIZE);
    }

    start = (renderView: any) => {
        renderView.appendChild(this.app.view);
        this.app.start();
        this.app.ticker.add(this.update);
        this.inputs.start();
    };

    private update = () => {
        this.updateInputs();
        this.updatePlayers();
        this.updateMonsters();
        // this.updateBullets();
    };

    private updateInputs = () => {
        // Move
        const dir = new Geometry.Vector2(0, 0);
        if (this.inputs.up || this.inputs.down || this.inputs.left || this.inputs.right) {
            if (this.inputs.up) {
                dir.y -= 1;
            }

            if (this.inputs.down) {
                dir.y += 1;
            }

            if (this.inputs.left) {
                dir.x -= 1;
            }

            if (this.inputs.right) {
                dir.x += 1;
            }

            if (!dir.empty) {
                this.move(dir);
            }
        }

        // Rotate
        this.rotate();

        // Shoot
        if (this.inputs.shoot) {
            this.shoot();
        }
    };

    private updatePlayers = () => {
        let distance;

        for (const player of this.playersManager.getAll()) {
            distance = Maths.getDistance(player.x, player.y, player.toX, player.toY);
            if (distance > 0.01) {
                player.setPosition(
                    Maths.lerp(player.x, player.toX, TOREMOVE_MAX_FPS_MS / TOREMOVE_AVG_LAG),
                    Maths.lerp(player.y, player.toY, TOREMOVE_MAX_FPS_MS / TOREMOVE_AVG_LAG),
                );
            }
        }
    };

    private updateMonsters = () => {
        let distance;

        for (const monster of this.monstersManager.getAll()) {
            distance = Maths.getDistance(monster.x, monster.y, monster.toX, monster.toY);
            if (distance > 0.01) {
                monster.setPosition(
                    Maths.lerp(monster.x, monster.toX, TOREMOVE_MAX_FPS_MS / TOREMOVE_AVG_LAG),
                    Maths.lerp(monster.y, monster.toY, TOREMOVE_MAX_FPS_MS / TOREMOVE_AVG_LAG),
                );
            }
        }
    };

    private updateBullets = () => {
        for (const bullet of this.bulletsManager.getAll()) {
            if (!bullet.active) {
                continue;
            }

            bullet.move(Constants.BULLET_SPEED);

            //
            // Collisions: Players
            //
            // for (const player of this.playersManager.getAll()) {
            //     // Check if the bullet can hurt the player
            //     if (!player.canBulletHurt(bullet.playerId) || !Collisions.circleToCircle(bullet.body, player.body)) {
            //         continue;
            //     }

            //     bullet.kill(distanceBetween(this.me?.body, bullet.body));
            //     player.hurt();
            //     this.spawnImpact(bullet.x, bullet.y);
            //     continue;
            // }

            //
            // Collisions: Me
            //
            // if (
            //     this.me &&
            //     this.me.canBulletHurt(bullet.playerId) &&
            //     this.me.lives &&
            //     Collisions.circleToCircle(bullet.body, this.me.body)
            // ) {
            //     bullet.kill(distanceBetween(this.me?.body, bullet.body));
            //     this.me.hurt();
            //     this.spawnImpact(bullet.x, bullet.y);
            //     continue;
            // }

            //
            // Collisions: Monsters
            //
            const collidingMonsters = this.map.collidesByLayer(bullet.id, 'monsters');
            if (collidingMonsters.length > 0) {
                const firstMonster = collidingMonsters[0];
                bullet.kill(distanceBetween(this.me?.body, bullet.body));
                this.monstersManager.get(firstMonster.id)?.hurt();
                this.spawnImpact(bullet.x, bullet.y);
                continue;
            }

            //
            // Collisions: Walls
            //
            const collidingWalls = this.map.collidesByLayer(bullet.id, 'tiles');
            if (collidingWalls.length > 0) {
                bullet.kill(distanceBetween(this.me?.body, bullet.body));
                this.spawnImpact(bullet.x, bullet.y);
                continue;
            }
        }
    };

    stop = () => {
        this.app.ticker.stop();
        this.app.stop();
        this.inputs.stop();
    };

    //
    // Actions
    //
    private move = (dir: Geometry.Vector2) => {
        if (!this.me) {
            return;
        }

        //
        // Action
        //
        const action: Models.ActionJSON = {
            type: 'move',
            ts: Date.now(),
            playerId: this.me.id,
            value: {
                x: dir.x,
                y: dir.y,
            },
        };

        // Send the action to the server
        this.onActionSend(action);

        // Save the action for reconciliation
        this.moveActions.push(action);

        // Move the player
        this.me.move(dir.x, dir.y, Constants.PLAYER_SPEED);
        this.map.updateItem('me', this.me.x, this.me.y);

        //
        // Collisions: Walls
        //
        const collidingTiles = this.map.collidesByLayer('me', 'tiles');
        if (collidingTiles.length > 0) {
            const correctedPlayer = this.map.correctByIdLayer('me', 'tiles');
            this.me.x = correctedPlayer.x;
            this.me.y = correctedPlayer.y;
        }
    };

    private rotate = () => {
        if (!this.me) {
            return;
        }

        // On desktop we compute rotation with player and mouse position
        const screenPlayerPosition = this.viewport.toScreen(this.me.x, this.me.y);
        const mouse = this.app.renderer.plugins.interaction.mouse.global;
        const rotation = Maths.round2Digits(
            Maths.calculateAngle(mouse.x, mouse.y, screenPlayerPosition.x, screenPlayerPosition.y),
        );

        if (this.me.rotation !== rotation) {
            this.me.rotation = rotation;
            this.onActionSend({
                type: 'rotate',
                ts: Date.now(),
                playerId: this.me.id,
                value: {
                    rotation,
                },
            });
        }
    };

    private shoot = () => {
        if (!this.me || this.game.state !== 'game' || !this.me.canShoot()) {
            return;
        }

        this.me.lastShootAt = Date.now();

        // const bulletX = this.me.x + Math.cos(this.me.rotation) * Constants.PLAYER_WEAPON_SIZE;
        // const bulletY = this.me.y + Math.sin(this.me.rotation) * Constants.PLAYER_WEAPON_SIZE;
        // this.bulletsManager.addOrCreate(
        //     {
        //         id: String(this.me.lastShootAt),
        //         x: bulletX,
        //         y: bulletY,
        //         radius: Constants.BULLET_SIZE,
        //         rotation: this.me.rotation,
        //         active: true,
        //         fromX: bulletX,
        //         fromY: bulletY,
        //         playerId: this.me.id,
        //         shotAt: this.me.lastShootAt,
        //     },
        //     this.particlesContainer,
        // );

        this.onActionSend({
            type: 'shoot',
            ts: Date.now(),
            playerId: this.me.id,
            value: {
                angle: this.me.rotation,
            },
        });
    };

    //
    // Game
    //
    resetGame = () => {
        if (!this.game.seed) {
            return;
        }

        // Reset current states
        this.map.clearDungeon();
        this.tilesContainer.removeChildren();

        // 1. Create dungeon using seed from server
        const dungeon = generate({
            ...Maps.DEFAULT_DUNGEON,
            seed: this.game.seed,
        });
        this.map.loadDungeon(dungeon);

        // 2. Load players
        this.playersManager.getAll().forEach((player) => {
            this.map.addItem(
                player.x,
                player.y,
                player.body.radius * 2,
                player.body.radius * 2,
                'players',
                1, // TODO: Change this once all types are implemented
                player.id,
            );
        });

        if (this.me) {
            this.map.addItem(
                this.me.body.x,
                this.me.body.y,
                this.me.body.radius * 2,
                this.me.body.radius * 2,
                'players',
                1, // TODO: Change this once all types are implemented
                'me',
            );
        }

        // 3. Draw dungeon
        drawTiles(dungeon.layers.tiles, this.tilesContainer);
    };

    gameUpdate = (name: string, value: any) => {
        switch (name) {
            case 'state':
                this.game.state = value;
                break;
            case 'stateEndsAt':
                this.game.stateEndsAt = value;
                break;
            case 'roomName':
                this.game.roomName = value;
                break;
            case 'maxPlayers':
                this.game.maxPlayers = value;
                break;
            case 'seed':
                this.game.seed = value;
                this.resetGame();
                break;
            default:
                break;
        }
    };

    //
    // Players
    //
    playerAdd = (playerId: string, attributes: Models.PlayerJSON, isMe: boolean) => {
        const player = new Player(attributes, isMe, this.particlesContainer);
        this.playersManager.add(playerId, player);
        this.map.addItem(
            player.x,
            player.y,
            player.body.radius * 2,
            player.body.radius * 2,
            'players',
            1, // TODO: Change this once all types are implemented
            player.id,
        );

        // If the player is "you"
        if (isMe) {
            this.me = new Player(attributes, false, this.particlesContainer);

            this.playersManager.addChild(this.me.container);
            this.viewport.follow(this.me.container);

            this.map.addItem(
                player.x,
                player.y,
                player.body.radius * 2,
                player.body.radius * 2,
                'players',
                1, // TODO: Change this once all types are implemented
                'me',
            );
        }
    };

    playerUpdate = (playerId: string, attributes: Models.PlayerJSON, isMe: boolean) => {
        console.log(playerId, attributes.x, attributes.y);

        if (isMe && this.me) {
            const ghost = this.playersManager.get(playerId);
            if (!ghost) {
                return;
            }

            // Update base
            this.me.lives = attributes.lives;
            this.me.maxLives = attributes.maxLives;
            this.me.kills = attributes.kills;

            if (attributes.ack !== this.me.ack) {
                this.me.ack = attributes.ack;

                // Update ghost position
                ghost.x = attributes.x;
                ghost.y = attributes.y;
                ghost.toX = attributes.x;
                ghost.toY = attributes.y;

                // Run simulation of all movements that weren't treated by server yet
                const index = this.moveActions.findIndex((action) => action.ts === attributes.ack);
                this.moveActions = this.moveActions.slice(index + 1);
                this.moveActions.forEach((action) => {
                    const updatedPosition = Models.movePlayer(
                        ghost.x,
                        ghost.y,
                        ghost.body.radius,
                        action.value.x,
                        action.value.y,
                        Constants.PLAYER_SPEED,
                        this.map,
                    );

                    ghost.x = updatedPosition.x;
                    ghost.y = updatedPosition.y;
                    ghost.toX = updatedPosition.x;
                    ghost.toY = updatedPosition.y;
                });

                // Check if our predictions were accurate
                const distance = Maths.getDistance(this.me.x, this.me.y, ghost.x, ghost.y);
                if (distance > 0) {
                    this.me.setPosition(ghost.x, ghost.y);
                }
            }
        } else {
            const player = this.playersManager.get(playerId);
            if (!player) {
                return;
            }

            // Update base
            player.lives = attributes.lives;
            player.maxLives = attributes.maxLives;
            player.kills = attributes.kills;

            // Update rotation
            player.rotation = attributes.rotation;

            // Update position
            player.setPosition(player.toX, player.toY);
            player.setToPosition(player.x, player.y);
        }
    };

    playerRemove = (playerId: string, isMe: boolean) => {
        this.playersManager.remove(playerId);

        // If the player is "you"
        if (isMe && this.me) {
            this.playersManager.removeChild(this.me.container);
            this.me = null;
        }
    };

    //
    // Monsters
    //
    monsterAdd = (monsterId: string, attributes: Models.MonsterJSON) => {
        const monster = new Monster(attributes);
        this.monstersManager.add(monsterId, monster);

        // Map
        this.map.addItem(monster.x, monster.y, monster.width, monster.height, 'monsters', monster.type, monster.id);
    };

    monsterUpdate = (monsterId: string, attributes: Models.MonsterJSON) => {
        const monster = this.monstersManager.get(monsterId);
        if (!monster) {
            return;
        }

        monster.rotation = attributes.rotation;
        monster.setPosition(monster.toX, monster.toY);
        monster.setToPosition(attributes.x, attributes.y);

        // Map
        this.map.updateItem(monsterId, monster.toX, monster.toY);
    };

    monsterRemove = (monsterId: string) => {
        this.monstersManager.remove(monsterId);

        // Map
        this.map.removeItem(monsterId);
    };

    //
    // Props
    //
    propAdd = (propId: string, attributes: Models.PropJSON) => {
        const prop = new Prop(attributes);
        this.propsManager.add(propId, prop);

        // Map
        this.map.addItem(prop.x, prop.y, prop.width, prop.height, 'props', prop.type, prop.id);
    };

    propUpdate = (propId: string, attributes: Models.PropJSON) => {
        const prop = this.propsManager.get(propId);
        if (!prop) {
            return;
        }

        prop.active = attributes.active;
        prop.setPosition(attributes.x, attributes.y);

        // Map
        this.map.updateItem(propId, prop.x, prop.y);
    };

    propRemove = (propId: string) => {
        this.propsManager.remove(propId);

        // Map
        this.map.removeItem(propId);
    };

    //
    // Bullets
    //
    bulletAdd = (bulletId: string, attributes: Models.BulletJSON) => {
        const bullet = new Bullet(attributes, this.particlesContainer);
        this.bulletsManager.add(bulletId, bullet);

        // Map
        this.map.addItem(bullet.x, bullet.y, bullet.width, bullet.height, 'projectiles', 1, bullet.id);
    };

    bulletUpdate = (bulletId: string, attributes: Models.BulletJSON) => {
        const bullet = this.bulletsManager.get(bulletId);
        if (!bullet) {
            return;
        }

        bullet.setPosition(attributes.x, attributes.y);

        // Map
        this.map.updateItem(bulletId, bullet.x, bullet.y);
    };

    bulletRemove = (bulletId: string) => {
        this.bulletsManager.remove(bulletId);

        // Map
        this.map.removeItem(bulletId);
    };

    //
    // Utils
    //
    private spawnImpact = (x: number, y: number, color = '#ffffff') => {
        new Emitter(this.playersManager, [ImpactTexture], {
            ...ImpactConfig,
            color: {
                start: color,
                end: color,
            },
            pos: {
                x,
                y,
            },
        }).playOnceAndDestroy();
    };

    setScreenSize = (screenWidth: number, screenHeight: number) => {
        this.app.renderer.resize(screenWidth, screenHeight);
        this.viewport.resize(
            screenWidth,
            screenHeight,
            this.map.width * Constants.TILE_SIZE,
            this.map.height * Constants.TILE_SIZE,
        );
    };

    getStats = (): Stats => {
        const players: Models.PlayerJSON[] = this.playersManager.getAll().map((player) => ({
            id: player.id,
            x: player.x,
            y: player.y,
            radius: player.body.radius,
            rotation: player.rotation,
            name: player.name,
            lives: player.lives,
            maxLives: player.maxLives,
            kills: player.kills,
        }));

        return {
            state: this.game.state,
            stateEndsAt: this.game.stateEndsAt,
            roomName: this.game.roomName,
            playerName: this.me ? this.me.name : '',
            playerLives: this.me ? this.me.lives : 0,
            playerMaxLives: this.me ? this.me.maxLives : 0,
            players,
            playersCount: players.length,
            playersMaxCount: this.game.maxPlayers,
        };
    };
}
