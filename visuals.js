/* 
 * Author: Isaiah Mann
 * Description: Used to display a map of the United States and housing unit data, performs hit testing based off RGB values
 * URL: http://stout.hampshire.edu/~ibm13/HousingUnits/
 */

/**
 * @description The visual map of the states
 * @param {State[]} listOfStates A list of states containing population data
 * @param {Canvas} canvas The displayed canvas
 * @param {String} mapURL The file location of the map image
 * @constructor
 * @return {VisualMap}
 */
function VisualMap (listOfStates, canvas, mapURL) {
    var _this = this;
    
    /**
     * List of States
     * @private
     * @type State[]
     * @description All the states and their population & housing data
     */
    this.listOfStates = listOfStates;
    
    /**
     * @private
     * @type State
     * @description The currently selected state
     */
    this.activeState = null;
    
    /**
     * @private
     * @type RGBImageData
     * @description The image data of the picture of the states
     */
    this.imageData;
    
    /**
     * @private
     * @type Image
     * @description The image of the states
     */
    this.mapImage = new Image();
    
    /**
     * @private
     * @type String
     * @description The file location of the map image
     */
    this.mapImage.src = mapURL;
    
    this.imageScale = 0.65;
    this.canvas = canvas;
    this.mapImage.onload = function () {
        //var bufferedCanvas = _this.initializeBuffer(_this.mapImage);
        _this.imageScale = _this.calculateScale(_this.mapImage);
        _this.imageData = _this.initializeRGBImageData (_this.mapImage, 
                                   _this.canvas,
                                   _this.canvas.getContext("2d"),
                                   _this.imageScale);
    };
    
    this.debugger = new Debugger();
    
    this.formatter = new NumberFormatter();
    
    this.statePanel = new StatePanel(
            4,
            ORIENTATION.RIGHT
           );
   
};

/**
 * @description Returns a buffered canvas with the image drawn onto it
 * @param {Image} image The image to draw onto the buffered canvas
 * @returns {Canvas}
 */
VisualMap.prototype.initializeBuffer = function (image) {
    var canvas = document.createElement('canvas');
    canvas.height = image.height;
    canvas.width = image.width;
    var g = canvas.getContext("2d");
    g.drawImage(image, 0, 0);
    return canvas;
};

/**
 * @description Samples the pixel data of the map image
 * @param {Image} image Provides the dimensions of the image to sample
 * @param {Canvas} canvas the canvas  the image is drawn onto
 * @param {GraphicsContext2D} g Graphics object to draw to
 * @param {Real} scale The scale of the image
 * @returns {RGBImageData}
 */
VisualMap.prototype.initializeRGBImageData = function (image, canvas, g, scale) {
    g.drawImage(image, 0, 0,
                image.width * scale, 
                image.height * scale);
    return imageData = new RGBImageData(image, 
                                   canvas.getContext("2d"));
                                   console.log("Generated the image data");
};


/**
 * @description Draws the map image onto the canvas
 * @param {GraphicsContext2D} g The canvas graphics to draw to
 * @param {Matrix} transformMatrix The transformations affecting the map
 * @returns {undefined}
 */
VisualMap.prototype.draw = function (g, transformMatrix) {

    g.save();
    g.setTransform(
            transformMatrix.get(0, 0),
            transformMatrix.get(0, 1),
            transformMatrix.get(1, 0),
            transformMatrix.get(1, 1),
            transformMatrix.get(2, 0),
            transformMatrix.get(2, 1)
            );

    g.drawImage(this.mapImage, 0, 0, 
                this.mapImage.width * this.imageScale, 
                this.mapImage.height * this.imageScale);
    g.restore();
    this.displayActiveState(g,
                            Scaler.screenWidth/2,
                            0);

    if (DEBUG) {
        this.debugger.draw(g);
    }

    this.statePanel.draw(g);

};

/**
 * @description Calculates the scale of the image based on the width of the screen
 * @param {Image} image The image
 * @returns {int}
 */
VisualMap.prototype.calculateScale = function (image) {
    return Scaler.screenWidth/image.width;
};

/**
 * @description Sets the active state if the hittest is successful
 * @param {int} x The x position of the hittest
 * @param {int} y The y position of the hittest
 * @param {Matrix} transformMatrix The transform matrix affecting the drawing of the map
 * @returns {Boolean}
 */
