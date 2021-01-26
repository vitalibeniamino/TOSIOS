import { Bullet, Game, Monster, Player, Prop } from './entities';
import { Collisions, Constants, Geometry, Map, Maps, Models } from '@tosios/common';
import { MapSchema, Schema, type } from '@colyseus/schema';
import { MonsterType, PropType, TileType, generate } from '@halftheopposite/dungeon';
import { nanoid } from 'nanoid';

export interface GameStateArgs {
    roomName: string;
    maxPlayers: number;
    onMessage: (message: Models.MessageJSON) => void;
}

export class GameState extends Schema {
    //
    // Sync fields
    //
    @type(Game)
    public game: Game;

    @type({ map: Player })
    public players: MapSchema<Player> = new MapSchema<Player>();

    @type({ map: Monster })
    public monsters: MapSchema<Monster> = new MapSchema<Monster>();

    @type({ map: Prop })
    public props: MapSchema<Prop> = new MapSchema<Prop>();

    @type({ map: Bullet })
    public bullets: MapSchema<Bullet> = new MapSchema<Bullet>();

    //
    // Local fields
    //
    private map: Map.DungeonMap = new Map.DungeonMap(Constants.TILE_SIZE);

    private actions: Models.ActionJSON[] = [];

    private onMessage: (message: Models.MessageJSON) => void = null;

    //
    // Lifecycle
    //
    constructor(args: GameStateArgs) {
        super();

        // Game
        this.game = new Game({
            state: 'lobby',
            roomName: args.roomName,
            maxPlayers: args.maxPlayers,
            stateEndsAt: Date.now() + 1000 * 5,
            onLobbyStart: this.handleLobbyStart,
            onGameStart: this.handleGameStart,
            onGameEnd: this.handleGameEnd,
        });

        // Callbacks
        this.onMessage = args.onMessage;
    }

    //
    // Updates
    //
    update() {
        this.updateGame();

        if (this.game.state === 'game') {
            this.updatePlayers();
            this.updateMonsters();
            this.updateProps();
            this.updateBullets();
        }
    }

    private updateGame() {
        this.game.update(this.players);
    }

    private updatePlayers() {
        let action: Models.ActionJSON;

        while (this.actions.length > 0) {
            action = this.actions.shift();

            switch (action.type) {
                case 'move':
                    this.playerMove(action.playerId, action.ts, action.value);
                    break;
                case 'rotate':
                    this.playerRotate(action.playerId, action.ts, action.value.rotation);
                    break;
                case 'shoot':
                    this.playerShoot(action.playerId, action.ts, action.value.angle);
                    break;
                default:
                    break;
            }
        }
    }

    private updateMonsters() {
        this.monsters.forEach((monster, monsterId) => {
            this.monsterUpdate(monsterId);
        });
    }

    private updateProps() {
        this.props.forEach((prop, propId) => {
            this.propUpdate(propId);
        });
    }

    private updateBullets() {
        this.bullets.forEach((bullet, bulletId) => {
            this.bulletUpdate(bulletId);
        });
    }

    //
    // Game
    //
    private resetGame = () => {
        // Reset current states
        this.map.clearDungeon();
        this.monstersClear();
        this.propsClear();
        this.bulletsClear();

        // 1. Create dungeon
        const seed = nanoid();
        const dungeon = generate({
            ...Maps.DEFAULT_DUNGEON,
            seed,
        });

        this.game.seed = seed;
        this.map.loadDungeon(dungeon, ['tiles', 'props', 'monsters']);

        // 2. Create monsters
        const monstersItems = this.map.listItemsByLayer('monsters');
        monstersItems.forEach((item) => {
            const monster = new Monster({
                id: item.id,
                x: item.x,
                y: item.y,
                radius: item.w / 2,
                rotation: 0,
                type: item.type as MonsterType,
                mapWidth: this.map.width * Constants.TILE_SIZE,
                mapHeight: this.map.height * Constants.TILE_SIZE,
                lives: Constants.MONSTER_LIVES,
            });

            this.monsters.set(item.id, monster);
        });

        // 3. Create props
        const propsItems = this.map.listItemsByLayer('props');
        propsItems.forEach((item) => {
            const prop = new Prop({
                id: item.id,
                x: item.x,
                y: item.y,
                radius: item.w / 2,
                rotation: 0,
                type: item.type as PropType,
            });

            this.props.set(item.id, prop);
        });

        // 4. Players
        const ladder = this.getLadderCoord();
        this.players.forEach((player) => {
            player.setPosition(ladder.x, ladder.y);
            this.map.addItem(
                player.x,
                player.y,
                player.radius * 2,
                player.radius * 2,
                'players',
                player.type,
                player.id,
            );
        });
    };

