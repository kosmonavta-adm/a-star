import { ArrayCoordinates, BlockType } from "./types";

export class NodeElement {
    g: number = Number.MAX_SAFE_INTEGER;
    h: number = Number.MAX_SAFE_INTEGER;
    isGoal: boolean = false;
    isStart: boolean = false;
    position: ArrayCoordinates;
    parent?: NodeElement;
    blockType: BlockType;

    constructor(position: ArrayCoordinates, blockType: BlockType) {
        this.position = position;
        this.blockType = blockType;
    }

    public get f(): number {
        return this.g + this.h;
    }
}
