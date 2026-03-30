let model, webcam;

const URL = "model/";

async function startDetection() {
    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);

        webcam = new tmImage.Webcam(300, 300, true);

        await webcam.setup({ facingMode: "user" });
        await webcam.play();

        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("webcam-container").appendChild(webcam.canvas);

        window.requestAnimationFrame(loop);

    } catch (error) {
        alert("Error: " + error);
        console.log(error);
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}


let lastPrediction = "";
let stableCount = 0;
let lastSpoken = "";
let lastTimeSpoken = 0;

async function predict() {
    const prediction = await model.predict(webcam.canvas);

    // Find highest prediction
    let highest = prediction[0];
    for (let i = 0; i < prediction.length; i++) {
        if (prediction[i].probability > highest.probability) {
            highest = prediction[i];
        }
    }

    let confidence = highest.probability;
    let label = document.getElementById("label-container");

    if (confidence > 0.85) {

        if (highest.className === lastPrediction) {
            stableCount++;
        } else {
            stableCount = 0;
            lastPrediction = highest.className;
        }

        if (stableCount > 10) {
            // ✅ FINAL STABLE OUTPUT
            label.innerHTML = `Recognized: ${highest.className} `;

            let currentTime = new Date().getTime();

            if (
                highest.className !== lastSpoken &&
                currentTime - lastTimeSpoken > 2000
            ) {
                speak(highest.className);
                lastSpoken = highest.className;
                lastTimeSpoken = currentTime;
            }

        } else {
            // ⏳ STILL DETECTING
            label.innerHTML = "Detecting...";
        }

    } else {
        label.innerHTML = "Detecting...";
    }
}
function speak(text) {
    const speech = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(speech);
}
function stopCamera() {
    if (webcam) {
        webcam.stop();
        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("label-container").innerHTML = "Detection stopped";
    }
}