VisualMap.prototype.hitTest = function (x, y, transformMatrix) {
    x = parseInt(x);
    y = parseInt(y);
    
    var currentCoordinate = Matrix.fromPoint((new Point(x, y)));
   
    var transformedCoordinate = transformMatrix.getInverse().multiply(currentCoordinate);
    
    // Inverse Matrix was returning decimals which needed to be rounded to work with pixel data
    var transformedX = parseInt(transformedCoordinate.get(0, 0));
    var transformedY = parseInt(transformedCoordinate.get(0, 1));
    
    this.debugger.setLine(2, 
            "Hit Test: " +
            "(" + 
            transformedX.toString() +
            ", " +
            transformedY.toString() + 
            ")");
    
    if (this.imageData === null || 
            !this.inBounds(transformedX,
                            transformedY)) {
        return;
    }
    
    var pixel = this.imageData.getPixelData(transformedX,
                                            transformedY);
    
    this.activeState = this.getStateFromColor(
                pixel["red"],
                pixel["green"],
                pixel["blue"]
            );
    
    if (this.activeState === null) {
        return false;
    } else {
        return true;
    }
};

/**
 * @description Checks whether a coordinate is within the bounds of the canvas
 * @param {int} x The x position of the coordinate
 * @param {int} y The y position of the coorinate
 * @returns {Boolean}
 */
VisualMap.prototype.inBounds = function (x, y) {
  return (x > 0 && y > 0 &&
          x < this.canvas.width &&
          y < this.canvas.height);
};

/**
 * A text display of the active state and its information
 * @param {GraphicsContext2D} g The graphics of the canvas being drawn to 
 * @param {int} x The x position of the text box
 * @param {int} y The y position of the text box
 * @returns {undefined}
 */
VisualMap.prototype.displayActiveState = function (g, x, y) {
    var spacing = 40;
    var lineCount = 4;
    var xOffset =  spacing * 0.25;
    var yOffset =  spacing;
    var width = Scaler.screenWidth/3;
    var height = spacing*lineCount;
    var fontSize = spacing;
    x -= width/2;
    g.fillStyle = TRANSLUSCENT_BLACK;
    g.fillRect(x, y, width, height);
    g.fillStyle = "white";
    g.font = fontSize + 'px Times';
    if (this.activeState === null) {
        g.fillText("Hover over a state", 
                    x + xOffset, 
                    y + yOffset);
        g.fillText("to view housing data", 
                    x + xOffset, 
                    y + yOffset * 2);
    } else {
        g.fillText(this.activeState.getName(), 
                    x + xOffset, 
                    y + yOffset);
        g.fillText("Population: " + 
                this.formatter.addCommas(this.activeState.getPopulation()),
                    x + xOffset, 
                    y + yOffset * 2);
        g.fillText("Housing Units: " + 
                this.formatter.addCommas(this.activeState.getHousingUnits()), 
                    x + xOffset, 
                    y + yOffset * 3);
    }
};


/**
 * @description Returns a state based off its color in the visual map using the MAPPINING hash
 * @param {int} r The red channel of the sampled pixel
 * @param {int} g The green channel of the sampled pixel
 * @param {int} b The blue channel of the sampled pixel
 * @returns {State}
 */
VisualMap.prototype.getStateFromColor = function (r, g, b) {
    var hexColor = new RGBToHex(r, g, b).getHexValue();
    var stateName = MAPPING[hexColor];
    return this.getStateByName(stateName);
};

/**
 * @description Gets the state by name or null if the state does not exist
 * @param {String} stateName The name of the state
 * @returns {State}
 */
VisualMap.prototype.getStateByName = function (stateName) {
    if (stateName === null) {
        return;
    }
    
    for (var i = 0; i < this.listOfStates.length; i++) {
        if (stateName === this.listOfStates[i].getName()) {
            return this.listOfStates[i];   
        }
    }
    
    return null;
};

/**
 * @description Used to add the active state to the panel
 * @returns {undefined}
 */
VisualMap.prototype.addActiveStateToPanel = function () {
    if (this.activeState !== null) {
        this.statePanel.addStateToPanel(this.activeState);
    }
};