    private handleLobbyStart = () => {};

    private handleGameStart = () => {
        this.resetGame();
        this.setPlayersActive(true);
        this.onMessage({
            type: 'start',
            from: 'server',
            ts: Date.now(),
            params: {},
        });
    };

    private handleGameEnd = () => {
        this.setPlayersActive(false);
        this.onMessage({
            type: 'stop',
            from: 'server',
            ts: Date.now(),
            params: {},
        });
    };

    //
    // Players
    //
    playerAdd(playerId: string, name: string) {
        const ladder = this.getLadderCoord();
        const player = new Player({
            type: Models.PlayerType.Wizard,
            id: playerId,
            x: ladder.x,
            y: ladder.y,
            radius: Constants.PLAYER_SIZE / 2,
            rotation: 0,
            lives: 0,
            maxLives: Constants.PLAYER_MAX_LIVES,
            name: name || playerId,
        });
        this.players.set(playerId, player);
        this.map.addItem(player.x, player.y, player.radius * 2, player.radius * 2, 'players', player.type, player.id);

        // Broadcast message to other players
        this.onMessage({
            type: 'joined',
            from: 'server',
            ts: Date.now(),
            params: {
                name: this.players.get(playerId).name,
            },
        });
    }

    playerRemove(playerId: string) {
        this.onMessage({
            type: 'left',
            from: 'server',
            ts: Date.now(),
            params: {
                name: this.players.get(playerId).name,
            },
        });

        this.map.removeItem(playerId);
        this.players.delete(playerId);
    }

    //
    // Players: Actions
    //
    playerPushAction(action: Models.ActionJSON) {
        this.actions.push(action);
    }

    private playerMove(playerId: string, ts: number, dir: Geometry.Vector2) {
        const player = this.players.get(playerId);
        if (!player || dir.empty) {
            return;
        }

        player.move(dir.x, dir.y, Constants.PLAYER_SPEED);
        this.map.updateItem(player.id, player.x, player.y);

        //
        // Collisions: Walls
        //
        const collidingWalls = this.map.collidesById(player.id, ['tiles'], Collisions.PLAYER_TILES);
        if (collidingWalls.length > 0) {
            const corrected = this.map.collideAndCorrectById(player.id, ['tiles'], Collisions.PLAYER_TILES);
            player.setPosition(corrected.x, corrected.y);
        }

        //
        // Collisions: Props
        //
        const collidingProps = this.map.collidesById(player.id, ['props'], Collisions.PLAYER_PROPS);
        if (collidingProps.length > 0) {
            const corrected = this.map.collideAndCorrectById(player.id, ['props'], Collisions.PLAYER_PROPS);
            player.setPosition(corrected.x, corrected.y);
        }

        // Acknowledge last treated action
        player.ack = ts;
    }

    private playerRotate(playerId: string, ts: number, rotation: number) {
        const player = this.players.get(playerId);
        if (!player) {
            return;
        }

        player.setRotation(rotation);
    }

    private playerShoot(playerId: string, ts: number, angle: number) {
        const player = this.players.get(playerId);
        if (!player || !player.isAlive || this.game.state !== 'game') {
            return;
        }

        // Check if player can shoot
        const delta = ts - player.lastShootAt;
        if (player.lastShootAt && delta < Constants.BULLET_RATE) {
            return;
        }
        player.lastShootAt = ts;

        // Make the bullet start at the staff
        const bulletX = player.x + Math.cos(angle) * Constants.PLAYER_WEAPON_SIZE;
        const bulletY = player.y + Math.sin(angle) * Constants.PLAYER_WEAPON_SIZE;

        const bulletId = this.map.addItem(
            bulletX,
            bulletY,
            Constants.BULLET_SIZE * 2,
            Constants.BULLET_SIZE * 2,
            'projectiles',
            1,
        );
        const bullet = new Bullet({
            id: bulletId,
            x: bulletX,
            y: bulletY,
            radius: Constants.BULLET_SIZE,
            rotation: angle,
            type: Models.BulletType.Magic,
            playerId,
            shotAt: Date.now(),
        });
        this.bullets.set(bulletId, bullet);
    }

