import { Application, Graphics, Container, FederatedPointerEvent, BitmapFont, BitmapText } from "pixi.js";

import { BLOCK_SIZE, BLOCK_TYPE, BLOCK_TYPE_COLOR, MAP_SIZE } from "./constants";
import { convertToArrayIndex, convertToCoordinate } from "./utils";
import { ArrayCoordinates, BlockType, Coordinates, GameMap } from "./types";

let currentBlock: BlockType = BLOCK_TYPE.WALL;

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
    block.beginFill(BLOCK_TYPE_COLOR[blockType]);
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

    menuLayer.addChild(start);
    menuLayer.addChild(end);
    menuLayer.addChild(wall);

    return menuLayer;
}

function init() {
    const map = createMap();

    const app = new Application<HTMLCanvasElement>({
        background: "#1099bb",
        resizeTo: window,
    });

    const container = new Container();

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
        const block = drawBlock(e, currentBlock, map);
        const isBlockNull = block === null;

        if (isBlockNull) return;

        container.addChild(block);
    });

    container.addEventListener("pointermove", (e) => {
        if (isPointerDown) {
            const block = drawBlock(e, currentBlock, map);
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