/**
 * @description Fetches the statepanel associated with the visual map
 * @returns {StatePanel}
 */
VisualMap.prototype.getStatePanel = function () {
    return this.statePanel;
};

/**
 * @description Used as a visual debugger
 * @returns {Debugger}
 * @constructor
 */
function Debugger () {
    console.log("Debugger initialized");
    this.line1 = null;
    this.line2 = null;
}

/**
 * @description Draws the debugger to a canvas
 * @param {GraphicsContext2D} g The canvas graphics to draw the debugger to
 * @returns {undefined}
 */
Debugger.prototype.draw = function (g) {
    g.fillStyle = "black";
    g.fillRect(0, 0, 250, 125);
    g.fillStyle = "white";
    g.font = "20px arial";
    
    if (this.line1 === null) {
        g.fillText("Dimensions: " + Scaler.screenWidth + "x" + Scaler.screenHeight, 25, 50);
    } else {
        g.fillText(this.line1, 25, 50);
    }
    
    if (this.line2 === null) {
        g.fillText("Pixel Ratio: " + window.devicePixelRatio, 25, 100);
    } else {
        g.fillText(this.line2, 25, 100);
    }
};

/**
 * @description Sets the specified string in the debugger
 * @param {int} index The index of the line to set in the debugger
 * @param {String} text The text to set the line to
 * @returns {undefined}
 */
Debugger.prototype.setLine = function (index, text) {
    if (index === 1) {
        this.line1 = text;
    } else if (index === 2) {
        this.line2 = text;
    }
};      


/**
 * @description Abstract class for a hit-testable box element
 * @param {int} x
 * @param {int} y
 * @returns {HitTestableBox}
 * @constructor
 */
function HitTestableBox (x, y) {
    this.x = x;
    this.y = x;
    this.width;
    this.height;
};

/**
 * @description Checks whether a point is inside the bounds
 * @param {int} x
 * @param {int} y
 * @returns {Boolean}
 */
HitTestableBox.prototype.hitTest = function (x, y) {
    return x >= this.x &&
        x <= this.x + this.width &&
        y >= this.y &&
        y <= this.y + this.height;              
};

/**
 * @description A box to display and store a state value
 * @param {int} x
 * @param {int} y
 * @returns {StateBox}
 * @constructor
 */
function StateBox (x, y) {
    this.x = x;
    this.y = y;
    this.width = Scaler.screenWidth/8;
    this.height = Scaler.screenHeight/Scaler.pixelRatio/8;
    this.state = null;
    this.defaultMessage = "Click active state to select";
    this.unselectMessage = "Click to unselect state";
    this.emptyMessage = "(no state)";
}

StateBox.prototype = new HitTestableBox();

/**
 * @description Draws the StateBox to the screen
 * @param {GraphicsContext2d} g The graphics object to draw to
 * @returns {undefined}
 */
StateBox.prototype.draw = function (g) {
    
    g.fillStyle = TRANSLUSCENT_BLACK;
    g.fillRect(
        this.x,
        this.y,
        this.width,
        this.height
    );
    
    g.fillStyle = "white";
    
    g.font = "20px Times";
    g.fillText(
            this.state === null ? 
                this.emptyMessage :
                        this.state.getName(),
                this.x + this.width/16,
                this.y + this.height/2.5);
    
    g.font = "13px arial";
    g.fillText(
            this.state === null ? 
                this.defaultMessage :
                        this.unselectMessage,
                this.x + this.width/16,
                this.y + this.height/1.25);
};

/**
 * @description Sets the state in the box
 * @param {State} state The current state
 * @returns {undefined}
 */
StateBox.prototype.setState = function (state) {
    this.state = state;
};

/**
 * @description Clears the state in the box
 * @returns {undefined}
 */
StateBox.prototype.clearState = function () {
    this.state = null;
};

/**
 * @description If there is already a state, it clears it, otherwise, it sets the value
 * @param {State} state
 * @returns {undefined}
 */
StateBox.prototype.toggleState = function (state) {
    if (!this.hasState()) {
        this.setState(state);
    } else {
        this.clearState();
    }
};

/**
 * @description Sets the position of the statebox
 * @param {int} x
 * @param {int} y
 * @returns {undefined}
 */
StateBox.prototype.setPosition = function (x, y) {
    this.x = x;
    this.y = y;
};

