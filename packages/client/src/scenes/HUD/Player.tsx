import { Inline, Space, Text, View } from '../../components';
import React, { CSSProperties } from 'react';

import { coinImage, heartEmptyImage, heartFullImage } from '../../images';
import { Container } from '.';
import { isMobile } from 'react-device-detect';

const IMG_NORMAL_SIZE = isMobile ? 24 : 36;
const IMG_SMALL_SIZE = isMobile ? 18 : 24;
const FONT_NORMAL_SIZE = isMobile ? 14 : 16;
const FONT_SMALL_SIZE = isMobile ? 16 : 14;

interface PlayerProps {
    name: string;
    lives: number;
    maxLives: number;
    money: number;
    size: 'normal' | 'small';
    style?: CSSProperties;
}

/**
 * Render a player.
 */
export const Player = React.memo(
    (props: PlayerProps): React.ReactElement => {
        const { name, lives, maxLives = 3, money = 0, size = 'normal', style } = props;
        const isNormal = size === 'normal';

        // Create list of hearts
        const hearts = [];
        for (let i = 0; i < maxLives; i++) {
            const isFull = i < lives;

            hearts.push(
                <img
                    key={i}
                    src={isFull ? heartFullImage : heartEmptyImage}
                    alt={isFull ? 'full-heart' : 'empty-heart'}
                    width={isNormal ? IMG_NORMAL_SIZE : IMG_SMALL_SIZE}
                    height={isNormal ? IMG_NORMAL_SIZE : IMG_SMALL_SIZE}
                    style={styles.image}
                />,
            );
        }

        return (
            <Container
                style={{
                    ...styles.player,
                    ...style,
                }}
            >
                {/* Name */}
                <Text style={{ ...styles.nameText, fontSize: isNormal ? FONT_NORMAL_SIZE : FONT_SMALL_SIZE }}>
                    {name}
                </Text>
                <Space size="xxs" />

                {/* Status */}
                <View style={styles.status}>
                    <View style={styles.hearts}>{hearts}</View>
                    <Inline size="xs" />
                    <View style={styles.money}>
                        <img
                            src={coinImage}
                            alt="coin"
                            width={isNormal ? IMG_NORMAL_SIZE : IMG_SMALL_SIZE}
                            height={isNormal ? IMG_NORMAL_SIZE : IMG_SMALL_SIZE}
                            style={styles.image}
                        />
                        <Text style={{ ...styles.moneyText, fontSize: isNormal ? FONT_NORMAL_SIZE : FONT_SMALL_SIZE }}>
                            {money}
                        </Text>
                    </View>
                </View>
            </Container>
        );
    },
);

const styles: { [key: string]: CSSProperties } = {
    player: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        width: 'fit-content',
    },
    image: {
        imageRendering: 'pixelated',
    },
    // Name
    nameText: {
        color: 'white',
    },
    // Status
    status: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'row',
    },
    hearts: {
        display: 'flex',
        alignItems: 'center',
    },
    money: {
        display: 'flex',
        alignItems: 'center',
    },
    moneyText: {
        color: 'white',
    },
};
