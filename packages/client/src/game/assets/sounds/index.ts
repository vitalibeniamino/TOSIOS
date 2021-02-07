import { Howl, Howler } from 'howler';

const coin = require('./coin.ogg');
const footstep = require('./footstep.ogg');

Howler.volume(1.0);

const CoinSound = new Howl({
    src: [coin],
    loop: false,
    preload: true,
    autoplay: false,
    volume: 0.3,
});

const FootstepSound = new Howl({
    src: [footstep],
    loop: false,
    preload: true,
    autoplay: false,
    volume: 0.3,
});

export { CoinSound, FootstepSound };
