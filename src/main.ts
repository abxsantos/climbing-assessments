import "./style.css"
import {setupFontAwesome} from "./icons"
import {setupChart, setupDevice} from "./devices"

const appElement = document.querySelector<HTMLDivElement>("#app")
if (appElement) {
    appElement.innerHTML = `
  <div class="card">
    <div id="timer">
        <h2>Timer 7:3</h2>
        <h1 id="state">Preparing</h1>
        <h1 id="countdown">00:00</h1>
        <p id="repetition">1/24</p>
        <button id="startStopButton">Start</button>
    </div>
    <canvas class="chart"></canvas>
  </div>
  <div id="masses"></div>
  <div id="error" style="display:none;"></div>
`
}

const massesElement = document.querySelector<HTMLDivElement>("#masses")
const errorElement = document.querySelector<HTMLDivElement>("#error")

if (massesElement && errorElement) {
    setupDevice(massesElement, errorElement)
}

const chartElement = document.querySelector<HTMLCanvasElement>(".chart")
if (chartElement) {
    setupChart(chartElement)
}

setupFontAwesome()

let countdownInterval: number | undefined;
let repetition = 1;

function playBeep(frequency: number, duration: number) {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(1, audioContext.currentTime);

    oscillator.start();
    setTimeout(() => {
        oscillator.stop();
    }, duration);
}

function startCountdown(duration: number, display: HTMLElement, callback?: () => void, state?: string) {
    let timer = duration, minutes, seconds;
    countdownInterval = setInterval(() => {
        minutes = Math.floor(timer / 60);
        seconds = timer % 60;

        display.textContent = `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

        if (timer <= 3 && timer > 0) {
            if (state === "Working") {
                playBeep(500, 500); // Lower frequency for working
            } else if (state === "Resting") {
                playBeep(1000, 500); // Higher frequency for resting
            }
        }

        if (--timer < 0) {
            clearInterval(countdownInterval);
            display.textContent = "00:00";
            if (callback) callback();
        }
    }, 1000);
}

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
}

function updateStateColor(stateElement: HTMLElement, state: string) {
    switch (state) {
        case "Preparing":
            stateElement.style.color = "blue";
            break;
        case "Working":
            stateElement.style.color = "green";
            break;
        case "Resting":
            stateElement.style.color = "red";
            break;
        default:
            stateElement.style.color = "black";
            break;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const countdownElement = document.querySelector<HTMLElement>("#countdown");
    const startStopButton = document.querySelector<HTMLButtonElement>("#startStopButton");
    const stateElement = document.querySelector<HTMLElement>("#state");
    const repetitionElement = document.querySelector<HTMLElement>("#repetition");
    let isCountingDown = false;

    if (countdownElement && startStopButton && stateElement && repetitionElement) {
        const oneMinute = 10; // 1 minute in seconds
        const sevenSeconds = 7; // 7 seconds
        const threeSeconds = 3; // 3 seconds

        startStopButton.addEventListener("click", () => {
            if (isCountingDown) {
                stopCountdown();
                startStopButton.textContent = "Start";
            } else {
                const startRepetition = () => {
                    if (repetition <= 24) {
                        stateElement.textContent = "Working";
                        updateStateColor(stateElement, "Working");
                        startCountdown(sevenSeconds, countdownElement, () => {
                            stateElement.textContent = "Resting";
                            updateStateColor(stateElement, "Resting");
                            startCountdown(threeSeconds, countdownElement, () => {
                                repetition++;
                                repetitionElement.textContent = `${repetition}/24`;
                                startRepetition();
                            }, "Resting");
                        }, "Working");
                    } else {
                        stateElement.textContent = "Finished";
                        updateStateColor(stateElement, "Finished");
                    }
                };

                stateElement.textContent = "Preparing";
                updateStateColor(stateElement, "Preparing");
                startCountdown(oneMinute, countdownElement, startRepetition);
                startStopButton.textContent = "Stop";
            }
            isCountingDown = !isCountingDown;
        });
    }
});
