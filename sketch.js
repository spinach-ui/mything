
let Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;

let engine;
let world;
let balls = [];
let cushions = [];

// Flag to check if the game has started
let modeSelected = false; // Flag to check if a mode has been selected
let cueBallPlaced = false; // Flag to check if the cue ball has been placed
let cueBallPocketed = false; // Cueball pocketed
// Global variable for the cue ball
let cueBall; 
// Variables to track the drag start and end points
let dragStart = null;
let dragging = false;

// Define constants for the table and balls
const pixelsPerFoot = 800 / 12; // Since the tableWidth is 800 pixels and the table length is 12 feet
const tableWidth = 12 * pixelsPerFoot; // This would now be the total canvas width
const tableHeight = tableWidth / 2; // This would now be the total canvas height, as the table is 6 feet in width
const borderWidth = pixelsPerFoot / 5; // Assuming a 6-inch border for the table
const ballDiameter = tableHeight / 36; // Diameter of a snooker ball
const pocketDiameter = ballDiameter * 2.7; // Diameter of the pockets
// Define the pocket cover size and corner radius
const pocketCoverSize = pocketDiameter/1.5; // The size can be the same as the pocket diameter
const xMiddlePocket = tableWidth / 2 - pocketCoverSize / 2;

const cushionDepth = 8; // How far the cushion extends onto the table
const halfTable = tableHeight/2;
// Baulk line, 1/5th from the left side of the table
const baulkLineX = tableWidth / 5;
// The D-line, a semi-circle on the baulk line
const dLineDiameter = tableHeight / 3; // The diameter is one third of the table height
const dLineRadius = dLineDiameter / 2; // Radius is half the diameter
const dLineCenterX = tableWidth / 5; // The center of the D is 1/5th into the table's width
const dLineCenterY = tableHeight / 2; // The center of the D is at half the table's height


// Define a maximum power level for the shot
const MAX_LINE_LENGTH = tableWidth / 5; // The maximum length of the aiming line
const MAX_POWER = 10; // Adjust this value as needed for the maximum power
// Constants for maximum force
const MAX_FORCE_VALUE = 0.2; // Adjust as necessary to prevent tunneling

// Pocket positions
const pockets = [
    { x: borderWidth, y: borderWidth }, // Top-left pocket
    { x: tableWidth - borderWidth, y: borderWidth }, // Top-right pocket
    { x: borderWidth, y: tableHeight - borderWidth }, // Bottom-left pocket
    { x: tableWidth - borderWidth, y: tableHeight - borderWidth }, // Bottom-right pocket
    { x: tableWidth / 2, y: borderWidth }, // Top-middle pocket
    { x: tableWidth / 2, y: tableHeight - borderWidth }, // Bottom-middle pocket
  ];

// Calculate positions based on table proportions for coloured balls
dLineY = tableHeight/3

// Default positions for the colored balls
const coloredBallPositions = {
    yellow: { x: tableWidth / 5, y: dLineY*2 },
    green: { x: tableWidth / 5, y: dLineY },
    brown: { x: tableWidth / 5, y: halfTable },
    blue: { x: tableWidth / 2, y: halfTable },
    pink: { x: (((tableWidth / 5) * 4)-(ballDiameter * 4) - 2) - ballDiameter -1, y: halfTable },
    black: { x: tableWidth - (tableWidth / 11), y: halfTable }
  };

// Keep track of colorballs pocketed variable
let consecutiveColoredBallsPotted = 0;
let displayFaultMessage = false;

let extremeModeFlag = false;

let ballLostMessage = false;
let faultMessageStart = 0;
let faultMessageDuration = 2000; // Duration to display the message in milliseconds

let nextHoleTime = 0;
let holeInterval = 5000; // New hole every 5 seconds

// Global variable to track if Extreme Mode instructions should be displayed
let showExtremeModeInstructions = false;

let collisionMessage = "";
let collisionMessageTime = 0;
const collisionMessageDuration = 2000; // 2 seconds to display message

function setup() {

    // Set the size of the canvas according to the table size
    createCanvas(tableWidth, tableHeight).mouseClicked(handleMouseClick);
    // Initiate Matter.js engine
    engine = Engine.create();
    world = engine.world;
    // Snooker tables don't have gravity affecting them horizontally
    world.gravity.y = 0;
    setupSnookerEnvironment();
    // Create the constrains of the cushions
    createCushionConstraints();


    // Set up collision event handling
    Matter.Events.on(engine, 'collisionStart', function(event) {

        let pairs = event.pairs;
        // Check the pair of balls that collided
        for (let i = 0, j = pairs.length; i < j; ++i) {
            let pair = pairs[i];
            
            let cueBallInvolved = pair.bodyA.label === 'cueBall' || pair.bodyB.label === 'cueBall';
            let otherBody = pair.bodyA.label === 'cueBall' ? pair.bodyB : pair.bodyA;
            // Only print if cueball was involved in the collision
            if (cueBallInvolved) {
                if (otherBody.label === 'redBall') {
                    collisionMessage = 'cueball-red';
                } else if (otherBody.label === 'colorBall') {
                    collisionMessage = 'cueball-color';
                } else if (otherBody.label === 'cushion') {
                    collisionMessage = 'cueball-cushion';
                }
                // Store the time of the collision message
                collisionMessageTime = millis();
            }
        }
    });
}

