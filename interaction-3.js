//==========================================================================================
// AUDIO SETUP
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit just where you're asked to!
//------------------------------------------------------------------------------------------
//
//==========================================================================================
let dspNode = null;
let dspNodeParams = null;
let jsonParams = null;

// Change here to ("tuono") depending on your wasm file name
const dspName = "brass";
const instance = new FaustWasm2ScriptProcessor(dspName);

// output to window or npm package module
if (typeof module === "undefined") {
    window[dspName] = instance;
} else {
    const exp = {};
    exp[dspName] = instance;
    module.exports = exp;
}

// The name should be the same as the WASM file, so change tuono with brass if you use brass.wasm
brass.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // const exampleMinMaxParam = findByAddress(dspNodeParams, "/thunder/rumble");
        // // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
        // const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
        // console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    });


//==========================================================================================
// INTERACTIONS
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit the next functions to create interactions
// Decide which parameters you're using and then use playAudio to play the Audio
//------------------------------------------------------------------------------------------
//
//==========================================================================================

// Interaction 3 - "Tilt to blow"
// The phone is the horn. Lying flat it is silent; tilt the top edge up towards you and
// you blow harder (more pressure = louder, brassier). Tilt left/right to bend the lips
// and change the note. Shaking adds vibrato that fades out again.
// On a desktop (no sensors) hold the mouse button: height = pressure, left/right = note.
let gotSensors = false;
window.addEventListener("deviceorientation", (e) => {
    if (e.beta !== null) gotSensors = true;
});

let pressure = 0;       // smoothed values actually sent to the DSP
let tension = 0.5;
let vibrato = 0;

function accelerationChange(accx, accy, accz) {
}

function rotationChange(rotx, roty, rotz) {
    let targetPressure, targetTension;
    if (gotSensors) {
        // rotx: 0 = flat on the table, ~90 = upright facing you
        targetPressure = constrain(map(rotx, 10, 70, 0, 1), 0, 1);
        targetTension = constrain(map(roty, -45, 45, 0.3, 0.7), 0.3, 0.7);
    } else if (mouseIsPressed) {
        targetPressure = constrain(map(mouseY, height, 0, 0.2, 1), 0, 1);
        targetTension = constrain(map(mouseX, 0, width, 0.3, 0.7), 0.3, 0.7);
    } else {
        targetPressure = 0;
        targetTension = tension;
    }
    // smooth so the sound doesn't jump with sensor noise
    pressure += (targetPressure - pressure) * 0.15;
    tension += (targetTension - tension) * 0.15;
    vibrato *= 0.97;   // shake vibrato decays
    if (pressure < 0.01) pressure = 0;
    playAudio(pressure, tension, vibrato);
}

function mousePressed() {
    // handled continuously in rotationChange while the mouse is held
}

function deviceMoved() {
    movetimer = millis();
    statusLabels[2].style("color", "pink");
}

function deviceTurned() {
    threshVals[1] = turnAxis;
}
function deviceShaken() {
    shaketimer = millis();
    statusLabels[0].style("color", "pink");
    vibrato = 0.8;
}

function getMinMaxParam(address) {
    const exampleMinMaxParam = findByAddress(dspNodeParams, address);
    // ALWAYS PAY ATTENTION TO MIN AND MAX, ELSE YOU MAY GET REALLY HIGH VOLUMES FROM YOUR SPEAKERS
    const [exampleMinValue, exampleMaxValue] = getParamMinMax(exampleMinMaxParam);
    console.log('Min value:', exampleMinValue, 'Max value:', exampleMaxValue);
    return [exampleMinValue, exampleMaxValue]
}

//==========================================================================================
// AUDIO INTERACTION
//------------------------------------------------------------------------------------------
//
//------------------------------------------------------------------------------------------
// Edit here to define your audio controls 
//------------------------------------------------------------------------------------------
//
//==========================================================================================

let lastSent = { pressure: null, tension: null, vibrato: null };

function playAudio(pressure, tension, vibrato) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    // only send values that actually changed, and never NaN (it would silence the model)
    const send = (key, address, value) => {
        if (!Number.isFinite(value)) return;
        const rounded = Math.round(value * 1000) / 1000;
        if (rounded === lastSent[key]) return;
        dspNode.setParamValue(address, rounded);
        lastSent[key] = rounded;
    };
    send("pressure", "/brass/blower/pressure", pressure);
    send("tension", "/brass/brassModel/lipsTension", tension);
    send("vibrato", "/brass/blower/vibratoGain", vibrato);
}

//==========================================================================================
// END
//==========================================================================================