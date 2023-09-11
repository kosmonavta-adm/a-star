import { Application, Container } from "pixi.js";

const app = new Application<HTMLCanvasElement>({
    background: "#1099bb",
    resizeTo: window,
});

const container = new Container();

app.stage.addChild(container);

document.body.appendChild(app.view);
