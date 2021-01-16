import { Client, Room } from 'colyseus.js';
import { Constants, Models, Types } from '@tosios/common';
import { HUD, HUDProps } from './HUD';
import React, { Component, RefObject } from 'react';
import { RouteComponentProps, navigate } from '@reach/router';
import { GameState } from '../game/Game';
import { Helmet } from 'react-helmet';
import { View } from '../components';
import qs from 'querystringify';

interface IProps extends RouteComponentProps {
    roomId?: string;
}

interface IState {
    hud: HUDProps;
}

export default class Match extends Component<IProps, IState> {
    private canvasRef: RefObject<HTMLDivElement>;

    private gameState: GameState;

    private client?: Client;

    private room?: Room;

    private timer: NodeJS.Timeout | null = null;

    // BASE
    constructor(props: IProps) {
        super(props);

        this.canvasRef = React.createRef();
        this.gameState = new GameState({
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            onActionSend: this.handleActionSend,
        });

        this.state = {
            hud: {
                // gameMode: '',
                // gameMap: '',
                stateEndsAt: 0,
                roomName: '',
                playerId: '',
                playerName: '',
                playerLives: 0,
                playerMaxLives: 0,
                players: [],
                playersCount: 0,
                playersMaxCount: 0,
                messages: [],
                announce: '',
            },
        };
    }

    componentDidMount() {
        this.start();
    }

    componentWillUnmount() {
        this.stop();
    }

    // LIFECYCLE
    start = async () => {
        const { roomId = '', location: { search = '' } = {} } = this.props;

        const isNewRoom = roomId === 'new';
        const parsedSearch = qs.parse(search) as Types.IRoomOptions;

        let options;
        if (isNewRoom) {
            options = {
                ...parsedSearch,
                roomMaxPlayers: Number(parsedSearch.roomMaxPlayers),
            };
        } else {
            // The only thing to pass when joining an existing room is a player's name
            options = {
                playerName: localStorage.getItem('playerName'),
            };
        }

        // Connect
        try {
            const host = window.document.location.host.replace(/:.*/, '');
            const port = process.env.NODE_ENV !== 'production' ? Constants.WS_PORT : window.location.port;
            const url = `${window.location.protocol.replace('http', 'ws')}//${host}${port ? `:${port}` : ''}`;

            this.client = new Client(url);
            if (isNewRoom) {
                this.room = await this.client.create(Constants.ROOM_NAME, options);

                // We replace the "new" in the URL with the room's id
                window.history.replaceState(null, '', `/${this.room.id}`);
            } else {
                this.room = await this.client.joinById(roomId, options);
            }
        } catch (error) {
            navigate('/');
            return;
        }

        // Set the current player id
        this.setState((prev) => ({
            ...prev,
            hud: {
                ...prev.hud,
                playerId: this.room ? this.room.sessionId : '',
            },
        }));

        // Listen for state changes
        this.room.state.game.onChange = this.handleGameChange;
        this.room.state.players.onAdd = this.handlePlayerAdd;
        this.room.state.players.onRemove = this.handlePlayerRemove;
        this.room.state.monsters.onAdd = this.handleMonsterAdd;
        this.room.state.monsters.onRemove = this.handleMonsterRemove;
        this.room.state.props.onAdd = this.handlePropAdd;
        this.room.state.props.onRemove = this.handlePropRemove;
        this.room.state.bullets.onAdd = this.handleBulletAdd;
        this.room.state.bullets.onRemove = this.handleBulletRemove;

        // Listen for Messages
        this.room.onMessage('*', this.handleMessage);

        // Start game
        this.gameState.start(this.canvasRef.current);

        // Listen for inputs
        window.addEventListener('resize', this.handleWindowResize);

        // Start players refresh listeners
        this.timer = setInterval(this.updateRoom, Constants.PLAYERS_REFRESH);
    };

    stop = () => {
        // Colyseus
        if (this.room) {
            this.room.leave();
        }

        // Game
        this.gameState.stop();

        // Inputs
        window.removeEventListener('resize', this.handleWindowResize);

        // Start players refresh listeners
        if (this.timer) {
            clearInterval(this.timer);
        }
    };

    // HANDLERS: Colyseus
    handleGameChange = (attributes: any) => {
        for (const row of attributes) {
            this.gameState.gameUpdate(row.field, row.value);
        }
    };