/**
 * @description Fetches the dimensions of the box
 * @returns {Dimensions}
 */
StateBox.prototype.getDimensions = function () {
    return new Dimensions(this.width, this.height);
};

/**
 * @description Checks whether the statebox has a state
 * @returns {Boolean}
 */
StateBox.prototype.hasState = function () {
  return !(this.state === null);
};

/**
 * @description Returns the current state in the box
 * @returns {State}
 */
StateBox.prototype.getState = function () {
    return this.state;
};

/**
 * @description Stores a panel of state boxes
 * @param {int} stateCount The number of states stored in the panel
 * @param {ORIENTATION} orientation The orientation of the panel
 * @returns {StatePanel}
 * @constructor
 */
function StatePanel (stateCount, orientation) {
    var _this = this;
    
    // Set in the generateStateBoxes function
    this.x;
    this.y;
    
    this.stateCount = stateCount;
    this.orientation = orientation;
    this.stateBoxes = this.generateStateBoxes();
    this.compareButton = new Button (
                this.x,
                this.y - Scaler.screenHeight/8,
                function () {
                    if (_this.currentStateCount() > 0) {
                        _this.loadGraph(
                                _this.getCurrentStates());
                    }
                },
                "Compare"
            );
    
    this.clearButton = new Button (
                this.x,
                this.y - Scaler.screenHeight/16,
                function () {
                    _this.clearAllStateBoxes(_this.stateBoxes);
                },
                "Clear All"
    );
    
    this.buttons = [
      this.compareButton,
      this.clearButton
    ];
    
    this.stateGraph = null;
}

/**
 * @description Generates the state boxes
 * @returns {StateBox[]}
 */
StatePanel.prototype.generateStateBoxes = function () {
    var stateBoxes = [];
    var firstBox = new StateBox(0, 0);
    var height = firstBox.getDimensions().height;
    var width = firstBox.getDimensions().width;
    var padding = height/2;
    
    this.x = this.orientation.x - width;
    firstBox.setPosition(
            this.x,
            this.y = this.getBoxYPosition(0,
                                 height, 
                                 padding)
           );
    
    stateBoxes.push(firstBox);
    
    for (var i = 1; i < this.stateCount; i++) {
       stateBoxes.push(
                new StateBox (
                    this.x,
                    this.getBoxYPosition(i, height, padding)
                )
               );
    }
    
    return stateBoxes;
};

/**
 * @description Draws the state boxes
 * @param {GraphicsContext2D} g
 * @returns {undefined}
 */
StatePanel.prototype.draw = function (g) {
  for (var i = 0; i < this.stateCount; i++) {
      this.stateBoxes[i].draw(g);
  }
  
  for (var i = 0; i < this.buttons.length; i++) {
      this.buttons[i].draw(g);
  }
};

/**
 * @description Gets the y position of a specified box
 * @param {int} index The index of the box
 * @param {Real} height The height of the box
 * @param {Real} padding The padding between each box
 * @returns {int}
 */
StatePanel.prototype.getBoxYPosition = function (index, height, padding) {
    var offset = 0;
    if (this.orientation.y !== 0) {
        offset = -1 * (padding + height) * this.stateCount/2-1;
    }

    return (index * (padding + height)) + offset + this.orientation.y;
};

/**
 * @description Adds the state to the state boxes
 * @param {State} state
 * @returns {undefined}
 */
StatePanel.prototype.addStateToPanel = function (state) {
    if (!this.containsState(state)) {
        for (var i = 0; i < this.stateCount; i++) {
            if (this.stateBoxes[i].hasState()) {
                continue;
            } else {
                this.stateBoxes[i].toggleState(state);
                break;
            }
        }
    }
};

/**
 * @description Checks whether the panel contains a state
 * @param {State} state
 * @returns {Boolean}
 */
StatePanel.prototype.containsState = function (state) {
    for (var i = 0; i < this.stateBoxes.length; i++) {
        if (this.stateBoxes[i].getState() === state) {
            return true;
        }
    }
    
    return false;
};

/**
 * @description Tests whether any statebox was clicked on
 * @param {type} x
 * @param {type} y
 * @returns {Boolean}
 */
