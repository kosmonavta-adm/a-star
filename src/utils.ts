import { BLOCK_SIZE } from "./constants";

export function convertToArrayIndex(coordinate: number) {
    return Math.floor(coordinate / BLOCK_SIZE);
}

export function convertToCoordinate(arrayIndex: number) {
    return arrayIndex * BLOCK_SIZE;
}