    handlePlayerAdd = (player: any, playerId: string) => {
        const isMe = this.isPlayerIdMe(playerId);
        this.gameState.playerAdd(playerId, player, isMe);
        this.updateRoom();

        player.onChange = () => {
            this.handlePlayerUpdate(player, playerId);
        };
    };

    handlePlayerUpdate = (player: any, playerId: string) => {
        const isMe = this.isPlayerIdMe(playerId);
        this.gameState.playerUpdate(playerId, player, isMe);
    };

    handlePlayerRemove = (player: Models.PlayerJSON, playerId: string) => {
        const isMe = this.isPlayerIdMe(playerId);
        this.gameState.playerRemove(playerId, isMe);
        this.updateRoom();
    };

    handleMonsterAdd = (monster: any, monsterId: string) => {
        this.gameState.monsterAdd(monsterId, monster);

        monster.onChange = () => {
            this.handleMonsterUpdate(monster, monsterId);
        };
    };

    handleMonsterUpdate = (monster: Models.MonsterJSON, monsterId: string) => {
        this.gameState.monsterUpdate(monsterId, monster);
    };

    handleMonsterRemove = (monster: Models.MonsterJSON, monsterId: string) => {
        this.gameState.monsterRemove(monsterId);
    };

    handlePropAdd = (prop: any, propId: string) => {
        this.gameState.propAdd(propId, prop);

        prop.onChange = () => {
            this.handlePropUpdate(prop, propId);
        };
    };

    handlePropUpdate = (prop: Models.PropJSON, propId: string) => {
        this.gameState.propUpdate(propId, prop);
    };

    handlePropRemove = (prop: Models.PropJSON, propId: string) => {
        this.gameState.propRemove(propId);
    };

    handleBulletAdd = (bullet: Models.BulletJSON, bulletId: string) => {
        this.gameState.bulletAdd(bulletId, bullet);
    };

    handleBulletRemove = (bullet: Models.BulletJSON, bulletId: string) => {
        this.gameState.bulletRemove(bulletId);
    };

    handleMessage = (type: any, message: Models.MessageJSON) => {
        const { messages } = this.state.hud;

        let announce: string | undefined;
        switch (type) {
            case 'start':
                announce = `Game starts`;
                break;
            case 'won':
                announce = `${message.params.name} wins!`;
                break;
            case 'timeout':
                announce = `Timeout...`;
                break;
            default:
                break;
        }

        this.setState((prev) => ({
            hud: {
                ...prev.hud,
                // Only set the last n messages (negative value on slice() is reverse)
                messages: [...messages, message].slice(-Constants.LOG_LINES_MAX),
                announce,
            },
        }));

        this.updateRoom();
    };

    // HANDLERS: GameManager
    handleActionSend = (action: Models.ActionJSON) => {
        if (!this.room) {
            return;
        }

        this.room.send(action.type, action);
    };

    // HANDLERS: Inputs
    handleWindowResize = () => {
        this.gameState.setScreenSize(window.innerWidth, window.innerHeight);
    };

    // METHODS
    isPlayerIdMe = (playerId: string) => {
        return this.state.hud.playerId === playerId;
    };

    updateRoom = () => {
        const stats = this.gameState.getStats();

        this.setState((prev) => ({
            ...prev,
            hud: {
                ...prev.hud,
                ...stats,
            },
        }));
    };

    // RENDER
    render() {
        const { hud } = this.state;

        return (
            <View
                style={{
                    position: 'relative',
                    height: '100%',
                }}
            >
                {/* Set page's title */}
                <Helmet>
                    {/* <title>{`${hud.roomName || hud.gameMode} [${hud.playersCount}]`}</title> */}
                    <title>{`${hud.roomName} [${hud.playersCount}]`}</title>
                </Helmet>

                {/* Where PIXI is injected */}
                <div ref={this.canvasRef} />

                {/* HUD: GUI, menu, leaderboard */}
                <HUD
                    playerId={hud.playerId}
                    // gameMode={hud.gameMode}
                    // gameMap={hud.gameMap}
                    stateEndsAt={hud.stateEndsAt}
                    roomName={hud.roomName}
                    playerName={hud.playerName}
                    playerLives={hud.playerLives}
                    playerMaxLives={hud.playerMaxLives}
                    players={hud.players}
                    playersCount={hud.playersCount}
                    playersMaxCount={hud.playersMaxCount}
                    messages={hud.messages}
                    announce={hud.announce}
                />
            </View>
        );
    }
}