StatePanel.prototype.hitTest = function (x, y) {
    if (this.stateGraph === null) {
        if (this.hitTestButtons(x, y)) {
            return true;
        }

        for (var i = 0; i < this.stateCount; i++) {
            if (this.stateBoxes[i].hitTest(x, y) &&
                    this.stateBoxes[i].hasState()) {

                return true;
            }
        }
    } else {
        if (this.stateGraph.hitTest(x, y)) {
            return true;
        }
    }
    
    return false;
    
};

/*
 * @description Used to hit test all the buttons in the state panel
 * @param {int} x
 * @param {int} y
 * @returns {Boolean}
 */
StatePanel.prototype.hitTestButtons = function (x, y) {
    for (var i = 0; i < this.buttons.length; i++) {
        if (this.buttons[i].hitTest(x, y)) {
            return true;
        }
    }
    
    return false;
};

/**
 * @description Used to process biutton clicks if hit tests return true
 * @param {int} x
 * @param {int} y
 * @returns {undefined}
 */
StatePanel.prototype.processClickButtons = function (x, y) {
    for (var i = 0; i < this.buttons.length; i++) {
        if (this.buttons[i].hitTest(x, y)) {
            this.buttons[i].onClick();
        }
    }
};
/**
 * @description Processing a click on the StatePanel
 * @param {int} x
 * @param {int} y
 * @returns {undefined}
 */
StatePanel.prototype.processClick = function (x, y) {
    if (this.stateGraph === null) {
        this.processClickButtons(x, y);

        for (var i = 0; i < this.stateCount; i++) {
             if (this.stateBoxes[i].hitTest(x, y) &&
                     this.stateBoxes[i].hasState()) {

                 this.stateBoxes[i].toggleState(null);
             }
         }  
    } else {
        if (this.stateGraph.hitTest(x, y)) {
            this.stateGraph.processClick(x, y);
        }
    }
};

/**
 * @description Fetches the states currently stored in the state boxes
 * @returns {State[]}
 */
StatePanel.prototype.getCurrentStates = function () {
    var states = [];
    for (var i = 0; i < this.stateCount; i++) {
        if (this.stateBoxes[i].hasState()) {
            states.push(
                this.stateBoxes[i].getState()
            );
        }
    }
    return states;
};

/**
 * @description Checks how many states are currently stored in the state boxes
 * @returns {int}
 */
StatePanel.prototype.currentStateCount = function () {
    var count = 0;
    for (var i = 0; i < this.stateCount; i++) {
        if (this.stateBoxes[i].hasState()) {
            count++;
        }
    }
    return count;
};

/**
 * @description Loads a graph from the current stored states
 * @param {State[]} states The stored states
 * @returns {undefined}
 */
StatePanel.prototype.loadGraph = function (states) {    
    console.log("Loading the graph");
    var _this = this;
    this.stateGraph = new StateGraph (
        states,
        Scaler.screenWidth/8,
        ORIENTATION.LEFT.x + Scaler.screenWidth/8,
        ORIENTATION.BOTTOM.y - Scaler.screenHeight/6,
        _this
    );
};

/**
 * @description Checks whether the graph is active
 * @returns {Boolean}
 */
StatePanel.prototype.stateGraphActive = function () {
    return this.stateGraph !== null;
};

/**
 * @description Draws the graph of the current states
 * @param {GraphicsContext2D} g
 * @returns {undefined}
 */
StatePanel.prototype.drawStateGraph = function (g) {
    this.stateGraph.draw(g);
};

/**
 * @description Exits out of the graph
 * @returns {undefined}
 */
StatePanel.prototype.closeStateGraph = function () {
    this.stateGraph = null;
};

/**
 * @description Empties all of the state boxes of their current states
 * @param {StateBox[]} stateBoxes
 * @returns {undefined}
 */
StatePanel.prototype.clearAllStateBoxes = function (stateBoxes) {
    for (var i = 0; i < stateBoxes.length; i++) {
        stateBoxes[i].clearState();
    }
};

/**
 * @description Used to graph the population data of multiple states
 * @param {State[]} states
 * @param {int} spacing
 * @param {int} x
 * @param {int} y
 * @param {StatePanel} statePanel
 * @returns {StateGraph}
 * @constructor
 */
