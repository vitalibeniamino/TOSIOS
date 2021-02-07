import { CoinSound, FootstepSound } from '../assets/sounds';

type SoundType = 'coin' | 'step';

interface SoundsConfigMap {
    [key: string]: {
        lastPlayedAt: number;
        delayBetween: number;
    };
}

export class SoundManager {
    private config: SoundsConfigMap = {
        coin: {
            lastPlayedAt: 0,
            delayBetween: 100,
        },
        step: {
            lastPlayedAt: 0,
            delayBetween: 400,
        },
    };

    play(type: SoundType) {
        const now = Date.now();
        const config = this.config[type];
        const canPlay = config.lastPlayedAt + config.delayBetween < now;

        if (!canPlay) {
            return;
        }

        switch (type) {
            case 'coin':
                CoinSound.play();
                config.lastPlayedAt = now;
                break;
            case 'step':
                FootstepSound.play();
                config.lastPlayedAt = now;
                break;
            default:
                break;
        }
    }
}
