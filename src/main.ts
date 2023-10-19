import { Application, Graphics, Container } from "pixi.js";

import { BLOCK_SIZE, BLOCK_TYPE, BLOCK_TYPE_COLOR, GAME_STATE, MAP_SIZE } from "./constants";
import {
    calculateManhattanDistance,
    checkIsSamePosition,
    convertToArrayIndex,
    convertToCoordinate,
    createNotification,
    getDistance,
    sleep,
} from "./utils";
import { BlockType, Coordinates, GameMap } from "./types";
import { NodeElement } from "./node";

let currentBlock: BlockType | undefined;
let currentNode: NodeElement;
let startNode: NodeElement | undefined;
let endNode: NodeElement | undefined;
let prevPosition: Coordinates;
let timePassed = 0;
let isBlazinglyFast = false;
let slowdown = 0;

const blockButtons = document.querySelectorAll<HTMLInputElement>(".radio-input");
const menuButton = document.querySelector<HTMLButtonElement>(".menu-button");
const clearBoardButton = document.querySelector<HTMLButtonElement>(".clear-board");
const startStopButton = document.querySelector<HTMLButtonElement>(".start-stop");
const menu = document.querySelector<HTMLDivElement>(".menu");
const blazinglyFastCheckbox = document.querySelector<HTMLInputElement>('[data-option="blazinglyFast"]');
const slowdownRange = document.querySelector<HTMLInputElement>('[data-option="slowdown"]');
const slowdownWrapper = document.querySelector<HTMLInputElement>(".slowdown-wrapper");
const pauseButton = document.querySelector<HTMLInputElement>('[data-option="pause"]');
const resumeButton = document.querySelector<HTMLInputElement>('[data-option="resume"]');
const resetButton = document.querySelector<HTMLInputElement>('[data-option="reset"]');

let map = createMap();

const container = new Container();

let currentGameState = GAME_STATE.DRAWING;

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

