const { innerWidth, innerHeight } = window;

export const BLOCK_SIZE = 16;

export const MAP_SIZE = {
    WIDTH: Math.floor(innerWidth / BLOCK_SIZE),
    HEIGHT: Math.floor(innerHeight / BLOCK_SIZE),
} as const;

export const BLOCK_TYPE = {
    EMPTY: 0,
    WALL: 1,
    PLAYER: 255,
} as const;
