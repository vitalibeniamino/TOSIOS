import React, { CSSProperties } from 'react';
import { Container } from '.';
import { IconButton } from './IconButton';
import { Menu } from '../../icons';
import { isMobile } from 'react-device-detect';

/**
 * Render menu button.
 */
export const MenuButton = React.memo(
    (props: { style?: CSSProperties; onMenuClicked: () => void }): React.ReactElement => {
        const { style, onMenuClicked } = props;

        return (
            <Container
                style={{
                    ...styles.players,
                    ...style,
                }}
            >
                <IconButton
                    icon={Menu}
                    style={{
                        ...styles.menuButton,
                        ...(isMobile ? { width: 40, height: 40 } : {}),
                    }}
                    onClick={onMenuClicked}
                />
            </Container>
        );
    },
);

const styles: { [key: string]: CSSProperties } = {
    players: {
        flexDirection: 'row',
        pointerEvents: 'all',
    },
    menuButton: {},
};
