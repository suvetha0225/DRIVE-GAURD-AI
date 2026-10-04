// ==========================================================
// DRIVEGUARD AI - FRONTEND
// ==========================================================

const API = "http://127.0.0.1:8000";


// ==========================================================
// VARIABLES
// ==========================================================

let startTime = Date.now();

let alertCount = 0;

let peakDrowsiness = 0;

let previousDrowsy = false;

let history = [];


// ==========================================================
// ELEMENTS
// ==========================================================

const backendStatus =
    document.getElementById("backendStatus");

const backendDot =
    document.getElementById("backendDot");

const aiStatus =
    document.getElementById("aiStatus");

const engineText =
    document.getElementById("engineText");

const cameraFeed =
    document.getElementById("cameraFeed");

const cameraError =
    document.getElementById("cameraError");

const driverState =
    document.getElementById("driverState");

const drowsiness =
    document.getElementById("drowsiness");

const progressBar =
    document.getElementById("progressBar");

const eyeStatus =
    document.getElementById("eyeStatus");

const yawnStatus =
    document.getElementById("yawnStatus");

const confidence =
    document.getElementById("confidence");

const faceDetected =
    document.getElementById("faceDetected");

const alertCountElement =
    document.getElementById("alertCount");

const peakDrowsinessElement =
    document.getElementById("peakDrowsiness");

const driveTime =
    document.getElementById("driveTime");

const trendValue =
    document.getElementById("trendValue");

const chart =
    document.getElementById("chart");

const events =
    document.getElementById("events");


// ==========================================================
// BACKEND CHECK
// ==========================================================

async function checkBackend() {

    try {

        const response =
            await fetch(
                `${API}/`,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error("Backend error");
        }

        const data =
            await response.json();

        setBackendOnline();

        return true;

    } catch (error) {

        console.log(
            "Backend connection failed:",
            error
        );

        setBackendOffline();

        return false;
    }
}


// ==========================================================
// ONLINE
// ==========================================================

function setBackendOnline() {

    backendStatus.textContent =
        "Backend Online";

    backendDot.classList.add(
        "online"
    );

    aiStatus.textContent =
        "ONLINE";

    aiStatus.classList.remove(
        "offline"
    );

    aiStatus.classList.add(
        "online"
    );

    engineText.textContent =
        "AI Engine Online";
}


// ==========================================================
// OFFLINE
// ==========================================================

function setBackendOffline() {

    backendStatus.textContent =
        "Backend Offline";

    backendDot.classList.remove(
        "online"
    );

    aiStatus.textContent =
        "OFFLINE";

    aiStatus.classList.remove(
        "online"
    );

    aiStatus.classList.add(
        "offline"
    );

    engineText.textContent =
        "AI Engine Offline";
}


// ==========================================================
// GET AI STATUS
// ==========================================================

