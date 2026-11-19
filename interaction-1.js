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
        dspNode.setParamValue("/wind/volume", 0.8);
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

// Interaction 1 - "Swing the wind"
// Swinging the phone through the air makes wind: the faster you move it, the stronger
// and higher-pitched the gust. When you stop, the wind dies down slowly, like a real gust.
// On a desktop (no sensors) drag the mouse: the faster you drag, the stronger the wind.
let force = 0;          // smoothed wind force sent to the DSP (0..1)
let lastForce = null;

function accelerationChange(accx, accy, accz) {
    // p5 gives acceleration without gravity, so this is ~0 when the phone is still
    let energy = Math.sqrt(accx * accx + accy * accy + accz * accz);
    if (!Number.isFinite(energy)) energy = 0;
    if (mouseIsPressed) {
        energy = Math.max(energy, Math.hypot(movedX, movedY));
    }
    const target = constrain(map(energy, 2, 30, 0, 1), 0, 1);
    // gusts build quickly and fade slowly
    const rate = target > force ? 0.25 : 0.03;
    force += (target - force) * rate;
    if (force < 0.005) force = 0;
    playAudio(force);
}

function rotationChange(rotx, roty, rotz) {
}

function mousePressed() {
    // desktop debugging: dragging is handled in accelerationChange
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

function playAudio(force) {
    if (!dspNode) {
        return;
    }
    if (audioContext.state === 'suspended') {
        return;
    }
    const rounded = Math.round(force * 100) / 100;
    if (rounded === lastForce) {
        return;
    }
    dspNode.setParamValue("/wind/wind/force", rounded);
    lastForce = rounded;
}

//==========================================================================================
// END
//==========================================================================================