    //
    // Monsters
    //
    private monsterUpdate = (monsterId: string) => {
        const monster = this.monsters.get(monsterId);
        if (!monster || !monster.isAlive) {
            return;
        }

        // Update monster
        monster.update(this.players, this.map);
        this.map.updateItem(monster.id, monster.x, monster.y);

        // Collisions: Players
        this.players.forEach((player) => {
            // Check if the monster can hurt the player
            if (!player.isAlive || !monster.canAttack || !Collisions.circleToCircle(monster.body, player.body)) {
                return;
            }

            monster.attack();
            player.hurt();

            if (!player.isAlive) {
                this.onMessage({
                    type: 'killed',
                    from: 'server',
                    ts: Date.now(),
                    params: {
                        killerName: 'A bat',
                        killedName: player.name,
                    },
                });
            }
        });
    };

    private monsterRemove = (monsterId: string) => {
        this.map.removeItem(monsterId);
        this.monsters.delete(monsterId);
    };

    private monstersClear = () => {
        const ids = Array.from(this.monsters.keys());
        ids.forEach(this.monsterRemove);
    };

    //
    // Props
    //
    private propUpdate = (propId: string) => {
        const prop = this.props.get(propId);
    };

    private propRemove = (propId: string) => {
        this.map.removeItem(propId);
        this.props.delete(propId);
    };

    private propsClear = () => {
        const ids = Array.from(this.props.keys());
        ids.forEach(this.propRemove);
    };

    //
    // Bullets
    //
    private bulletUpdate = (bulletId: string) => {
        const bullet = this.bullets[bulletId];
        if (!bullet || !bullet.active) {
            return;
        }

        bullet.move(Constants.BULLET_SPEED);
        this.map.updateItem(bulletId, bullet.x, bullet.y);

        //
        // Collisions: Monsters
        //
        const collidingMonsters = this.map.collidesById(bullet.id, ['monsters']);
        if (collidingMonsters.length > 0) {
            collidingMonsters.forEach((item) => {
                const monster = this.monsters[item.id];
                if (monster) {
                    monster.hurt();
                    if (!monster.isAlive) {
                        this.monsterRemove(monster.id);
                    }
                }
            });

            this.bulletRemove(bulletId);
            return;
        }

        //
        // Collisions: Walls
        //
        const collidingWalls = this.map.collidesById(bullet.id, ['tiles'], [TileType.Wall]);
        if (collidingWalls.length > 0) {
            this.bulletRemove(bulletId);
            return;
        }

        //
        // Collisions: Props
        //
        const collidingProps = this.map.collidesById(bullet.id, ['props'], Collisions.BULLET_PROPS);
        if (collidingProps.length > 0) {
            collidingProps.forEach((item) => {
                if (Collisions.HURTABLE_PROPS.includes(item.type as PropType)) {
                    const prop = this.props[item.id];
                    if (prop) {
                        prop.hurt();
                        if (!prop.isAlive) {
                            this.propRemove(prop.id);
                        }
                    }
                }
            });

            this.bulletRemove(bulletId);
        }
    };

    private bulletRemove = (bulletId: string) => {
        this.map.removeItem(bulletId);
        this.bullets.delete(bulletId);
    };

    private bulletsClear = () => {
        const ids = Array.from(this.bullets.keys());
        ids.forEach(this.bulletRemove);
    };

    //
    // Utils
    //
    private getLadderCoord(): { x: number; y: number } {
        const ladders = this.map.listItemsByLayerAndType('props', PropType.Ladder);

        if (ladders.length > 0) {
            return ladders[0];
        }

        return { x: 0, y: 0 };
    }

    private setPlayersActive(active: boolean) {
        this.players.forEach((player) => {
            player.ack = active ? 0 : player.ack;
            player.setLives(active ? player.maxLives : 0);
        });
    }
}
