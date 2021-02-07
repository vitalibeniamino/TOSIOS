import React, { CSSProperties } from 'react';
import { Space, View } from '../../components';
import { IPlayer } from '../../game/entities/Player';
import { Player } from './Player';

/**
 * Render the current players in the game.
 */
export function Players(props: {
    player: IPlayer;
    players: IPlayer[];
    style?: CSSProperties;
}): React.ReactElement | null {
    const { player, players, style } = props;

    const filteredPlayers = players.filter((item) => item.id !== player.id);

    return (
        <View style={{ ...styles.players, ...style }}>
            {/* Current player */}
            <Player
                name={player.name}
                lives={player.lives}
                maxLives={player.maxLives}
                money={player.money}
                size="normal"
                style={styles.health}
            />
            <Space size="s" />
            {/* Other players */}
            {filteredPlayers.map((item) => (
                <>
                    <Player
                        key={item.id}
                        name={item.name}
                        lives={item.lives}
                        maxLives={item.maxLives}
                        money={item.money}
                        size="small"
                        style={styles.health}
                    />
                    <Space size="s" />
                </>
            ))}
        </View>
    );
}

const styles: { [key: string]: CSSProperties } = {
    players: {
        flexDirection: 'column',
        alignItems: 'center',
    },
};