function setupSnookerEnvironment() {
    // Define the snooker table with correct proportions
    table = {
        x: width / 2,
        y: height / 2,
        color: [78,136,52,255] // Dark green color for the table
    };
}

function drawTable() {
    // Draw the brown borders
    const cornerRadius = 10;

    noStroke()
    fill(64,36,13,255); // Brown color for the borders
    rect(0, 0, tableWidth, tableHeight, cornerRadius); // The entire canvas is the border initially

    // Draw the green baize, inset by the border width
    fill(table.color);
    rect(borderWidth, borderWidth, tableWidth - borderWidth * 2, tableHeight - borderWidth * 2, cornerRadius);

    // Set the fill color to yellow for the pocket covers
    fill(243,213,70,255);

    // Draw the corner pocket covers with rounded top left corner
    rect(0, 0, pocketCoverSize, pocketCoverSize, cornerRadius, 0, cornerRadius, 0); // Top-left
    rect(tableWidth - pocketCoverSize, 0, pocketCoverSize, pocketCoverSize, 0, cornerRadius, 0, cornerRadius); // Top-right
    rect(0, tableHeight - pocketCoverSize, pocketCoverSize, pocketCoverSize, 0, cornerRadius, 0, cornerRadius); // Bottom-left
    rect(tableWidth - pocketCoverSize, tableHeight - pocketCoverSize, pocketCoverSize, pocketCoverSize, cornerRadius, 0, cornerRadius, 0); // Bottom-right

    // Draw the side pocket covers without rounded corners
    rect(tableWidth / 2 - pocketCoverSize / 2, 0, pocketCoverSize, borderWidth); // Top-middle
    rect(tableWidth / 2 - pocketCoverSize / 2, tableHeight - borderWidth, pocketCoverSize, borderWidth); // Bottom-middle
    
    // Set the fill color to white for the lines
    stroke(255);
    strokeWeight(1); 

    // Baulk line, 1/5th from the left side of the table
    line(baulkLineX, borderWidth+cushionDepth, baulkLineX, (tableHeight-borderWidth-cushionDepth));

    noFill(); // The D-line is not filled
    stroke(255);

    // Drawing the left part of the D-line circle
    arc(dLineCenterX, dLineCenterY, dLineDiameter, dLineDiameter, HALF_PI,-HALF_PI);

    // Reset drawing settings
    noStroke();
    // Draw Cushions
    drawCushions();

    // Black for the pockets
    fill(0);

    // Correct size for the pockets
    const ballRadius = ballDiameter / 2;
    const pocketRadius = 1.5 * ballRadius; // 1.5 times the ball's radius

    // Draw the corner pocket holes aligned with the bottom right of the yellow covers
    ellipse(borderWidth, borderWidth, pocketRadius * 2); // Top-left
    ellipse(tableWidth - borderWidth, borderWidth, pocketRadius * 2); // Top-right
    ellipse(borderWidth, tableHeight - borderWidth, pocketRadius * 2); // Bottom-left
    ellipse(tableWidth - borderWidth, tableHeight - borderWidth, pocketRadius * 2); // Bottom-right
    // Draw the side pocket holes aligned with the bottom of the yellow covers
    ellipse(tableWidth / 2, borderWidth, pocketRadius * 2); // Top-middle
    ellipse(tableWidth / 2, tableHeight - borderWidth, pocketRadius * 2); // Bottom-middle
}

function draw() {
    // Canvas transparent
    clear(); 
    Engine.update(engine);
    // Draw the table
    drawTable();
    // If user selected Extreme Mode display instructions
    if (showExtremeModeInstructions) {
        displayExtremeModeInstructions();
    } else {
        // Add random holes for Extreme Mode
        if (extremeModeFlag) {
            if (millis() > nextHoleTime) {
                addRandomHole();
                nextHoleTime = millis() + holeInterval;
            }
            drawHoles();        
            checkForBallsInHoles();
        }
        // If mode hasnt been select yet (menu mode)
        if (!modeSelected) {
            displayModeSelectionMessage();
        } else {
            // If the cueball was placed, display balls
            if (cueBallPlaced) {
                displayBalls();
                handleCueBallInteractions();
            }
            // If cueball was pocketed and it's not been re-placed
            if (cueBallPocketed && !cueBallPlaced) {
                displayBalls();
                displayRePlaceCueBallMessage();
            } else if (!cueBallPlaced && !showExtremeModeInstructions) {
                // Display the cue ball placement message only if the Extreme Mode instructions are not showing
                displayCueBallPlacementMessage();
                displayBalls();
            }
        }
        // When in Extreme Mode if user loses a ball display message
        if (ballLostMessage) {
            if (millis() - faultMessageStart < faultMessageDuration) {
                displayLostBallMessage();
            } else {
                ballLostMessage = false;
            }
        }

        checkForPocketedBalls();
        displayTwoColorBallsPocketedMessage();
        displayCollisionMessage();
    }
}

