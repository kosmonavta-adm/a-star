import { Application, Graphics, Container } from "pixi.js";

import { BLOCK_SIZE, BLOCK_TYPE, BLOCK_TYPE_COLOR, MAP_SIZE } from "./constants";
import { calculateManhattanDistance, convertToArrayIndex, convertToCoordinate } from "./utils";
import { BlockType, Coordinates, GameMap } from "./types";
import { NodeElement } from "./node";

let currentBlock: BlockType = BLOCK_TYPE.WALL;
let currentNode: NodeElement;
let startNode: NodeElement | undefined;
let endNode: NodeElement | undefined;
let prevPosition: Coordinates;

let map = createMap();

const container = new Container();

function drawGrid() {
    const grid = new Graphics();

    let x = 0;
    let y = 0;

    for (let i = 0; i < MAP_SIZE.WIDTH; i++) {
        grid.moveTo(x, 0);
        grid.lineStyle(1, "#ffffff", 0.1);
        grid.lineTo(x, innerHeight);
        grid.closePath();
        x += BLOCK_SIZE;
    }

    for (let i = 0; i < MAP_SIZE.HEIGHT; i++) {
        grid.moveTo(0, y);
        grid.lineStyle(1, "#ffffff", 0.1);
        grid.lineTo(innerWidth, y);
        grid.closePath();
        y += BLOCK_SIZE;
    }

    return grid;
}

function clearNode(nodeToClear: NodeElement) {
    nodeToClear.blockType = 0;
    nodeToClear.isStart = false;
    nodeToClear.isGoal = false;
    nodeToClear.g = Number.MAX_SAFE_INTEGER;
    nodeToClear.h = Number.MAX_SAFE_INTEGER;

    if (nodeToClear?.graphic?.destroyed === false) {
        nodeToClear.graphic?.destroy(true);
    }
}

function checkIsSamePosition(prevPosition: Coordinates, currentPosition: Coordinates) {
    if (prevPosition?.x === currentPosition.x && prevPosition?.y === currentPosition.y) return true;

    return false;
}

function drawBlock(currentPosition: Coordinates, blockType: BlockType) {
    const { x, y } = currentPosition;
    const isSamePosition = checkIsSamePosition(prevPosition, currentPosition);
    const isSameBlock = map[x][y].blockType === blockType;

    if ((isSamePosition && isSameBlock) || isSameBlock) return;

    prevPosition = { ...currentPosition };

    const block = new Graphics();

    const isNodeNotEmpty = map[x][y].blockType !== BLOCK_TYPE.EMPTY;
    const isGraphicDefined = map[x][y]?.graphic !== undefined;

    if (isNodeNotEmpty && isGraphicDefined) map[x][y].graphic?.destroy(true);

    switch (blockType) {
        case BLOCK_TYPE.ERASER: {
            clearNode(map[x][y]);
            break;
        }
        case BLOCK_TYPE.START: {
            if (startNode !== undefined) clearNode(startNode);

            startNode = map[x][y];
            startNode.position = currentPosition;
            startNode.isStart = true;
            startNode.g = 0;
            if (endNode !== undefined) {
                startNode.h = calculateManhattanDistance(startNode, endNode);
            }
            break;
        }
        case BLOCK_TYPE.END: {
            if (endNode !== undefined) clearNode(endNode);

            endNode = map[x][y];
            endNode.position = currentPosition;
            endNode.isGoal = true;

            if (startNode !== undefined && startNode.h === Number.MAX_SAFE_INTEGER) {
                startNode.h = calculateManhattanDistance(startNode, endNode);
            }
            break;
        }
        case BLOCK_TYPE.WALL: {
            break;
        }
    }

    map[x][y].blockType = blockType;
    map[x][y].graphic = block;
    block.beginFill(BLOCK_TYPE_COLOR[blockType]);
    block.drawRect(convertToCoordinate(x), convertToCoordinate(y), BLOCK_SIZE, BLOCK_SIZE);
    container.addChild(block);
    return block;
}

