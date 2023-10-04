import { BLOCK_TYPE } from "./constants";
import { NodeElement } from "./node";

export type GameMap = NodeElement[][];

// export type BlockType = typeof BLOCK_TYPE;

export type BlockType = (typeof BLOCK_TYPE)[keyof typeof BLOCK_TYPE];

export interface Coordinates {
    x: number;
    y: number;
}

export interface ArrayCoordinates {
    x: number;
    y: number;
}
