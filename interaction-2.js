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

// windchimes.wasm: faust-dsp/Windchimes/windchimes.dsp, compiled with Faust 2.79.3 (faustwasm)
const dspName = "windchimes";
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
windchimes.createDSP(audioContext, 1024)
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

function accelerationChange(accx, accy, accz) {
    // playAudio()
}

// Interaction 2 - "Shake the wind chimes"
// Works like the other two: a shake triggers the sound. Every shake blows a gust of wind
// into the chimes. While you keep shaking the wind stays strong; after the last shake it
// calms down over a few seconds and the chimes slowly ring out.
// (The chimes only ring properly with wind close to the maximum of 2.)
const WIND_MAX = 2;
const HOLD_MS = 1500;     // full wind for this long after the last shake
const CALM_MS = 3000;     // then the wind dies down over this long
let lastShake = 0;
let windTimer = null;

function rotationChange(rotx, roty, rotz) {
}

function mousePressed() {
    // playAudio()
    // Use this for debugging from the desktop!
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
    playAudio();
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

function playAudio() {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    lastShake = Date.now();
    dspNode.setParamValue("/windchimes/wind_chimes/wind", WIND_MAX);
    if (windTimer) {
        return; // the wind is already blowing: the new shake keeps it going
    }
    windTimer = setInterval(() => {
        const since = Date.now() - lastShake;
        if (since < HOLD_MS) {
            return;
        }
        const calm = (since - HOLD_MS) / CALM_MS; // 0..1
        if (calm >= 1) {
            dspNode.setParamValue("/windchimes/wind_chimes/wind", 0);
            clearInterval(windTimer);
            windTimer = null;
            return;
        }
        dspNode.setParamValue("/windchimes/wind_chimes/wind", WIND_MAX * (1 - calm));
    }, 50);
}

//==========================================================================================
// END
//==========================================================================================