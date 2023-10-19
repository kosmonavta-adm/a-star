import { BLOCK_SIZE } from "./constants";
import { NodeElement } from "./node";
import { Coordinates } from "./types";

export function convertToArrayIndex(coordinate: number) {
    return Math.floor(coordinate / BLOCK_SIZE);
}

export function convertToCoordinate(arrayIndex: number) {
    return arrayIndex * BLOCK_SIZE;
}

export function calculateManhattanDistance(start: NodeElement, end: NodeElement) {
    return Math.abs(start.position.x - end.position.x) + Math.abs(start.position.y - end.position.y);
}

export function getDistance(position: Coordinates, currentPosition: Coordinates) {
    return Math.sqrt(Math.pow(currentPosition.y - position.y, 2) + Math.pow(currentPosition.x - position.x, 2));
}

export function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function createNotification(message: string) {
    const isNotificationAlreadyAdded = Boolean(document.querySelector(".notification"));
    if (isNotificationAlreadyAdded) return;

    const timeToFade = 3000;

    const root = document.querySelector(".notification-root");
    if (root === null) throw new Error("Notification root isn't present");

    const notification = document.createElement("div");
    notification.classList.add("notification");
    notification.innerText = message;
    notification.addEventListener("animationend", (e) => {
        const { animationName } = e;
        if (animationName !== "hide") return;
        notification.remove();
    });

    const progressBar = document.createElement("div");
    progressBar.classList.add("notification__progressBar");

    notification.append(progressBar);
    root.append(notification);

    setTimeout(() => {
        notification.classList.add("notification--hidden");
    }, timeToFade);
}

export function checkIsSamePosition(prevPosition: Coordinates, currentPosition: Coordinates) {
    if (prevPosition?.x === currentPosition.x && prevPosition?.y === currentPosition.y) return true;

    return false;
}
