// configurable parameters
let detectedDebounceFrames = 2;

let beginMovementMs = 1500;
let beginGottemMs = 7000;

let beginMovementMessage = "arm:extend";
let revertMovementMessage = "arm:flex";
let gottemMovementMessage = "hand:rotate";

let state = 0;
let NEUTRAL = 0;
let EXTEND = 1;
let GOTTEM = 2;

let client = mqtt.connect('wss://b11edbdc:ba2b56875ff12d8c@broker.shiftr.io', {
  clientId: 'javascript'
});


//Hand Detection Parameters
const modelParams = {
    flipHorizontal: true,   // flip e.g for video 
    imageScaleFactor: 0.5,  // reduce input image size for gains in speed.
    maxNumBoxes: 20,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.79,    // confidence threshold for predictions.
}

//Grabs user camera regardless of browser
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetaUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

//Grab everything from HTML
const video = document.querySelector('#video');
const canvas = document.querySelector('#canvas');
const context = canvas.getContext('2d');
let model;

//BoundingBox Variables - assigned values in runDetection function
var bboxX
var bboxY
var bboxW
var bboxH

//Image
var handImg1


let lastMessageTime = Date.now();

//preload Image in p5.js
function preload(){
    handImg1 = loadImage('images/Hand.png')
}


function setup(){
    imageMode(CENTER)

    let p5c = createCanvas(video.width, video.height);
    p5c.position(0,0)

    //staret handtracking video
    handTrack.startVideo(video).then(status => {
        if(status){
            //if it works, get usermedia, and run detection at ~30FPS
            navigator.getUserMedia({video:{}}, stream => {
                //video.srcObject = stream;
                setInterval(runDetection, 32)
            }, 
            err => console.log(err));
        }
    });
    
    //Load Model for handTrack
    handTrack.load(modelParams).then(lmodel => {
        model = lmodel;
    });

    //hide input camera
    video.style.transform = 'scaleX(-1)';
}

var detected
let detectedTime = 0;
let lastTimeStamp = Date.now();

let detectedDebounceCounter = 0;

let debouncedDetected = false;

function draw(){
    clear();
    image(handImg1, width - 250, height - 350, 500, 700)
    let deltaTime = Date.now() - lastTimeStamp;
    lastTimeStamp = Date.now();
    if (debouncedDetected) {
        detectedTime += deltaTime;
        rect(bboxX, bboxY, bboxW, bboxH);
        rect(bboxX + bboxW/2 - 2, bboxY + bboxH/2 - 2, 4, 4);
    }
    else {
        detectedTime = 0;
    }
    noFill();

    if (detectedTime > 1500) {
        if (state == NEUTRAL) {
            console.log("sending extend");
            client.publish('/pork/test/test', beginMovementMessage);
            state = EXTEND;
        }
        if (bboxX > width - 500 && width && bboxY > 2 && bboxY < 610){
            textSize(32);
            fill(255)
            text('detecting...', 100, 100);
        }
    }
    else if (state != NEUTRAL) {
        console.log("sending flex");
        client.publish('/pork/test/test', revertMovementMessage);
        state = NEUTRAL;
    }
    if (detectedTime > 5000 && state != GOTTEM) {
        console.log("sending rotate");
        client.publish('/pork/test/test', gottemMovementMessage);
        state = GOTTEM;
    }
}

function runDetection(){
    model.detect(video).then(predictions => {
        // console.log(predictions)
        // model.renderPredictions(predictions, canvas, context, video)
        if(predictions.length > 0){
            //grab bounding box variables
            detected = true;
            for (var i = 0; i < predictions.length; i++){
                bboxX = predictions[i].bbox[0];
                bboxY = predictions[i].bbox[1];
                bboxW = predictions[i].bbox[2];
                bboxH = predictions[i].bbox[3];
            }
            console.log('Hand Found');
        }
        else{
            detected = false;
        }
    });
    if (!detected) {
        if (detectedDebounceCounter++ > detectedDebounceFrames) {
            debouncedDetected = false;
        }
    }
    else {
        debouncedDetected = true;
        detectedDebounceCounter = 0;
    }
}