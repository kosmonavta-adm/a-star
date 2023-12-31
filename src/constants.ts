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
    OPEN_NODE: 4,
    PATH: 5,
    ERASER: 6,
} as const;

export const BLOCK_TYPE_COLOR = {
    0: "transparent",
    1: "#424242",
    2: "#2ECC40",
    3: "#001f3f",
    4: "#7FDBFF",
    5: "#0074D9",
    6: "#1099bb",
};

export const GAME_STATE = {
    RUNNING: "RUNNING",
    DRAWING: "DRAWING",
    PAUSED: "PAUSED",
    PATH_FOUND: "PATH_FOUND",
    PATH_NOT_FOUND: "PATH_NOT_FOUND",
};