// Function to display all the balls
function displayBalls() {
    for (let i = 0; i < balls.length; i++) {
        balls[i].show();
    }
}

// Function to handle interactions with the cue ball
function handleCueBallInteractions() {
    if (cueBall) {
        cueBall.show();
        handleAimingAndHitting();
    }
}
// Function for aiming and hitting the cue ball
function handleAimingAndHitting() {
    // Draw cue stick when user presses on the cueball
    if (dragging && dragStart && cueBall) {
        drawCueStick();
        displayPowerLevel();
    }
}

// Function to display the power level
function displayPowerLevel() {
    let dragDistance = dist(dragStart.x, dragStart.y, mouseX, mouseY);
    // Cap the power at MAX_POWER
    let power = map(dragDistance, 0, MAX_LINE_LENGTH, 0, MAX_POWER);
    power = constrain(power, 0, MAX_POWER); // Constrain the power between 0 and MAX_POWER

    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    text("Power: " + power.toFixed(0), width / 2, 30); // Display power level, capped at MAX_POWER
}

// Function to draw the cue stick
function drawCueStick() {
    // Get the position of the cue ball
    let cueBallPos = cueBall.body.position;

    // Determine the angle from the cue ball to the mouse cursor
    let angle = atan2(mouseY - cueBallPos.y, mouseX - cueBallPos.x);

    // Set a fixed length for the cue stick
    let cueLength = 100;
    let cueWidth = 5; 
    // Distance from the cue ball center to the start of the cue stick
    let offset = 65;
    let startX = cueBallPos.x + (offset * cos(angle));
    let startY = cueBallPos.y + (offset * sin(angle));

    push();
    // Translate to the start position of the cue stick
    translate(startX, startY);
    // Rotate the canvas to align with the angle
    rotate(angle);
    // Set the drawing properties for the cue stick
    fill(205, 127, 50);
    noStroke();
    // Draw the cue stick as a rectangle
    rectMode(CENTER);
    rect(0, 0, cueLength, cueWidth);
    fill(128, 0, 32);
    rect(-50, 0, 5, cueWidth);
    fill(225, 193, 110);
    rect(45, 0, 20, cueWidth);
    pop();

}

function handleMouseClick() {
    // Check if the game has not started and the click is within the D semi-circle. If so, place cueball
    if (modeSelected && !cueBallPlaced && isClickWithinD(mouseX, mouseY)) {
        placeCueBall(mouseX, mouseY);
        cueBallPlaced = true;
    }
}

function isClickWithinD(x, y) {
    // Check if within the bounding box of the D
    if (mouseX > dLineCenterX - dLineRadius && mouseX < dLineCenterX &&
        mouseY > dLineCenterY - dLineRadius && mouseY < dLineCenterY + dLineRadius) {
        // Now check if within the semicircle of the D
        let distToCenter = dist(mouseX, mouseY, dLineCenterX, dLineCenterY);
        if (distToCenter < dLineRadius) {
            // The click is within the D
            return true;
        }
    }
    return false;
}

function placeCueBall(x, y) {
    // Create an instance of Ball class with cueball properties
    cueBall = new Ball(x, y, ballDiameter / 2, 'white', 'cueBall');
}

// This function will be responsible for initiating the drag
function startDragging() {
    let cueBallPos = cueBall.body.position;
    // Check if the mouse is over the cue ball
    if (dist(mouseX, mouseY, cueBallPos.x, cueBallPos.y) < cueBall.radius) {
        dragStart = createVector(mouseX, mouseY);
        dragging = true;
    }
}

// This function calculates the force based on the drag distance and applies it to the cue ball
function applyForceToCueBall() {
    let dragEnd = createVector(mouseX, mouseY);
    let forceDirection = p5.Vector.sub(dragStart, dragEnd);
    forceDirection.normalize(); // Normalize to get direction only
    
    let dragDistance = dist(dragStart.x, dragStart.y, mouseX, mouseY);
    let power = min(map(dragDistance, 0, width, 0, MAX_POWER), MAX_POWER);
    let forceMagnitude = power * 0.1;
    
    // Limit the force to prevent balls from leaving the canvas
    forceDirection.mult(min(forceMagnitude, MAX_FORCE_VALUE));
    
    Matter.Body.setStatic(cueBall.body, false); // Make the cue ball dynamic
    Matter.Body.applyForce(cueBall.body, cueBall.body.position, forceDirection);
}

// Detects when the mouse is pressed
function mousePressed() {
    // Start dragging only if the cue ball is placed and not already dragging
    if (modeSelected && cueBallPlaced && !dragging && cueBall) {
        startDragging();
    }
}

function mouseReleased() {
    // Apply the force to the cue ball only if dragging has occurred
    if (modeSelected && cueBallPlaced && dragging && cueBall) {
        applyForceToCueBall();

        // Reset drag variables
        dragStart = null;
        dragging = false;
    }
}

