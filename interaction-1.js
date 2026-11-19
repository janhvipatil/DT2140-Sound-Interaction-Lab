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

// fire.wasm: faust-dsp/Nature/fire.dsp, compiled with Faust 2.79.3 (faustwasm)
const dspName = "fire";
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
fire.createDSP(audioContext, 1024)
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

// Interaction 1 - "Shake to light the fire"
// Works like Interaction 2: a shake triggers the sound. Shaking lights the fire (or stokes
// it if it is already burning). It burns for a few seconds after the last shake and then
// dies down. Turn the phone face down and the wood becomes wet: louder, spitting crackles.
const BURN_MS = 3000;     // how long the fire burns after the last shake
const FADE_MS = 1500;     // how long it takes to die down
const FIRE_VOLUME = 0.7;
let burnTimer = null;
let fadeTimer = null;
let lastWet = null;

function rotationChange(rotx, roty, rotz) {
    if (!dspNode) {
        return;
    }
    // rotx is around 0 lying face up, around +-180 face down
    const wet = Math.abs(rotx) > 120 ? 1 : 0;
    if (wet !== lastWet) {
        dspNode.setParamValue("/fire/wet", wet);
        lastWet = wet;
    }
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
    // light / stoke the fire
    clearInterval(fadeTimer);
    clearTimeout(burnTimer);
    dspNode.setParamValue("/fire/volume", FIRE_VOLUME);
    dspNode.setParamValue("/fire/gate", 1);
    // after the last shake, let it burn a while and then die down
    burnTimer = setTimeout(() => {
        let volume = FIRE_VOLUME;
        const step = FIRE_VOLUME / (FADE_MS / 50);
        fadeTimer = setInterval(() => {
            volume -= step;
            if (volume <= 0) {
                clearInterval(fadeTimer);
                dspNode.setParamValue("/fire/gate", 0);
                return;
            }
            dspNode.setParamValue("/fire/volume", volume);
        }, 50);
    }, BURN_MS);
}

//==========================================================================================
// END
//==========================================================================================