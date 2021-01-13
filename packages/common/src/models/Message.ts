export type MessageType = 'start' | 'stop' | 'joined' | 'killed' | 'won' | 'left' | 'timeout';
export interface MessageJSON {
    type: MessageType;
    ts: number;
    from: string;
    params: any;
}