function keyPressed() {
    // Main menu mode selection logic
    if (!modeSelected && (key === '1' || key === '2' || key === '3' || key === '4')) {
        if (key === '4') {
            showExtremeModeInstructions = true;
        } else {
            modeSelected = true;
            if (key === '1') {
                modeA();
            } else if (key === '2') {
                modeC();
            } else if (key === '3') {
                modeB();
            }
        }
    }
    // If user selected Extreme Mode, show instructions before initiating the game
    if (showExtremeModeInstructions && key === 'Enter') {
        showExtremeModeInstructions = false;
        modeSelected = true;
        extremeMode();
    }
}




function checkForPocketedBalls() {
    // Check if the cue ball is pocketed
    if (cueBall && isCueBallPocketed()) {
        handleCueBallPocketed();
    }

    // Check other balls
    for (let i = balls.length - 1; i >= 0; i--) {
        let ball = balls[i];
        let ballPos = ball.body.position;

        for (let pocket of pockets) {
            if (isBallPocketed(ballPos, pocket)) {
                console.log(`Pocketed ball color: ${ball.color}`);
                if (ball.color !== 'red') {
                    // Respawn colored ball
                    moveBallToPosition(ball, coloredBallPositions[ball.color]);
                    consecutiveColoredBallsPotted++;
                    if (consecutiveColoredBallsPotted === 2) {
                        // If two consecutive colored balls are potted, set the flag to display the fault message
                        displayFaultMessage = true;
                    }
                    continue;
                } else {
                    // Remove the ball from the world and the balls array (for red balls)
                    Matter.World.remove(world, ball.body);
                    balls.splice(i, 1);
                    consecutiveColoredBallsPotted = 0;
                    break; // No need to check other pockets since the ball is removed
                }
            }
        }
    }
}

function moveBallToPosition(ball, position) {

    // Set the position of the ball's Matter.js body
    Matter.Body.setPosition(ball.body, position);
    // Set the velocity of the ball to zero to stop it from moving
    Matter.Body.setVelocity(ball.body, { x: 0, y: 0 });

    // Set the angular velocity of the ball to zero to stop any rotation
    Matter.Body.setAngularVelocity(ball.body, 0);
}
// Check if cueball was pocketed
function isCueBallPocketed() {
    for (let pocket of pockets) {
        if (isBallPocketed(cueBall.body.position, pocket)) {
            return true;
        }
    }
    return false;
}

function handleCueBallPocketed() {
    console.log('Cue ball pocketed!');
    // Remove the cue ball from the world
    Matter.World.remove(world, cueBall.body);
    cueBall = null;
    // Reset the cueBallPlaced flag to false so user can re position the cueball
    cueBallPlaced = false;
    cueBallPocketed = true;
}

function isBallPocketed(ballPos, pocketPos) {
    // Check if the ball overlaps with a hole, and return true if it is
    let distance = dist(ballPos.x, ballPos.y, pocketPos.x, pocketPos.y);
    return distance < (pocketDiameter * 0.6) / 2; 
}

// Function to reset the game state after a fault
function resetAfterFault() {
    consecutiveColoredBallsPotted = 0;
    displayFaultMessage = false;
}
class Ball {
    constructor(x, y, radius, color, label) {
      // Define the properties of the Ball
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.color = color;
  
      // Create the ball as a Matter.js body
      this.body = Bodies.circle(x, y, radius, {
        restitution: 0.9, // High restitution makes the ball bouncy
        friction: 0.005, // Low friction to slide easily
        density: 0.05, // Density can affect the mass of the ball
        label: label || 'ball', // Label helps with collision filtering
      });
  
      // Add the ball to the world
      World.add(world, this.body);
    }
  
