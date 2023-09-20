const { innerWidth, innerHeight } = window;

export const BLOCK_SIZE = 16;

export const MAP_SIZE = {
    WIDTH: Math.floor(innerWidth / BLOCK_SIZE),
    HEIGHT: Math.floor(innerHeight / BLOCK_SIZE),
} as const;

export const BLOCK_TYPE = {
    EMPTY: 0,
    WALL: 1,
    START: 2,
    END: 3,
} as const;

export const BLOCK_TYPE_COLOR = {
    0: "transparent",
    1: "red",
    2: "green",
    3: "blue",
};