function createMap(): GameMap {
    const map: GameMap = new Array(MAP_SIZE.WIDTH);
    for (let x = 0; x < MAP_SIZE.WIDTH; x++) {
        map[x] = new Array(MAP_SIZE.HEIGHT);
        for (let y = 0; y < MAP_SIZE.HEIGHT; y++) {
            map[x][y] = new NodeElement({ x, y }, 0);
        }
    }

    return map;
}

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function aStar() {
    const nodeWithLowestF = (openList: Set<NodeElement>) => {
        let currentF = Infinity;
        let result = openList.values().next().value;

        openList.forEach((item) => {
            if (item.f === undefined) throw new Error("F score is not initialized, can't find item.");
            if (item.f < currentF) {
                result = item;
                currentF = item.f;
            }
        });
        return result;
    };

    const getAdjacentNodes = (node: NodeElement) => {
        const DIRECTIONS = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
        ] as const;

        const isValidPosition = (x: number, y: number) => {
            return x >= 0 && x < MAP_SIZE.WIDTH && y >= 0 && y < MAP_SIZE.HEIGHT;
        };

        let adjacentNodes: NodeElement[] = [];

        DIRECTIONS.forEach((direction) => {
            let newX = node.position.x + direction.x;
            let newY = node.position.y + direction.y;
            if (isValidPosition(newX, newY) && map[newX][newY].blockType !== BLOCK_TYPE.WALL) {
                const currentNode = map[newX][newY];
                adjacentNodes.push(currentNode);
            }
        });

        return adjacentNodes;
    };

    const open = new Set<NodeElement>();
    const closed = new Set();

    if (startNode === undefined) throw new Error("Start node is not defined");
    currentNode = startNode;

    open.add(currentNode);

    while (open.size) {
        currentNode = nodeWithLowestF(open);
        await sleep(0);

        if (currentNode?.isGoal) {
            const reconstructPath = async (node?: NodeElement) => {
                await sleep(10);
                if (node === undefined) return;
                if (node.parent !== undefined) {
                    drawBlock(node.position, BLOCK_TYPE.PATH);
                    reconstructPath(node.parent);
                }
            };
            reconstructPath(currentNode.parent);
            break;
        }

        open.delete(currentNode);
        closed.add(currentNode);

        let adjacentNodes = getAdjacentNodes(currentNode);

        drawBlock(currentNode?.position, BLOCK_TYPE.OPEN_NODES);

        adjacentNodes.forEach((node) => {
            if (endNode === undefined) throw new Error("End node is not defined");
            if (closed.has(node)) return;

            const newG = currentNode?.g + 1;

            if (open.has(node) === false || newG < node.g) {
                node.parent = currentNode;
                node.g = newG;
                node.h = calculateManhattanDistance(node, endNode);
                if (open.has(node) === false) {
                    open.add(node);
                }
            }
        });
    }
}

function initGui() {
    const blockButtons = document.querySelectorAll<HTMLInputElement>(".radio-input");
    const menuButton = document.querySelector<HTMLButtonElement>(".menu-button");
    const clearBoardButton = document.querySelector<HTMLButtonElement>(".clear-board");
    const startButton = document.querySelector<HTMLButtonElement>(".start");
    const menu = document.querySelector<HTMLDivElement>(".menu");

    blockButtons.forEach((button) =>
        button?.addEventListener("change", (e) => {
            const { value } = e.target as HTMLInputElement;
            const choosenBlockType = value as keyof typeof BLOCK_TYPE;
            currentBlock = BLOCK_TYPE[choosenBlockType];
        })
    );

    menuButton?.addEventListener("pointerdown", () => {
        menu?.classList.toggle("menu--hidden");
    });

    startButton?.addEventListener("pointerdown", () => {
        aStar();
    });

    clearBoardButton?.addEventListener("pointerdown", () => {
        startNode = undefined;
        endNode = undefined;
        while (container.children[0]) {
            container.removeChild(container.children[0]);
        }
        map = createMap();
    });
}

function init() {
    const gridContainer = new Container();
    const app = new Application<HTMLCanvasElement>({
        background: "#1099bb",
        resizeTo: window,
    });

    const grid = drawGrid();

    gridContainer.addChild(grid);

    app.stage.addChild(container);
    app.stage.addChild(gridContainer);

    container.eventMode = "static";
    container.hitArea = app.screen;

    let isPointerDown = false;

    container.addEventListener("pointerdown", (e) => {
        isPointerDown = true;
        const position = e.global;
        const arrayCoordinates = {
            x: convertToArrayIndex(position.x),
            y: convertToArrayIndex(position.y),
        };
        const block = drawBlock(arrayCoordinates, currentBlock);
        const isBlockUndefined = block === undefined;

        if (isBlockUndefined) return;

        container.addChild(block);
    });

    container.addEventListener("pointermove", (e) => {
        if (isPointerDown) {
            const position = e.global;
            const arrayCoordinates = {
                x: convertToArrayIndex(position.x),
                y: convertToArrayIndex(position.y),
            };
            const block = drawBlock(arrayCoordinates, currentBlock);
            const isBlockUndefined = block === undefined;

            if (isBlockUndefined) return;

            container.addChild(block);
        }
    });

    container.addEventListener("pointerup", () => {
        isPointerDown = false;
    });

    document.body.appendChild(app.view);
}

initGui();
init();