    show() {

      const pos = this.body.position;
      const angle = this.body.angle;

      push();
      translate(pos.x, pos.y); // Translate to the position of the ball
      rotate(angle); // Rotate to the angle of the ball

      // Drawing the ball
      stroke(0); // Black stroke for the contour line
      strokeWeight(1);
      fill(this.color);
      ellipse(0, 0, this.radius * 2); // Draw the ball

      // Adding light reflection
      let reflectionSize = this.radius / 4;
      fill(255, 255, 255, 128); // Semi-transparent white
      noStroke(); // No stroke for the reflection
      ellipse(this.radius / 2, -this.radius / 2, reflectionSize, reflectionSize);

      pop();
    }
  }
  function drawCushions(){
    // Draw Cushions
    const cushionColor = color(51,97,24,255); // Darker green for the cushion

    fill(cushionColor);
    noStroke();

    const xMiddlePocket = tableWidth / 2 - pocketCoverSize / 2;

    // Cushion top left
    quad(pocketCoverSize, borderWidth, // x1, y1
        xMiddlePocket, borderWidth, // x2, y2
        xMiddlePocket - cushionDepth, borderWidth + cushionDepth, // x3, y3
        pocketCoverSize + cushionDepth+8, borderWidth + cushionDepth); // x4, y4
    
    // Cushion top right
    quad(xMiddlePocket+pocketCoverSize, borderWidth, // x1, y1
        tableWidth-pocketCoverSize, borderWidth,// x2, y2
        (tableWidth-pocketCoverSize) - cushionDepth-8, borderWidth + cushionDepth, // x3, y3
        xMiddlePocket+pocketCoverSize + cushionDepth, borderWidth + cushionDepth); // x4, y4

    // Cushion bottom left
    quad(pocketCoverSize, tableHeight - borderWidth, // x1, y1
        xMiddlePocket, tableHeight - borderWidth, // x2, y2
        xMiddlePocket - cushionDepth, tableHeight - (borderWidth + cushionDepth), // x3, y3
        pocketCoverSize + cushionDepth+8, tableHeight - (borderWidth + cushionDepth)); // x4, y4

    // Cushion bottom right
    quad(xMiddlePocket + pocketCoverSize, tableHeight - borderWidth,
        tableWidth - pocketCoverSize, tableHeight - borderWidth,
        tableWidth - (pocketCoverSize + cushionDepth+8), tableHeight - (borderWidth + cushionDepth),
        xMiddlePocket + pocketCoverSize + cushionDepth, tableHeight - (borderWidth + cushionDepth));

    // Cushion left
    quad(borderWidth, pocketCoverSize,
        borderWidth, tableHeight - pocketCoverSize,
        borderWidth + cushionDepth, (tableHeight - pocketCoverSize) - cushionDepth-8,
        borderWidth + cushionDepth, pocketCoverSize + cushionDepth+8);

    // Cushion right
    quad(tableWidth - borderWidth, pocketCoverSize,
        tableWidth - borderWidth, tableHeight - pocketCoverSize,
        tableWidth - (borderWidth + cushionDepth), (tableHeight - pocketCoverSize) - cushionDepth-8,
        tableWidth - (borderWidth + cushionDepth), pocketCoverSize + cushionDepth+8);

}

function createCushionConstraints() {
    // Define properties for the cushions
    const cushionOptions = {
        isStatic: true,
        restitution: 0.5, // This will make the cushions bouncy
        friction: 0.1,  
        label: 'cushion'  

    };

    // Top left cushion vertices based on your quad coordinates
    let topLeftCushionVertices = [
        { x: 0, y: 0 },
        { x: tableWidth/2, y: 0 },
        { x: xMiddlePocket - cushionDepth, y: borderWidth + cushionDepth },
        { x: pocketCoverSize + cushionDepth+8, y: borderWidth + cushionDepth }
    ];

    // Create a Matter.js body for the top left cushion
    let topLeftCushionBody = Bodies.fromVertices(
        (pocketCoverSize/2 + tableWidth/2) / 2,
        (borderWidth + cushionDepth) / 2,
        [topLeftCushionVertices],
        cushionOptions,
        true
    );

    // Top right cushion vertices
    let topRightCushionVertices = [
        { x: tableWidth/2, y: 0 },
        { x: tableWidth -(cushionDepth*2), y: 0 },
        { x: (tableWidth - pocketCoverSize) - cushionDepth-8, y: borderWidth + cushionDepth },
        { x: xMiddlePocket + pocketCoverSize + cushionDepth, y: borderWidth + cushionDepth }
    ];
    let topRightCushionBody = Bodies.fromVertices(
        (tableWidth/4)*3,
        (borderWidth + cushionDepth)/2,
        [topRightCushionVertices],
        cushionOptions,
        true
    );
    // Bottom left cushion vertices
    let bottomLeftCushionVertices = [
        { x: cushionDepth*2, y: tableHeight },
        { x: tableWidth/2+5, y: tableHeight },
        { x: xMiddlePocket - cushionDepth, y: tableHeight - (borderWidth + cushionDepth) },
        { x: pocketCoverSize + cushionDepth+8, y: tableHeight - (borderWidth + cushionDepth) }
    ];
    let bottomLeftCushionBody = Bodies.fromVertices(
        (tableWidth/4), 
        tableHeight-((borderWidth + cushionDepth)/2),
        [bottomLeftCushionVertices],
        cushionOptions,
        true
    );
    // Bottom right cushion vertices
    let bottomRightCushionVertices = [
        { x: tableWidth/2-5, y: tableHeight },
        { x: tableWidth - (cushionDepth*2), y: tableHeight },
        { x: tableWidth - pocketCoverSize - cushionDepth -8, y: tableHeight - (borderWidth + cushionDepth) },
        { x: xMiddlePocket + pocketCoverSize + cushionDepth, y: tableHeight - (borderWidth + cushionDepth) }
    ];
    let bottomRightCushionBody = Bodies.fromVertices(
        (tableWidth/4)*3, 
        tableHeight-((borderWidth + cushionDepth)/2),
        [bottomRightCushionVertices],
        cushionOptions,
        true
    );
    // Left cushion vertices
    let leftCushionVertices = [
        { x: 0, y: 0 },
        { x: 0, y: tableHeight - (cushionDepth*2) },
        { x: borderWidth + cushionDepth, y: (tableHeight - pocketCoverSize) - cushionDepth -8},
        { x: borderWidth + cushionDepth, y: pocketCoverSize + cushionDepth +8}
    ];
    let leftCushionBody = Bodies.fromVertices(
        (borderWidth + cushionDepth) / 2, 
        tableHeight/2,
        [leftCushionVertices],
        cushionOptions,
        true
    );
    // Right cushion vertices
    let rightCushionVertices = [
        { x: tableWidth, y: cushionDepth*2 },
        { x: tableWidth, y: tableHeight - (cushionDepth*2) },
        { x: tableWidth - (borderWidth + cushionDepth), y: (tableHeight - pocketCoverSize) - cushionDepth-8 },
        { x: tableWidth - (borderWidth + cushionDepth), y: pocketCoverSize + cushionDepth+8 }
    ];
    let rightCushionBody = Bodies.fromVertices(
        tableWidth - ((borderWidth + cushionDepth) / 2), 
        tableHeight/2,
        [rightCushionVertices],
        cushionOptions,
        true
    );

    // Add the cushion to the world
    World.add(world, [
        topLeftCushionBody, 
        topRightCushionBody, 
        bottomLeftCushionBody, 
        bottomRightCushionBody, 
        leftCushionBody, 
        rightCushionBody
    ]);
}