function StateGraph (states, spacing, x, y, statePanel) {
    this.states = states;
    this.populationColor = "red";
    this.housingColor = "blue";
    this.spacing = spacing;
    this.x = x;
    this.y = y;
    this.barGraphStates = this.generateBarGraphStates();
    this.key = this.generateKey();
    this.backButton = new Button (
        ORIENTATION.LEFT.x,
        ORIENTATION.TOP.y,
        function () {
            statePanel.closeStateGraph();
        },
        "Back"
    );
    
}

/**
 * @description Draws the graph of the states' data
 * @param {GraphicsContext2D} g
 * @returns {undefined}
 */
StateGraph.prototype.draw = function (g) {
    g.fillStyle = "grey";
    g.fillRect(0, 0, Scaler.screenWidth, Scaler.screenHeight);
    
    for (var i = 0; i < this.barGraphStates.length; i++) {
        this.barGraphStates[i].draw(g);
    }
    
    this.key.draw(g);
    this.backButton.draw(g);
};

/**
 * @description Creates an array of bar graph states
 * @returns {BarGraphState[]}
 */
StateGraph.prototype.generateBarGraphStates = function () {
    var barGraphStates = [];
    var scale = this.calculateScale();
    for (var i = 0; i < this.states.length; i++) {
        barGraphStates.push(
            new BarGraphState(
                this.states[i],
                this.x + this.spacing * i * 1.5,
                this.y,
                this.populationColor,
                this.housingColor,
                scale
            )
        );
    }
    
    return barGraphStates;
};

/**
 * @description Used for hittesting on the graph
 * @param {int} x
 * @param {int} y
 * @returns {Boolean}
 */
StateGraph.prototype.hitTest = function (x, y) {
    for (var i = 0; i < this.barGraphStates.length; i++) {
        this.barGraphStates[i].hitTest(x, y);
    }
    
    if (this.backButton.hitTest(x, y)) {
        return true;
    }
    
};

/**
 * @description Used to process clicks on the graph
 * @param {int} x
 * @param {int} y
 * @returns {undefined}
 */
StateGraph.prototype.processClick = function (x, y) {
    if (this.backButton.hitTest(x, y)) {
        this.backButton.onClick();
    }
};

/**
 * @description Calculates the scale based off the largest value
 * @returns {Real}
 */
StateGraph.prototype.calculateScale = function () {
    var max = 0;
    for (var i = 0; i < this.states.length; i++) {        
        if (this.states[i].getPopulation() > max) {
            max = this.states[i].getPopulation();
        } 
        
        if (this.states[i].getHousingUnits() > max) {
            max = this.states[i].getHousingUnits();
        } 
    }
    
    return (Scaler.screenHeight/Scaler.pixelRatio * (5/6))/(max);
};

/**
 * @description Creates the key for the graph
 * @returns {Key}
 */
StateGraph.prototype.generateKey = function () {
    return new Key (
        [this.populationColor, this.housingColor],
        ["Population", "Housing Units"],
        ORIENTATION.RIGHT.x - Scaler.screenWidth/7,
        ORIENTATION.TOP.y
    );
};

/**
 * @description A single state in the graph
 * @param {State} state
 * @param {int} x
 * @param {int} y
 * @param {String} populationColor
 * @param {String} housingColor
 * @param {Real} scale
 * @returns {BarGraphState}
 * @constructor
 */
function BarGraphState (state, x, y, populationColor, housingColor, scale) {
    this.scale = scale;
    this.state = state;
    this.x = x;
    this.y = y;
    this.populationBar = new Bar (
            state.getPopulation(),
            this.scale,
            this.x,
            this.y,
            populationColor
    ); 
    
    this.housingBar = new Bar (
            state.getHousingUnits(),
            this.scale,
            this.x + Scaler.screenWidth/16,
            this.y,
            housingColor
    );
}

/**
 * @description Draws a graphical representation of the state
 * @param {GraphicsContext2D} g
 * @returns {undefined}
 */
BarGraphState.prototype.draw = function (g) {
    this.populationBar.draw(g);
    this.housingBar.draw(g);
    g.fillStyle = "white";
    g.font = "30px times";
    g.fillText(
            this.state.getName(),
            this.x,
            this.y + Scaler.screenHeight/32
    );
};

/**
 * @description Hit testing for the state's bars
 * @param {int} x
 * @param {int} y
 * @returns {undefined}
 */
