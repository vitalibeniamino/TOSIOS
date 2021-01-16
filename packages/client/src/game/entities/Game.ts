import { Models } from '@tosios/common';

export interface IGame {
    state: Models.GameState;
    stateEndsAt: number;
    roomName: string;
    maxPlayers: number;
    seed?: string;
}

export class Game {
    //
    // Sync fields
    //
    public state: Models.GameState;

    public stateEndsAt: number;

    public roomName: string;

    public maxPlayers: number;

    public seed?: string;

    //
    // Lifecycle
    //
    constructor(attributes: IGame) {
        this.state = attributes.state;
        this.stateEndsAt = attributes.stateEndsAt;
        this.roomName = attributes.roomName;
        this.maxPlayers = attributes.maxPlayers;
        this.seed = attributes.seed;
    }
}
