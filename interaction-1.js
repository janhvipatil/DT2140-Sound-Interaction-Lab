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

// wind.wasm was compiled from faust-dsp/Nature/wind.dsp
const dspName = "wind";
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
wind.createDSP(audioContext, 1024)
    .then(node => {
        dspNode = node;
        dspNode.connect(audioContext.destination);
        console.log('params: ', dspNode.getParams());
        const jsonString = dspNode.getJSON();
        jsonParams = JSON.parse(jsonString)["ui"][0]["items"];
        dspNodeParams = jsonParams
        // start silent: the wind only blows when you move the phone
        dspNode.setParamValue("/wind/wind/force", 0);
        dspNode.setParamValue("/wind/volume", 1);
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

// Interaction 1 - "Shake up a gust"
// Works like Interaction 2: every shake triggers the sound. Each shake blows a strong gust
// of wind that then dies away over ~2.5 seconds; keep shaking and the wind keeps blowing.
//
// In wind.dsp the force sets both loudness and pitch. Below ~0.6 it is a sub-bass rumble
// phone speakers can't play, and near 1 it self-oscillates and gets very loud, so the gust
// moves between GUST_PEAK and GUST_FLOOR and then fades to silence.
const GUST_PEAK = 0.9;
const GUST_FLOOR = 0.6;
const GUST_MS = 2500;
let gustStart = 0;
let gustTimer = null;

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
    // (re)start the gust at full strength, then let it die away
    gustStart = Date.now();
    dspNode.setParamValue("/wind/wind/force", GUST_PEAK);
    if (gustTimer) {
        return; // already fading: the restart above keeps it going
    }
    gustTimer = setInterval(() => {
        const t = (Date.now() - gustStart) / GUST_MS; // 0..1 over the gust
        if (t >= 1) {
            dspNode.setParamValue("/wind/wind/force", 0);
            clearInterval(gustTimer);
            gustTimer = null;
            return;
        }
        let force = GUST_PEAK - (GUST_PEAK - GUST_FLOOR) * t;
        if (t > 0.85) force *= (1 - t) / 0.15; // last bit fades to silence
        dspNode.setParamValue("/wind/wind/force", force);
    }, 50);
}

//==========================================================================================
// END
//==========================================================================================