BarGraphState.prototype.hitTest = function (x, y) {
    this.populationBar.checkForHover(x, y);
    this.housingBar.checkForHover(x, y);
};

/**
 * @description A single bar in a graph
 * @param {Real} value
 * @param {Real} scale
 * @param {int} x
 * @param {int} y
 * @param {String} style
 * @returns {Bar}
 * @constructor
 */
function Bar (value, scale, x, y, style) {
    this.value = value;
    this.scale = scale;
    this.x = x;
    this.y = y;
    this.style = style;
    this.width = Scaler.screenWidth/16;
    this.valueShown = false;
}

Bar.prototype = new HitTestableBox();

/**
 * @description Draws the bar
 * @param {GraphicsContext2D} g
 * @returns {undefined}
 */
Bar.prototype.draw = function (g) {
    g.fillStyle = this.style;
    g.fillRect(
            this.x,
            this.y - this.getHeight(),
            this.width,
            this.getHeight()
    );
    
    if (this.valueShown) {
        g.font = "20px times";
        g.fillStyle = "white";
        g.fillText(
            new NumberFormatter().addCommas(this.value),
            this.x,
            Math.min(
                this.y - this.getHeight() + Scaler.screenHeight/64,
                this.y    
            )
        )
    }
    
};

/**
 * @description Fetches the height of the bar
 * @returns {Real}
 */
Bar.prototype.getHeight = function () {
    return this.value * this.scale;
};

/**
 * @description Shows the bar's value on hover
 * @param {int} x
 * @param {int} y
 * @returns {undefined}
 */
Bar.prototype.checkForHover = function (x, y) {
    this.valueShown = this.hitTest(x, y);
};

/**
 * @description Hit testing for the bar
 * @param {int} x
 * @param {int} y
 * @returns {Boolean}
 */
Bar.prototype.hitTest = function (x, y) {
    return x > this.x &&
           x < this.x + this.width &&
           y > this.y - this.getHeight() &&
           y < this.y;
};

/**
 * @description The key to a color coded graph
 * @param {String} colors
 * @param {String} labels
 * @param {int} x
 * @param {int} y
 * @returns {Key}
 * @constructor
 */
function Key (colors, labels, x, y) {
    // Label and color array sshould be the same length
    this.colors = colors;
    this.labels = labels;
    
    this.x = x;
    this.y = y;
    this.spacing = Scaler.screenHeight/16;
}

/**
 * @description Draws the key
 * @param {GraphicsContext2D} g
 * @returns {undefined}
 */
Key.prototype.draw = function (g) {
    
    for (var i = 0; i < this.labels.length; i++) {
        g.fillStyle = this.colors[i];
        g.fillRect(
            this.x,
            this.y + this.spacing * i,
            this.spacing,
            this.spacing
        );

        g.fillStyle = "white";
        g.font = "20px arial";
        g.fillText(
                " - " + this.labels[i],
                this.x,
                this.y + this.spacing * (i + 0.5)
        );
    }
};

/**
 * @description A generic class for drawing buttons to the screen
 * @param {int} x
 * @param {int} y
 * @param {function} onClickFunction The function to be called on click
 * @param {String} text The text of the button
 * @returns {Button}
 * @constructor
 */
function Button (x, y, onClickFunction, text) {
    this.x = x;
    this.y = y;
    this.onClick = onClickFunction;
    this.text = text;
    this.width = Scaler.screenWidth/8;
    this.height = Scaler.screenHeight/20;
}

Button.prototype = new HitTestableBox();

/**
 * @description Event to be overriden when the button is clicked
 * @returns {undefined}
 */
Button.prototype.onClick = function () {
    console.log("Override button's click function to add functionality");
};

/**
 * @description Draws the button to ths screen
 * @param {GraphicsContext2D} g
 * @returns {undefined}
 */
Button.prototype.draw = function (g) {
    
    g.fillStyle = TRANSLUSCENT_BLACK;
    g.fillRect(
            this.x, 
            this.y, 
            this.width, 
            this.height
        );
    
            
    g.fillStyle = "white";
    g.font = "30px arial";
    g.fillText(
            this.text, 
            this.x + this.width/8,
            this.y + this.height/1.5);
           
};