function clearBoard() {
    startNode = undefined;
    endNode = undefined;
    while (container.children[0]) {
        container.removeChild(container.children[0]);
    }
    map = createMap();
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

    const reconstructPath = async (node?: NodeElement) => {
        isBlazinglyFast === false && (await sleep(slowdown));
        if (node === undefined) return;
        if (node.parent !== undefined) {
            drawBlock(node.position, BLOCK_TYPE.PATH);
            reconstructPath(node.parent);
        }
    };

    const open = new Set<NodeElement>();
    const closed = new Set();

    if (startNode === undefined) throw new Error("Start node is not defined");
    drawBlock(startNode?.position, startNode.blockType);
    currentNode = startNode;

    open.add(currentNode);

    while (open.size) {
        if (currentGameState === GAME_STATE.PAUSED) {
            await sleep(100);
            timePassed += 100;
            continue;
        }
        currentNode = nodeWithLowestF(open);

        isBlazinglyFast === false && (await sleep(slowdown));

        if (currentNode?.isGoal) {
            reconstructPath(currentNode.parent);
            currentGameState = GAME_STATE.PATH_FOUND;
            break;
        }

        open.delete(currentNode);
        closed.add(currentNode);

        let adjacentNodes = getAdjacentNodes(currentNode);

        currentNode !== startNode && drawBlock(currentNode?.position, BLOCK_TYPE.OPEN_NODE);

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

    if (currentGameState !== GAME_STATE.PATH_FOUND) {
        currentGameState = GAME_STATE.PATH_NOT_FOUND;
        createNotification("Path not found");
    }

    pauseButton?.classList.remove("visible");
    pauseButton?.classList.add("hidden");

    resetButton?.classList.remove("hidden");
    resetButton?.classList.add("visible");
}

function init() {
    if (startStopButton === null) throw new Error("Start button is not defined");
    if (menuButton === null) throw new Error("Menu button is not defined");
    if (menu === null) throw new Error("Menu is not defined");
    if (clearBoardButton === null) throw new Error("Clear board button is not defined");
    if (blazinglyFastCheckbox === null) throw new Error("Blazingly fast checkbox is not defined");
    if (slowdownRange === null) throw new Error("Slowdown range is not defined");
    if (slowdownWrapper === null) throw new Error("Slowdown range wrapper is not defined");
    if (pauseButton === null) throw new Error("Pause button is not defined");
    if (resumeButton === null) throw new Error("Resume button is not defined");
    if (resetButton === null) throw new Error("Reset button is not defined");

    blockButtons.forEach((button) =>
        button?.addEventListener("change", (e) => {
            const { value } = e.target as HTMLInputElement;
            const choosenBlockType = value as keyof typeof BLOCK_TYPE;
            currentBlock = BLOCK_TYPE[choosenBlockType];
            menuButton.style.backgroundColor = BLOCK_TYPE_COLOR[currentBlock];
        })
    );

    menuButton.addEventListener("click", () => {
        menu?.classList.toggle("menu--hidden");
    });

    startStopButton.addEventListener("click", () => {
        switch (currentGameState) {
            case GAME_STATE.DRAWING: {
                if (startNode === undefined || endNode === undefined) {
                    createNotification("Start and end nodes must be present");
                    return;
                }
                currentBlock = undefined;

                currentGameState = GAME_STATE.RUNNING;

                blockButtons.forEach((item) => {
                    item.disabled = true;
                    item.checked = false;
                });

                slowdownWrapper.classList.add("slowdown-wrapper--visible");
                menuButton.classList.add("menu-button--running");
                menuButton.removeAttribute("style");

                blazinglyFastCheckbox.disabled = true;
                clearBoardButton.disabled = true;
                startStopButton.disabled = true;

                menu.classList.toggle("menu--hidden");

                aStar();

                break;
            }
        }
    });

    clearBoardButton.addEventListener("click", () => clearBoard());

    blazinglyFastCheckbox.addEventListener("change", (e) => {
        const { checked } = e.target as HTMLInputElement;
        isBlazinglyFast = checked;
    });

    slowdownRange.addEventListener("input", (e) => {
        const { value } = e.target as HTMLInputElement;
        slowdown = Number(value);
    });

    pauseButton.addEventListener("click", (_) => {
        currentGameState = GAME_STATE.PAUSED;
        pauseButton.classList.remove("visible");
        pauseButton.classList.add("hidden");

        resumeButton.classList.add("visible");
    });

    resumeButton.addEventListener("click", (_) => {
        currentGameState = GAME_STATE.RUNNING;
        resumeButton.classList.remove("visible");
        resumeButton.classList.add("hidden");

        pauseButton.classList.add("visible");
    });

    resetButton.addEventListener("click", (_) => {
        currentGameState = GAME_STATE.DRAWING;
        currentBlock = undefined;

        clearBoard();

        menuButton.removeAttribute("style");

        clearBoardButton.disabled = false;
        startStopButton.disabled = false;
        blazinglyFastCheckbox.disabled = false;
        blockButtons.forEach((item) => (item.disabled = false));

        slowdownWrapper.classList.remove("slowdown-wrapper--visible");
        resetButton.classList.remove("visible");
        menuButton.classList.remove("menu-button--running");

        resetButton.classList.add("hidden");
        pauseButton.classList.add("visible");
    });

    const gridContainer = new Container();
    const app = new Application<HTMLCanvasElement>({
        background: "#1099bb",
        resizeTo: window,
    });

    const menuButtonPosition: Coordinates = {
        x: menuButton.offsetWidth / 2 + menuButton.offsetLeft,
        y: menuButton.offsetHeight / 2 + menuButton.offsetTop,
    };
    const grid = drawGrid();

    gridContainer.addChild(grid);

    app.stage.addChild(container);
    app.stage.addChild(gridContainer);

    container.eventMode = "static";
    container.hitArea = app.screen;

    let isPointerDown = false;

    container.addEventListener("pointerdown", (e) => {
        if (currentBlock === undefined) return;
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
        if (isPointerDown === false || currentBlock === undefined) return;

        const position = e.global;

        const distanceToButton = getDistance(menuButtonPosition, position);

        if (distanceToButton <= 100) {
            menuButton.style.opacity = `${distanceToButton}%`;

            if (distanceToButton <= 50) {
                menuButton.style.opacity = `50%`;
            }
        }

        const arrayCoordinates = {
            x: convertToArrayIndex(position.x),
            y: convertToArrayIndex(position.y),
        };
        const block = drawBlock(arrayCoordinates, currentBlock);
        const isBlockUndefined = block === undefined;

        if (isBlockUndefined) return;

        container.addChild(block);
    });

    container.addEventListener("pointerup", () => {
        isPointerDown = false;

        menuButton.style.removeProperty("opacity");
    });

    document.body.appendChild(app.view);
}

init();
