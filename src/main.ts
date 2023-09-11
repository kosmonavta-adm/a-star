import { Application, Graphics, Container } from "pixi.js";

import { BLOCK_SIZE } from "./constants";

function drawGrid() {
    const container = new Container();

    const horizontalLines = new Graphics();
    const verticalLines = new Graphics();

    const { innerWidth, innerHeight } = window;

    const horizontalLinesCount = innerWidth / BLOCK_SIZE;
    const verticalLinesCount = innerHeight / BLOCK_SIZE;

    let x = 0;
    let y = 0;

    for (let i = 0; i < horizontalLinesCount; i++) {
        horizontalLines.moveTo(x, 0);
        horizontalLines.lineStyle(1, "#ffffff", 0.1);
        horizontalLines.lineTo(x, innerHeight);
        horizontalLines.closePath();
        x += BLOCK_SIZE;
    }

    for (let i = 0; i < verticalLinesCount; i++) {
        verticalLines.moveTo(0, y);
        verticalLines.lineStyle(1, "#ffffff", 0.1);
        verticalLines.lineTo(innerWidth, y);
        verticalLines.closePath();
        y += BLOCK_SIZE;
    }

    container.addChild(horizontalLines, verticalLines);

    return container;
}

const app = new Application<HTMLCanvasElement>({
    background: "#1099bb",
    resizeTo: window,
});

const container = new Container();

app.stage.addChild(container);

const grid = drawGrid();
container.addChild(grid);

document.body.appendChild(app.view);
