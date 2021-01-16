export type WallCollisionType = 'full' | 'none';

/**
 * Represent the initial parameters of a Player
 */
export interface IPlayerOptions {
    playerName?: string;
}

/**
 * Represent the initial parameters of a Room
 */
export interface IRoomOptions {
    playerName?: string;
    roomName: string;
    roomMaxPlayers: number;
}