// Standard Snooker ball distribution
function modeA(){
    clearBalls();
    // The x position for the first column of red balls
    const firstColumnX = (tableWidth / 5) * 4;

    // The y position for the bottom ball in the first column
    const bottomBallY = (tableHeight / 2) + 2 * ballDiameter; 

    // Create the first column of 5 red balls
    for (let i = 0; i < 5; i++) {
        let x = firstColumnX;
        let y = bottomBallY - i * (ballDiameter); // +1 for a small gap between balls
        let redBall = new Ball(x, y, ballDiameter / 2, 'red', 'redBall');
        balls.push(redBall);
    }

    // The x position for the second column of red balls
    const secondColumnX = firstColumnX - ballDiameter - 1; // Subtract the diameter and a gap

    // Y positions for the 4 balls in the second column
    const yPositions = [
        halfTable + (ballDiameter + (ballDiameter / 2)),
        halfTable + (ballDiameter / 2),
        halfTable - (ballDiameter / 2),
        halfTable - (ballDiameter + (ballDiameter / 2))
    ];

    // Create the second column of 4 red balls
    for (let i = 0; i < 4; i++) {
        let x = secondColumnX;
        let y = yPositions[i];
        let redBall = new Ball(x, y, ballDiameter / 2, 'red', 'redBall');
        balls.push(redBall);
    }

    // The x position for the third column of red balls
    const thirdColumnX = firstColumnX - (ballDiameter * 2) - 2; // Subtract twice the diameter and a gap for the third column

    // Y positions for the 3 balls in the third column
    const yPositionsThird = [
        halfTable + ballDiameter,
        halfTable,
        halfTable - ballDiameter
    ];

    // Create the third column of 3 red balls
    for (let i = 0; i < 3; i++) {
        let x = thirdColumnX;
        let y = yPositionsThird[i];
        let redBall = new Ball(x, y, ballDiameter / 2, 'red', 'redBall');
        balls.push(redBall);
    }

    // The x position for the fourth column of red balls
    const fourthColumnX = firstColumnX - (ballDiameter * 3) - 2; // Subtract thrice the diameter and a gap for the fourth column

    // Y positions for the 2 balls in the fourth column
    const yPositionsFourth = [
        halfTable + (ballDiameter / 2),
        halfTable - (ballDiameter / 2)
    ];

    // Create the fourth column of 2 red balls
    for (let i = 0; i < 2; i++) {
        let x = fourthColumnX;
        let y = yPositionsFourth[i];
        let redBall = new Ball(x, y, ballDiameter / 2, 'red', 'redBall');
        balls.push(redBall);
    }

    // The x position for the single ball at the top of the triangle
    const fifthColumnX = firstColumnX - (ballDiameter * 4) - 2; // Subtract four times the diameter and a gap for the fifth column

    // Y position for the single ball in the fifth column
    const yFifth = halfTable; // The center of the table height

    // Create the single ball at the top of the triangle
    let singleRedBall = new Ball(fifthColumnX, yFifth, ballDiameter / 2, 'red', 'redBall');
    balls.push(singleRedBall);

    // Iterate over the coloredBallPositions dictionary to create each colored ball
    for (const [color, position] of Object.entries(coloredBallPositions)) {
        balls.push(new Ball(position.x, position.y, ballDiameter / 2, color, 'colorBall'));
    }
}

// All random balls
function modeB() {
    clearBalls();
    // Define padding and safe zone
    const padding = 10;
    const minX = borderWidth + cushionDepth + padding;
    const maxX = tableWidth - (borderWidth + cushionDepth + padding);
    const minY = borderWidth + cushionDepth + padding;
    const maxY = tableHeight - (borderWidth + cushionDepth + padding);

    // Randomize positions for the red balls
    for (let i = 0; i < 15; i++) {
        let x, y, safeSpot;
        do {
            x = random(minX, maxX);
            y = random(minY, maxY);
            safeSpot = isSafePosition(x, y, balls, ballDiameter);
        } while (!safeSpot);

        let redBall = new Ball(x, y, ballDiameter / 2, 'red', 'redBall');
        balls.push(redBall);
    }

    // Iterate over the coloredBallPositions dictionary to create each colored ball
    for (const [color, position] of Object.entries(coloredBallPositions)) {
        balls.push(new Ball(position.x, position.y, ballDiameter / 2, color, 'colorBall'));
    }
}

