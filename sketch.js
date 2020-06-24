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

function draw(){
    clear();
    image(handImg1, width/2, height/2, 500, 700)
    let deltaTime = Date.now() - lastTimeStamp;
    lastTimeStamp = Date.now();
    if (detected) {
        detectedTime += deltaTime;
        rect(bboxX, bboxY, bboxW, bboxH);
        rect(bboxX + bboxW/2 - 2, bboxY + bboxH/2 - 2, 4, 4); 
    }
    else {
        detectedTime = 0;
    }
    noFill();
    console.log(detectedTime);
    if (detectedTime > 1500) {
        if (bboxX > 460 && bboxX < 810 && bboxY > 92 && bboxY < 610){
            textSize(32);
            fill(255)
            text('detecting...', 100, 100);
        }
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
}