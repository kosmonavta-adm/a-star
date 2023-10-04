import { BLOCK_SIZE } from "./constants";
import { NodeElement } from "./node";

export function convertToArrayIndex(coordinate: number) {
    return Math.floor(coordinate / BLOCK_SIZE);
}

export function convertToCoordinate(arrayIndex: number) {
    return arrayIndex * BLOCK_SIZE;
}

export function calculateManhattanDistance(start: NodeElement, end: NodeElement) {
    return Math.abs(start.position.x - end.position.x) + Math.abs(start.position.y - end.position.y);
}
