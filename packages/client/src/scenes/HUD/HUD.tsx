import { Keys, Models } from '@tosios/common';
import { Leaderboard, Menu, MenuButton, Messages, Players, Time } from './';
import React, { CSSProperties } from 'react';
import { Announce } from './Announce';
import { IGame } from '../../game/entities/Game';
import { IPlayer } from '../../game/entities/Player';
import { View } from '../../components';
import { isMobile } from 'react-device-detect';

const HUD_PADDING = isMobile ? 16 : 24;

export interface HUDProps {
    game?: IGame;
    players: IPlayer[];
    messages: Models.MessageJSON[];
    announce?: string;
}

/**
 * The current game's HUD.
 */
export const HUD = React.memo((props: HUDProps): React.ReactElement | null => {
    const { game, players, messages, announce } = props;
    const [leaderboardOpened, setLeaderboardOpened] = React.useState(false);
    const [menuOpened, setMenuOpened] = React.useState(false);

    // Current player
    const player: IPlayer = React.useMemo(() => {
        return players.find((item) => item.isGhost) as IPlayer;
    }, [players]);

    // Create methods callbacks
    const handleLeave = React.useCallback(() => {
        window.location.href = window.location.origin;
    }, []);

    const handleKeyDown = React.useCallback((event: any) => {
        const key = event.code;

        if (Keys.LEADERBOARD.includes(key)) {
            event.preventDefault();
            event.stopPropagation();
            setLeaderboardOpened(true);
        }
    }, []);

    const handleKeyUp = React.useCallback((event: any) => {
        const key = event.code;

        if (Keys.LEADERBOARD.includes(key)) {
            event.preventDefault();
            event.stopPropagation();
            setLeaderboardOpened(false);
        }

        if (Keys.MENU.includes(key)) {
            event.preventDefault();
            event.stopPropagation();
            setMenuOpened((prev) => !prev);
        }
    }, []);

    // Listen for key presses (and unlisten on unmount).
    React.useEffect(() => {
        window.document.addEventListener('keydown', handleKeyDown);
        window.document.addEventListener('keyup', handleKeyUp);

        return () => {
            window.document.removeEventListener('keydown', handleKeyDown);
            window.document.removeEventListener('keyup', handleKeyUp);
        };
    }, [handleKeyDown, handleKeyUp]);

    if (!game || !player) {
        return null;
    }

    return (
        <View flex center fullscreen style={styles.hud}>
            {/* Players (top-left) */}
            <Players player={player} players={players} style={styles.players} />

            {/* Time (top-center) */}
            <Time state={game.state} endsAt={game.stateEndsAt} style={styles.time} />

            {/* Menu (top-right) */}
            <MenuButton style={styles.menu} onMenuClicked={() => setMenuOpened(true)} />

            {/* Messages (bottom-left) */}
            {isMobile ? null : <Messages messages={messages} style={styles.messages} />}

            {/* Announce (center-center) */}
            <Announce announce={announce} style={styles.announce} />

            {/* Leaderboard */}
            {leaderboardOpened ? <Leaderboard roomName={game.roomName} players={players} playerId={player.id} /> : null}

            {/* Menu */}
            {menuOpened ? <Menu onClose={() => setMenuOpened(false)} onLeave={handleLeave} /> : null}
        </View>
    );
});

const styles: { [key: string]: CSSProperties } = {
    hud: {
        padding: HUD_PADDING,
        pointerEvents: 'none',
    },
    players: {
        position: 'absolute',
        left: HUD_PADDING,
        top: HUD_PADDING,
    },
    time: {
        position: 'absolute',
        top: HUD_PADDING,
        alignSelf: 'center',
    },
    menu: {
        position: 'absolute',
        right: HUD_PADDING,
        top: HUD_PADDING,
    },
    messages: {
        position: 'absolute',
        left: HUD_PADDING,
        bottom: HUD_PADDING,
    },
    announce: {
        position: 'absolute',
    },
};
