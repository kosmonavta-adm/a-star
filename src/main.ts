import { Application, Graphics, Container, FederatedPointerEvent } from "pixi.js";

import { BLOCK_SIZE, BLOCK_TYPE, MAP_SIZE } from "./constants";
import { convertToArrayIndex, convertToCoordinate } from "./utils";
import { ArrayCoordinates, BlockType, Coordinates, GameMap } from "./types";

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

function drawBlock(e: FederatedPointerEvent, blockType: BlockType, map: GameMap) {
    const block = new Graphics();

    const coordinates: Coordinates = e.global;

    const arrayCoordinates: ArrayCoordinates = {
        x: convertToArrayIndex(coordinates.x),
        y: convertToArrayIndex(coordinates.y),
    };

    if (map[arrayCoordinates.x][arrayCoordinates.y] === blockType) return null;

    map[arrayCoordinates.x][arrayCoordinates.y] = blockType;
    block.beginFill("red");
    block.drawRect(
        convertToCoordinate(arrayCoordinates.x),
        convertToCoordinate(arrayCoordinates.y),
        BLOCK_SIZE,
        BLOCK_SIZE
    );

    return block;
}

function createMap(): GameMap {
    const map: GameMap = new Array(MAP_SIZE.WIDTH).fill(0);
    for (let i = 0; i < MAP_SIZE.WIDTH; i++) {
        map[i] = new Array(MAP_SIZE.HEIGHT).fill(0);
    }

    return map;
}

function init() {
    const map = createMap();

    const app = new Application<HTMLCanvasElement>({
        background: "#1099bb",
        resizeTo: window,
    });

    const container = new Container();

    const grid = drawGrid();

    app.stage.addChild(container);
    container.addChild(grid);

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    let isPointerDown = false;

    app.stage.addEventListener("pointerdown", (e) => {
        isPointerDown = true;
        const block = drawBlock(e, BLOCK_TYPE.WALL, map);
        const isBlockNull = block === null;

        if (isBlockNull) return;

        container.addChild(block);
    });

    app.stage.addEventListener("pointermove", (e) => {
        if (isPointerDown) {
            const block = drawBlock(e, BLOCK_TYPE.WALL, map);
            const isBlockNull = block === null;

            if (isBlockNull) return;

            container.addChild(block);
        }
    });

    app.stage.addEventListener("pointerup", () => {
        isPointerDown = false;
    });

    document.body.appendChild(app.view);
}

init();