async function updateDashboard() {

    try {

        const response =
            await fetch(
                `${API}/api/status?t=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Status endpoint failed"
            );
        }

        const data =
            await response.json();


        // Backend is working
        setBackendOnline();


        // --------------------------------------------------
        // CONFIDENCE
        // --------------------------------------------------

        const confidenceValue =
            Number(data.confidence) || 0;

        confidence.textContent =
            confidenceValue.toFixed(1) + "%";


        // --------------------------------------------------
        // PREDICTION
        // --------------------------------------------------

        const prediction =
            String(
                data.prediction || "Unknown"
            );


        // --------------------------------------------------
        // EYE STATUS
        // --------------------------------------------------

        eyeStatus.textContent =
            String(
                data.eye_status || "UNKNOWN"
            ).toUpperCase();


        // --------------------------------------------------
        // YAWN
        // --------------------------------------------------

        yawnStatus.textContent =
            String(
                data.yawn_status || "UNKNOWN"
            ).toUpperCase();


        // --------------------------------------------------
        // FACE
        // --------------------------------------------------

        if (data.face_detected) {

            faceDetected.textContent =
                "YES";

        } else {

            faceDetected.textContent =
                "NO";
        }


        // --------------------------------------------------
        // DROWSINESS
        // --------------------------------------------------

        let drowsinessValue = 0;


        if (data.drowsy === true) {

            drowsinessValue =
                Math.max(
                    confidenceValue,
                    50
                );

        } else {

            drowsinessValue =
                Math.min(
                    confidenceValue * 0.2,
                    30
                );
        }


        drowsinessValue =
            Math.round(
                drowsinessValue
            );


        drowsiness.textContent =
            drowsinessValue + "%";


        progressBar.style.width =
            drowsinessValue + "%";


        trendValue.textContent =
            drowsinessValue + "%";


        // --------------------------------------------------
        // DRIVER STATE
        // --------------------------------------------------

        if (data.drowsy === true) {

            driverState.textContent =
                "ALERT";

            driverState.classList.add(
                "alert"
            );

        } else {

            driverState.textContent =
                "NORMAL";

            driverState.classList.remove(
                "alert"
            );
        }


        // --------------------------------------------------
        // PEAK
        // --------------------------------------------------

        if (
            drowsinessValue >
            peakDrowsiness
        ) {

            peakDrowsiness =
                drowsinessValue;

            peakDrowsinessElement.textContent =
                peakDrowsiness + "%";
        }


        // --------------------------------------------------
        // ALERT COUNT
        // --------------------------------------------------

        if (
            data.drowsy === true &&
            previousDrowsy === false
        ) {

            alertCount++;

            alertCountElement.textContent =
                alertCount;

            addEvent(
                "Drowsiness detected"
            );
        }


        previousDrowsy =
            data.drowsy === true;


        // --------------------------------------------------
        // HISTORY
        // --------------------------------------------------

        history.push(
            drowsinessValue
        );

        if (history.length > 30) {

            history.shift();
        }

        drawChart();

    } catch (error) {

        console.log(
            "Status update error:",
            error
        );

        setBackendOffline();
    }
}


// ==========================================================
// CAMERA ERROR HANDLING
// ==========================================================

cameraFeed.onload = function () {

    cameraError.classList.add(
        "hidden"
    );
};


cameraFeed.onerror = function () {

    cameraError.classList.remove(
        "hidden"
    );

    console.log(
        "Camera stream could not be loaded."
    );
};


// ==========================================================
// EVENT LOG
// ==========================================================

function addEvent(message) {

    const item =
        document.createElement(
            "div"
        );

    item.className =
        "event";

    const time =
        new Date().toLocaleTimeString();

    item.innerHTML =
        `<strong>${time}</strong> — ${message}`;


    events.prepend(item);


    // Keep only last 8 events
    while (
        events.children.length > 8
    ) {

        events.removeChild(
            events.lastChild
        );
    }
}


// ==========================================================
// CHART
// ==========================================================

function drawChart() {

    chart.innerHTML = "";


    if (history.length === 0) {
        return;
    }


    history.forEach(value => {

        const bar =
            document.createElement(
                "div"
            );

        bar.className =
            "bar";

        bar.style.height =
            Math.max(
                value,
                4
            ) + "%";

        chart.appendChild(bar);

    });
}


// ==========================================================
// DRIVE TIME
// ==========================================================

function updateDriveTime() {

    const elapsed =
        Math.floor(
            (Date.now() - startTime) / 1000
        );


    const hours =
        Math.floor(
            elapsed / 3600
        );

    const minutes =
        Math.floor(
            (elapsed % 3600) / 60
        );

    const seconds =
        elapsed % 60;


    driveTime.textContent =
        String(hours).padStart(2, "0")
        + ":"
        + String(minutes).padStart(2, "0")
        + ":"
        + String(seconds).padStart(2, "0");
}


// ==========================================================
// START
// ==========================================================

async function startDashboard() {

    console.log(
        "DriveGuard dashboard starting..."
    );

    await checkBackend();

    await updateDashboard();

    setInterval(
        updateDashboard,
        1000
    );

    setInterval(
        updateDriveTime,
        1000
    );
}


startDashboard();