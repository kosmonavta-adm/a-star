import { Application, Graphics, Container, BitmapFont, BitmapText, autoDetectRenderer } from "pixi.js";

import { BLOCK_SIZE, BLOCK_TYPE, BLOCK_TYPE_COLOR, MAP_SIZE } from "./constants";
import { calculateManhattanDistance, convertToArrayIndex, convertToCoordinate } from "./utils";
import { BlockType, Coordinates, GameMap } from "./types";
import { NodeElement } from "./node";

let currentBlock: BlockType = BLOCK_TYPE.WALL;

let startNode: NodeElement;
let endNode: NodeElement;

const map = createMap();

const container = new Container();

function drawGrid() {
    const container = new Container();

    const horizontalLines = new Graphics();
    const verticalLines = new Graphics();

    let x = 0;
    let y = 0;

    for (let i = 0; i < MAP_SIZE.WIDTH; i++) {
        horizontalLines.moveTo(x, 0);
        horizontalLines.lineStyle(1, "#ffffff", 0.1);
        horizontalLines.lineTo(x, innerHeight);
        horizontalLines.closePath();
        x += BLOCK_SIZE;
    }

    for (let i = 0; i < MAP_SIZE.HEIGHT; i++) {
        verticalLines.moveTo(0, y);
        verticalLines.lineStyle(1, "#ffffff", 0.1);
        verticalLines.lineTo(innerWidth, y);
        verticalLines.closePath();
        y += BLOCK_SIZE;
    }

    container.addChild(horizontalLines, verticalLines);

    return container;
}

function drawBlock(position: Coordinates, blockType: BlockType) {
    const block = new Graphics();

    // if (map[position.x][position.y].blockType === blockType) return null;
    if (blockType === BLOCK_TYPE.START) {
        startNode.position = { ...position };
    }
    if (blockType === BLOCK_TYPE.END) {
        endNode.position = { ...position };
    }

    map[position.x][position.y].blockType = blockType;

    block.beginFill(BLOCK_TYPE_COLOR[blockType]);
    block.drawRect(convertToCoordinate(position.x), convertToCoordinate(position.y), BLOCK_SIZE, BLOCK_SIZE);
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

function drawGui() {
    const menuLayer = new Container();

    const menu = new Graphics();
    const menuItem = new Graphics();

    menu.beginFill("black", 0.8);
    menu.drawRoundedRect(32, window.innerHeight - 32 - 150, 200, 150, 5);

    menuItem.beginFill("green");
    menuItem.drawRect(64, window.innerHeight - 150 - 32 + 16, BLOCK_SIZE, BLOCK_SIZE);
    menuItem.beginFill("blue");
    menuItem.drawRect(64, window.innerHeight - 150 - 32 + 16 + 32, BLOCK_SIZE, BLOCK_SIZE);
    menuItem.beginFill("red");
    menuItem.drawRect(64, window.innerHeight - 150 - 32 + 16 + 32 + 32, BLOCK_SIZE, BLOCK_SIZE);

    menuLayer.addChild(menu);
    menuLayer.addChild(menuItem);

    BitmapFont.from("Courier New", {
        fill: "#fff",
        fontSize: 18,
    });

    const start = new BitmapText("Start", { fontName: "Courier New" });
    start.x = 64 + 16 + 16;
    start.y = window.innerHeight - 150 - 32 + 16;
    const end = new BitmapText("End", { fontName: "Courier New" });
    end.x = 64 + 16 + 16;
    end.y = window.innerHeight - 150 - 32 + 16 + 32;
    const wall = new BitmapText("Wall", { fontName: "Courier New" });
    wall.x = 64 + 16 + 16;
    wall.y = window.innerHeight - 150 - 32 + 16 + 32 + 32;
    const go = new BitmapText("Go", { fontName: "Courier New" });
    go.x = 64 + 16 + 16;
    go.y = window.innerHeight - 150 - 32 + 16 + 32 + 32 + 32;

    start.eventMode = "static";
    start.cursor = "pointer";
    start.addEventListener("pointerdown", () => {
        currentBlock = BLOCK_TYPE.START;
    });
    end.eventMode = "static";
    end.cursor = "pointer";
    end.addEventListener("pointerdown", () => {
        currentBlock = BLOCK_TYPE.END;
    });
    wall.eventMode = "static";
    wall.cursor = "pointer";
    wall.addEventListener("pointerdown", () => {
        currentBlock = BLOCK_TYPE.WALL;
    });
    go.eventMode = "static";
    go.cursor = "pointer";
    go.addEventListener("pointerdown", () => {
        aStar();
    });

    menuLayer.addChild(start);
    menuLayer.addChild(end);
    menuLayer.addChild(wall);
    menuLayer.addChild(go);

    return menuLayer;
}

function aStar() {
    const nodeWithLowestF = (openList: Set<NodeElement>) => {
        let currentF = Infinity;
        let result: NodeElement;

        openList.forEach((item) => {
            if (item.f === undefined) throw new Error("F score is not initialized, can't find item.");
            if (item.f < currentF || result === undefined) {
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

    let currentNode = startNode;

    open.add(currentNode);

    while (open.size) {
        currentNode = nodeWithLowestF(open);

        if (currentNode.isGoal) {
            const reconstructPath = (node: NodeElement) => {
                if (node.parent !== undefined) {
                    drawBlock(node.position, BLOCK_TYPE.PATH);
                    reconstructPath(node.parent);
                }
                return;
            };
            reconstructPath(currentNode.parent);
            break;
        }

        open.delete(currentNode);
        closed.add(currentNode);

        let adjacentNodes = getAdjacentNodes(currentNode);

        drawBlock(currentNode.position, BLOCK_TYPE.OPEN_NODES);

        adjacentNodes.forEach((node) => {
            if (closed.has(node)) return;

            const newG = currentNode.g + 1;

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

function init() {
    const app = new Application<HTMLCanvasElement>({
        background: "#1099bb",
        resizeTo: window,
    });

    const renderer = autoDetectRenderer();

    const startPosition = {
        x: Math.floor(0.5 * MAP_SIZE.WIDTH),
        y: Math.floor(0.1 * MAP_SIZE.HEIGHT),
    };
    const endPosition = {
        x: Math.floor(0.1 * MAP_SIZE.WIDTH),
        y: Math.floor(0.9 * MAP_SIZE.HEIGHT),
    };

    endNode = map[endPosition.x][endPosition.y];
    endNode.blockType = BLOCK_TYPE.END;
    endNode.isGoal = true;

    startNode = map[startPosition.x][startPosition.y];
    startNode.blockType = BLOCK_TYPE.START;
    startNode.isStart = true;
    startNode.g = 0;
    startNode.h = calculateManhattanDistance(startNode, endNode);

    const start = drawBlock(startNode.position, startNode.blockType);
    const end = drawBlock(endNode.position, endNode.blockType);

    container.addChild(start);
    container.addChild(end);

    const grid = drawGrid();
    const gui = drawGui();

    app.stage.addChild(container);
    app.stage.addChild(gui);
    container.addChild(grid);

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
        const isBlockNull = block === null;

        if (isBlockNull) return;

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
            const isBlockNull = block === null;

            if (isBlockNull) return;

            container.addChild(block);
        }
    });

    container.addEventListener("pointerup", () => {
        isPointerDown = false;
    });

    document.body.appendChild(app.view);
}

init();
