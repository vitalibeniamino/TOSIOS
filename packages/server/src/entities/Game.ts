import { Constants, Models, Types } from '@tosios/common';
import { MapSchema, Schema, type } from '@colyseus/schema';
import { Player } from './Player';

export interface IGame {
    state: Types.GameState;
    stateEndsAt?: number;
    roomName: string;
    maxPlayers: number;
    seed?: string;
    onLobbyStart: (message?: Models.MessageJSON) => void;
    onGameStart: (message?: Models.MessageJSON) => void;
    onGameEnd: (message?: Models.MessageJSON) => void;
}

export class Game extends Schema {
    //
    // Public fields
    //
    @type('string')
    public state: Types.GameState;

    @type('number')
    public stateEndsAt: number;

    @type('string')
    public roomName: string;

    @type('number')
    public maxPlayers: number;

    @type('string')
    public seed: string;

    //
    // Private fields
    //
    private onLobbyStart: (message?: Models.MessageJSON) => void;

    private onGameStart: (message?: Models.MessageJSON) => void;

    private onGameEnd: (message?: Models.MessageJSON) => void;

    //
    // Lifecycle
    //
    constructor(attributes: IGame) {
        super();
        this.state = attributes.state;
        this.stateEndsAt = attributes.stateEndsAt;
        this.roomName = attributes.roomName;
        this.maxPlayers = attributes.maxPlayers;
        this.seed = attributes.seed;
        this.onLobbyStart = attributes.onLobbyStart;
        this.onGameStart = attributes.onGameStart;
        this.onGameEnd = attributes.onGameEnd;
    }

    //
    // Update
    //
    update(players: MapSchema<Player>) {
        switch (this.state) {
            case 'lobby':
                this.updateLobby();
                break;
            case 'game':
                this.updateGame(players);
                break;
            default:
                break;
        }
    }

    updateLobby() {
        // If the lobby is over, the game starts.
        if (this.stateEndsAt < Date.now()) {
            this.startGame();
        }
    }

    updateGame(players: MapSchema<Player>) {
        // If the time is out, the game stops.
        if (this.stateEndsAt < Date.now()) {
            this.onGameEnd({
                type: 'timeout',
                from: 'server',
                ts: Date.now(),
                params: {},
            });
            this.startLobby();

            return;
        }

        // If there are no more active players
        if (countActivePlayers(players) === 0) {
            // Check to see if only one player is alive
            const player = getWinningPlayer(players);
            if (player) {
                this.onGameEnd();
                this.startLobby();
            }
        }
    }

    //
    // Start
    //
    startLobby() {
        this.state = 'lobby';
        this.stateEndsAt = Date.now() + Constants.LOBBY_DURATION;
        this.onLobbyStart();
    }

    startGame() {
        this.state = 'game';
        this.stateEndsAt = Date.now() + Constants.GAME_DURATION;
        this.onGameStart();
    }
}

//
// Utils
//
function countActivePlayers(players: MapSchema<Player>) {
    let count = 0;

    players.forEach((player) => {
        if (player.isAlive) {
            count++;
        }
    });

    return count;
}

function getWinningPlayer(players: MapSchema<Player>): Player | null {
    let winningPlayer = null;

    players.forEach((player, playerId) => {
        if (player.isAlive) {
            winningPlayer = players.get(playerId);
        }
    });

    return winningPlayer;
}