// Only red balls random
function modeC() {
    clearBalls();
    // Define padding and safe zone
    const padding = 10;
    const minX = borderWidth + cushionDepth + padding;
    const maxX = tableWidth - (borderWidth + cushionDepth + padding);
    const minY = borderWidth + cushionDepth + padding;
    const maxY = tableHeight - (borderWidth + cushionDepth + padding);

    // Randomize positions for the red balls
    for (let i = 0; i < 15; i++) {
        let x, y, safeSpot;
        do {
            x = random(minX, maxX);
            y = random(minY, maxY);
            safeSpot = isSafePosition(x, y, balls, ballDiameter);
        } while (!safeSpot);

        let redBall = new Ball(x, y, ballDiameter / 2, 'red', 'redBall');
        balls.push(redBall);
    }

    // Randomize positions for the colored balls
    const colors = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'];
    colors.forEach(color => {
        let x, y, safeSpot;
        do {
            x = random(minX, maxX);
            y = random(minY, maxY);
            safeSpot = isSafePosition(x, y, balls, ballDiameter);
        } while (!safeSpot);

        let coloredBall = new Ball(x, y, ballDiameter / 2, color, 'colorBall');
        balls.push(coloredBall);
    });
}


let holes = []; // Array to store holes

function extremeMode(){
    extremeModeFlag = true;
    nextHoleTime = millis() + holeInterval; // Set the timer for the first malignant hole
    clearBalls();
    half_ball_diameter = ballDiameter/2;
    // The x position for the first column of red balls
    const firstColumnX = (tableWidth / 5) * 4;

    // The y position for the bottom ball in the first column
    const bottomBallY = (tableHeight / 2) + 2 * ballDiameter; 

    // Create the first column of 5 red balls
    for (let i = 0; i < 5; i++) {
        let x = firstColumnX;
        let y = bottomBallY - i * (ballDiameter);
        let redBall = new Ball(x, y, half_ball_diameter / 2, 'red', 'redBall');
        balls.push(redBall);
    }

    // The x position for the second column of red balls
    const secondColumnX = firstColumnX - ballDiameter - 1; // Subtract the diameter and a gap

    // Y positions for the 4 balls in the second column
    const yPositions = [
        halfTable + (ballDiameter + (ballDiameter / 2)),
        halfTable + (ballDiameter / 2),
        halfTable - (ballDiameter / 2),
        halfTable - (ballDiameter + (ballDiameter / 2))
    ];

    // Create the second column of 4 red balls
    for (let i = 0; i < 4; i++) {
        let x = secondColumnX;
        let y = yPositions[i];
        let redBall = new Ball(x, y, half_ball_diameter / 2, 'red', 'redBall');
        balls.push(redBall);
    }

    // The x position for the third column of red balls
    const thirdColumnX = firstColumnX - (ballDiameter * 2) - 2; // Subtract twice the diameter and a gap for the third column

    // Y positions for the 3 balls in the third column
    const yPositionsThird = [
        halfTable + ballDiameter,
        halfTable,
        halfTable - ballDiameter
    ];

    // Create the third column of 3 red balls
    for (let i = 0; i < 3; i++) {
        let x = thirdColumnX;
        let y = yPositionsThird[i];
        let redBall = new Ball(x, y, half_ball_diameter / 2, 'red', 'redBall');
        balls.push(redBall);
    }

    // The x position for the fourth column of red balls
    const fourthColumnX = firstColumnX - (ballDiameter * 3) - 2; // Subtract thrice the diameter and a gap for the fourth column

    // Y positions for the 2 balls in the fourth column
    const yPositionsFourth = [
        halfTable + (ballDiameter / 2),
        halfTable - (ballDiameter / 2)
    ];

    // Create the fourth column of 2 red balls
    for (let i = 0; i < 2; i++) {
        let x = fourthColumnX;
        let y = yPositionsFourth[i];
        let redBall = new Ball(x, y, half_ball_diameter / 2, 'red', 'redBall');
        balls.push(redBall);
    }

    // The x position for the single ball at the top of the triangle
    const fifthColumnX = firstColumnX - (ballDiameter * 4) - 2; // Subtract four times the diameter and a gap for the fifth column

    // Y position for the single ball in the fifth column
    const yFifth = halfTable; // The center of the table height

    // Create the single ball at the top of the triangle
    let singleRedBall = new Ball(fifthColumnX, yFifth, half_ball_diameter / 2, 'red', 'redBall');
    balls.push(singleRedBall);

    // Iterate over the coloredBallPositions dictionary to create each colored ball
    for (const [color, position] of Object.entries(coloredBallPositions)) {
        balls.push(new Ball(position.x, position.y, half_ball_diameter / 2, color, 'colorBall'));
    }
}

