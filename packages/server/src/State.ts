import { Bullet, Game, Monster, Player, Prop } from './entities';
import { Collisions, Constants, Geometry, Maps, Models } from '@tosios/common';
import { DungeonMap, MonsterType, generate } from '@halftheopposite/dungeon';
import { MapSchema, Schema, type } from '@colyseus/schema';
import { PropType } from '@halftheopposite/dungeon';
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
    private map: DungeonMap = new DungeonMap(Constants.TILE_SIZE);

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
        this.updatePlayers();
        this.updateMonsters();
        this.updateProps();
        this.updateBullets();
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
        this.map.loadDungeon(dungeon);

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
                1, // TODO: Change this once all types are implemented
                player.id,
            );
        });
    };

    private handleLobbyStart = () => {
        // TODO
    };

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
    // Players: single
    //
    playerAdd(id: string, name: string) {
        // const ladder = this.getLadderCoord();
        const player = new Player({
            id,
            x: 0,
            y: 0,
            radius: Constants.PLAYER_SIZE / 2,
            rotation: 0,
            lives: 0,
            maxLives: Constants.PLAYER_MAX_LIVES,
            name: name || id,
        });
        this.players.set(id, player);
        this.map.addItem(
            player.x,
            player.y,
            player.radius * 2,
            player.radius * 2,
            'players',
            1, // TODO: Change this once all types are implemented
            player.id,
        );

        // Broadcast message to other players
        this.onMessage({
            type: 'joined',
            from: 'server',
            ts: Date.now(),
            params: {
                name: this.players.get(id).name,
            },
        });
    }

    playerPushAction(action: Models.ActionJSON) {
        this.actions.push(action);
    }

    private playerMove(id: string, ts: number, dir: Geometry.Vector2) {
        const player = this.players.get(id);
        if (!player || dir.empty) {
            return;
        }

        player.move(dir.x, dir.y, Constants.PLAYER_SPEED);
        this.map.updateItem(player.id, player.x, player.y);

        //
        // Collisions: walls
        //
        // const collidingItems = this.map.collidesByLayer(player.id, 'tiles');
        // if (collidingItems.length > 0) {
        //     const correctedPosition = this.walls.correctWithCircle(player.body);
        //     player.setPosition(correctedPosition.x, correctedPosition.y);
        //     this.map.updateItem(player.id, player.x, player.y);
        // }

        // Acknowledge last treated action
        player.ack = ts;
    }

    private playerRotate(id: string, ts: number, rotation: number) {
        const player = this.players.get(id);
        if (!player) {
            return;
        }

        player.setRotation(rotation);
    }

    private playerShoot(id: string, ts: number, angle: number) {
        const player = this.players.get(id);
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

        // Recycle bullets if some are unused to prevent instantiating too many
        let inactiveId;
        this.bullets.forEach((bullet) => {
            if (!inactiveId && !bullet.active) {
                inactiveId = bullet.id;
            }
        });

        if (!inactiveId) {
            // this.map.addItem(bulletX, bulletY, Constants.BULLET_SIZE * 2);
            // this.bullets.push(
            //     new Bullet({
            //         playerId: id,
            //         team: player.team,
            //         x: bulletX,
            //         y: bulletY,
            //         radius: Constants.BULLET_SIZE,
            //         rotation: angle,
            //         color: player.color,
            //         shotAt: Date.now(),
            //     }),
            // );
        } else {
            // this.bullets[index].reset({
            //     playerId: id,
            //     team: player.team,
            //     x: bulletX,
            //     y: bulletY,
            //     radius: Constants.BULLET_SIZE,
            //     rotation: angle,
            //     color: player.color,
            //     shotAt: Date.now(),
            // });
        }
    }

    private playerUpdateKills(playerId: string) {
        const player = this.players.get(playerId);
        if (!player) {
            return;
        }

        player.setKills(player.kills + 1);
    }

    playerRemove(id: string) {
        this.onMessage({
            type: 'left',
            from: 'server',
            ts: Date.now(),
            params: {
                name: this.players.get(id).name,
            },
        });

        this.map.removeItem(id);
        this.players.delete(id);
    }

    //
    // Monsters
    //
    private monsterUpdate = (id: string) => {
        const monster = this.monsters.get(id);
        if (!monster || !monster.isAlive) {
            return;
        }

        // Update monster
        monster.update(this.players);
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

    private monsterRemove = (id: string) => {
        this.map.removeItem(id);
        this.monsters.delete(id);
    };

    private monstersClear = () => {
        const ids = Array.from(this.monsters.keys());
        ids.forEach(this.monsterRemove);
    };

    //
    // Props
    //
    private propUpdate = (id: string) => {
        const prop = this.props.get(id);
    };

    private propRemove = (id: string) => {
        this.map.removeItem(id);
        this.props.delete(id);
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

        //
        // Collisions: Players
        //
        const collidingPlayers = this.map.collidesByLayer(bullet.id, 'players');
        if (collidingPlayers.length > 0) {
            bullet.active = false;

            collidingPlayers.forEach((item) => {
                const player = this.monsters.get(item.id);
                if (player) {
                    player.hurt();
                    if (!player.isAlive) {
                        this.monsterRemove(player.id);
                    }
                }
            });
        }

        this.players.forEach((player) => {
            // Check if the bullet can hurt the player
            if (!player.canBulletHurt(bullet.playerId) || !Collisions.circleToCircle(bullet.body, player.body)) {
                return;
            }

            bullet.active = false;
            player.hurt();

            if (!player.isAlive) {
                this.onMessage({
                    type: 'killed',
                    from: 'server',
                    ts: Date.now(),
                    params: {
                        killerName: this.players[bullet.playerId].name,
                        killedName: player.name,
                    },
                });
                this.playerUpdateKills(bullet.playerId);
            }
        });

        //
        // Collisions: Monsters
        //
        const collidingMonsters = this.map.collidesByLayer(bullet.id, 'monsters');
        if (collidingMonsters.length > 0) {
            bullet.active = false;

            collidingMonsters.forEach((item) => {
                const monster = this.monsters[item.id];
                if (monster) {
                    monster.hurt();
                    if (!monster.isAlive) {
                        this.monsterRemove(monster.id);
                    }
                }
            });
        }

        //
        // Collisions: Walls
        //
        const collidingWalls = this.map.collidesByLayer(bullet.id, 'tiles');
        if (collidingWalls.length > 0) {
            bullet.active = false;
        }
    };

    private bulletRemove = (id: string) => {
        this.map.removeItem(id);
        this.bullets.delete(id);
    };

    private bulletsClear = () => {
        const ids = Array.from(this.bullets.keys());
        ids.forEach(this.bulletRemove);
    };

    //
    // Utils
    //
    private getLadderCoord(): { x: number; y: number } {
        const ladders = this.map.listItemsByLayerAndTypes('props', PropType.Ladder);
        if (!ladders || !ladders.length) {
            throw new Error(`Couldn't find a spawn point in map with seed "${this.game.seed}"`);
        }

        return ladders[0];
    }

    private setPlayersActive(active: boolean) {
        this.players.forEach((player) => {
            player.setLives(active ? player.maxLives : 0);
        });
    }
}