function drawHoles() {
    fill(0); // Black color for holes
    noStroke();
    for (let hole of holes) {
        ellipse(hole.x, hole.y, pocketDiameter/2);
    }
}

// Check for balls falling into holes
function checkForBallsInHoles() {
    if (extremeModeFlag) {
        for (let i = balls.length - 1; i >= 0; i--) {
            let ball = balls[i];
            let ballPos = ball.body.position;

            for (let hole of holes) {
                if (dist(ballPos.x, ballPos.y, hole.x, hole.y) < pocketDiameter/2) {
                    console.log(`${ball.color} ball fell into a hole!`);
                    ballLostMessage = true; // Trigger the message display
                    faultMessageStart = millis(); // Record the start time
                    // Remove the ball from the world and the balls array
                    Matter.World.remove(world, ball.body);
                    balls.splice(i, 1);
                }
            }
        }
    }
}
// Function to add random holes
function addRandomHole() {
    let safeSpot = false;
    let newHole = {};
    // Check if its within the boundaries of the table
    while (!safeSpot) {
        newHole = {
            x: random(borderWidth + cushionDepth, tableWidth - borderWidth - cushionDepth),
            y: random(borderWidth + cushionDepth, tableHeight - borderWidth - cushionDepth),
            radius: pocketDiameter/2 // Same radius as pockets
        };
        safeSpot = isSafeHolePosition(newHole, holes);
    }
    // Never let more than 10 holes be drawn, if its more than 10, start deleting the first one, and so on
    if (holes.length > 9) {
        holes.shift(); // Remove the first hole
    }

    holes.push(newHole);
}
// Function to check if holes are not drawn overlapping each other
function isSafeHolePosition(newHole, existingHoles) {
    for (let hole of existingHoles) {
        if (dist(newHole.x, newHole.y, hole.x, hole.y) < newHole.radius + hole.radius) {
            return false; // Too close to another hole
        }
    }
    return true;
}
// Helper function that checks position of balls when created randomly so they dont overlap
function isSafePosition(x, y, balls, minDist) {
    return balls.every(ball => {
        const dx = ball.body.position.x - x;
        const dy = ball.body.position.y - y;
        return Math.sqrt(dx * dx + dy * dy) >= minDist;
    });
}

function clearBalls() {
    // Remove all balls from the Matter.js world
    balls.forEach(ball => {
        World.remove(world, ball.body);
    });
    balls = []; // Clear the array
}
// Main Menu
function displayModeSelectionMessage() {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("Press 1 for standard snooker", width / 2, height / 5);
    text("Press 2 for all random balls", width / 2, (height / 5)*2);
    text("Press 3 for random red balls", width / 2, (height / 5)*3);
    text("Press 4 for EXTREME MODE (Extension)", width / 2, (height / 5)*4);
}

// Prompt user to place cueball inside D semi circle
function displayCueBallPlacementMessage() {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("Click on the D semi-circle to place the cue ball and start the game", width / 2, height / 4);
}

// If cueball pocketed, re-place the cueball message
function displayRePlaceCueBallMessage(){
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text("Click on the D semi-circle to place the cue ball to continue playing", width / 2, height / 4);
}

// Fault message for when two consecutive colored balls pocketed
function displayTwoColorBallsPocketedMessage() {
    if (displayFaultMessage) {
        // Display the fault message
        fill(136, 8, 8); // Red color for the fault message
        textAlign(CENTER, CENTER);
        text("Fault, two consecutive colored balls potted", width / 2, height / 2);
        
        // Set a timeout to reset the game state after the message is displayed
        setTimeout(() => {
            resetAfterFault();
        }, 2000); // Hide the message after 2 seconds for example
    }
}

// Extreme mode when a ball falls inside a malignant hole message
function displayLostBallMessage() {
    fill(136, 8, 8); // Red color for the message
    textAlign(CENTER, CENTER);
    text("You lost the ball :(", width / 2, height / 2);
}

// Instructions when Extreme Mode selected
function displayExtremeModeInstructions(){
    push();

    // Draw a semi-transparent rectangle as the background for the instructions
    fill(0, 0, 0, 150); // Semi-transparent black
    rectMode(CENTER);
    let rectWidth = 300;
    let rectHeight = 80;
    rect(width / 2, height / 2, rectWidth, rectHeight, 20); // Rounded corners

    // Display the instruction text
    fill(255); // White text
    textAlign(CENTER, CENTER);
    textSize(16);
    textFont('Arial', 11);
    text("Extreme Mode: Balls are half size with random holes\nappearing every 5 seconds.\nPotting in holes loses the ball and points.\nPress ENTER to start.", width / 2, height / 2);

    pop();
}

// Alert user the type of collision of the cueball
function displayCollisionMessage() {
    if (millis() - collisionMessageTime < collisionMessageDuration) {
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(16); 
        text(collisionMessage, width / 2, 50); // Display at the top of the canvas
    } else {
        collisionMessage = ""; // Clear the message after the duration
    }
}