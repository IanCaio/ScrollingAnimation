/**
 * The animation constructor
 * @constructor
 * @param {(string|string[])} ControlledObjects - ID of controlled objects (or array with IDs if more than 1) of the animation.
 * @param {object} AnimationBeginningState - Object with the CSS properties of the controlled object in the beginning of the animation.
 * @param {object} AnimationEndingState - Object with the CSS properties of the controlled object in the ending of the animation.
 * @param {object} BeginningTriggeringPoint - Object with the ID of the trigger, the Y position in pixels or the ID and an offset. Has the fields 'id' and 'posY'.
 * @param {object} EndingTriggeringPoint - Object with the ID of the trigger, the Y position in pixels or the ID and an offset. Has the fields 'id' and 'posY'.
 * @param {object} Configuration - Object containing any extra settings of the animation.
 */
var ScrollingAnimation = function (ControlledObjects, AnimationBeginningState, AnimationEndingState,
				BeginningTriggeringPoint, EndingTriggeringPoint, Configuration) {
	// Get the controlled objects, which will converted to an array with all the IDs if necessary:
	this.CO = ControlledObjects instanceof Array ? ControlledObjects.slice() : [ControlledObjects];
	// Convert the string IDs to DOM elements (requires Polyfill for Browsers < IE9)
	this.CO = this.CO.map(function(element){
		return document.getElementById(element);
	});

	// Get the animation beginning and ending states
	this.ABS = Object.assign({}, AnimationBeginningState);
	this.AES = Object.assign({}, AnimationEndingState);
	if (!this.validateAnimStates(this.ABS, this.AES)) {
		console.error("[ScrollingAnimation] Error: The animation state objects have unmatched keys!");
		return null;
	}

	// Get the beginning and ending triggers
	this.BTP = Object.assign({id: null, posY: 0}, BeginningTriggeringPoint);
	this.ETP = Object.assign({id: null, posY: 0}, EndingTriggeringPoint);

	// Initial state and ratio
	this.state = 0;
	this.ratio = 0; // The ratio of the current position in relation to BTP and ETP

	// Those store the values of the state and ratio in the last iteration and are used to check if either the state
	// or the ratio has changed. We only call the updateStyle method if one of them has changed.
	// They start as -1 to force the first loop to recognize a change in the state/ratio and call updateStyle.
	this.oldState = -1;
	this.oldRatio = -1;

	// Set the configurations or use the defaults if none is given
	// killOnEnd: When it's true, the animation will stop once it reaches the "Done" state. The default is false.
	// callback: Specifies a function to be called on state/ratio changes. The default is null (no function).
	var defaultConfig = { killOnEnd: false, callback: null };
	this.config = (typeof Configuration === 'undefined') ? defaultConfig : Object.assign(defaultConfig, Configuration);

	// Bind methods
	this.update = this.update.bind(this);

	// Later change for animation frames
	this.intervalID = setInterval(this.update, 16);
}

/**
 * Callback that updates the animation
 * @callback
 */
ScrollingAnimation.prototype.update = function(){
	this.checkState();
	this.checkRatio();
	// Did we have a change in the state or ratio?
	if (this.state !== this.oldState || this.ratio !== this.oldRatio) {
		this.oldState = this.state;
		this.oldRatio = this.ratio;

		// If we set a callback function, call it with the state and ratio as arguments
		if (this.config.callback) {
			this.config.callback(this.state, this.ratio);
		}

		this.updateStyle();
	}
}

/**
 * Returns a "rgba(R,G,B,A)" string from an object with red, green, blue and alpha fields
 * @method
 * @param {object} obj - An object with 'red', 'green', 'blue' and 'alpha' fields to be used to build the string.
 */
ScrollingAnimation.prototype.colorFromObj = function (obj) {
	return "rgba(" + parseInt(obj.red) + "," + parseInt(obj.green) + "," + parseInt(obj.blue) + "," + obj.alpha + ")";
}

/**
 * OBSOLETE FUNCTION - Checks if two objects are equivalent
 * @method
 * @param {object} obj1 - Object to be compared for equivalence
 * @param {object} obj2 - Object to be compared for equivalence
 */
ScrollingAnimation.prototype.areEquivalent = function (obj1, obj2) {
	var props1 = Object.getOwnPropertyNames(obj1);
	var props2 = Object.getOwnPropertyNames(obj2);

	if (props1.length !== props2.length) {
		return false;
	}

	for (var i = 0; i < props1.length; i++){
		var prop = props1[i];

		if (obj1[prop] !== obj2[prop]){
			return false;
		}
	}

	return true;
}

/**
 * Updates the CSS style for each Controlled Object
 * @method
 */
ScrollingAnimation.prototype.updateStyle = function(){
	if (this.state === 0){
		// Style matches the ABS
		this.CO.forEach(function(element, index){
			var currentProp;

			for (prop in this.ABS){
				currentProp = this.ABS[prop];

				// Some properties need to be assigned in a special way, since they are not
				// represented only by a number (ie: backgroundColor and color, since they are
				// represented with an object having "red", "green", "blue" and "alpha" keys. Or
				// position properties that need "px" appended).
				switch (prop) {
					case "backgroundColor":
					case "color":
						element.style[prop] = this.colorFromObj(currentProp);
						break;
					case "left":
					case "right":
					case "top":
					case "bottom":
						// If we don't explicitly choose an unit, either here or on AES, default is pixels
						if(!this.extractUnit(currentProp)){
							currentProp = currentProp + (this.extractUnit(this.AES[prop]) || "px");
						}
						element.style[prop] = currentProp;
						break;
					default:
						element.style[prop] = currentProp;
				}
			}
		}, this);
	} else if (this.state === 2){
		// Style matches the AES
		this.CO.forEach(function(element, index){
			var currentProp;

			for (prop in this.AES){
				currentProp = this.AES[prop];

				// Some properties need to be assigned in a special way, since they are not
				// represented only by a number (ie: backgroundColor and color, since they are
				// represented with an object having "red", "green", "blue" and "alpha" keys. Or
				// position properties that need "px" appended).
				switch (prop) {
					case "backgroundColor":
					case "color":
						element.style[prop] = this.colorFromObj(currentProp);
						break;
					case "left":
					case "right":
					case "top":
					case "bottom":
						// If we don't explicitly choose an unit, either here or on ABS, default is pixels
						if(!this.extractUnit(currentProp)){
							currentProp = currentProp + (this.extractUnit(this.ABS[prop]) || "px");
						}
						element.style[prop] = currentProp;
						break;
					default:
						element.style[prop] = currentProp;
				}
			}
		}, this);
	} else {
		// Style is between ABS and AES
		this.CO.forEach(function(element, index){
			var currentProp;

			for (prop in this.AES){
				// Some properties need to be treated specially when assigning their value according to the ratio,
				// since they are not represented only by a number (ie: backgroundColor and color are represented
				// by an object with fields for red, green, blue and alpha values. Those values need to be updated
				// individually and then assigned to a new object which will represent the new backgroundColor/color
				// value).
				switch (prop) {
					case "backgroundColor":
					case "color":
						var newRed = this.ABS[prop].red + (this.ratio * (this.AES[prop].red - this.ABS[prop].red));
						var newGreen = this.ABS[prop].green + (this.ratio * (this.AES[prop].green - this.ABS[prop].green));
						var newBlue = this.ABS[prop].blue + (this.ratio * (this.AES[prop].blue - this.ABS[prop].blue));
						var newAlpha = this.ABS[prop].alpha + (this.ratio * (this.AES[prop].alpha - this.ABS[prop].alpha));

						currentProp = { red: newRed, green: newGreen, blue: newBlue, alpha: newAlpha };

						element.style[prop] = this.colorFromObj(currentProp);
						break;
					case "left":
					case "right":
					case "top":
					case "bottom":
						// Get the real values of the property in the ABS and AES (i.e.: "10px" -> 10)
						var ABSVal = parseFloat(this.ABS[prop]);
						var AESVal = parseFloat(this.AES[prop]);

						// Calculate the current value of the property according to the ratio
						currentProp = (ABSVal + (this.ratio * (AESVal - ABSVal)));

						// Get the unit from either the ABS or AES property
						var unit = (this.extractUnit(this.ABS[prop]) || this.extractUnit(this.AES[prop]));
						// If we still don't have a unit, default is pixels
						currentProp = currentProp + (unit || "px");

						element.style[prop] = currentProp;
						break;
					default:
						currentProp = this.ABS[prop] + (this.ratio * (this.AES[prop] - this.ABS[prop]));

						element.style[prop] = currentProp;
				}
			}
		}, this);
	}
}

/**
 * Extracts unit from a string representing a value (i.e.: "10px" returns "px");
 * @method
 * @param {string} str - String we want to extract the unit from.
 */
ScrollingAnimation.prototype.extractUnit = function (str) {
	// Is the value a string? (user can write unitless non-string 0, which is a valid position value in CSS
	//	or even write a unitless non-string number expecting the default unit "px" to be applied)
	if (typeof str.substr !== 'undefined') {
		// What is the length of the part of the string that represent the value?
		var numberLength = parseFloat(str).toString().length;

		// Extract the unit part of the string
		return str.substr(numberLength);
	} else {
		return "";
	}
}

/**
 * Checks if the ABP and AES objects have the same keys (and nothing else)
 * @method
 * @param {object} obj1 - Animation state to be validated.
 * @param {object} obj2 - Animation state to be validated.
 */
ScrollingAnimation.prototype.validateAnimStates = function (obj1, obj2) {
	var keys1 = Object.keys(obj1);
	var keys2 = Object.keys(obj2);

	if (keys1.length === keys2.length) {
		return keys1.every( function (key) {
			if (keys2.indexOf(key) >= 0){
				return true;
			}
		});
	}

	return false;
}

/**
 * Checks the current animation ratio
 * @method
 */
ScrollingAnimation.prototype.checkRatio = function () {
	if (this.state === 0) {
		this.ratio = 0;
	} else if (this.state === 2){
		this.ratio = 1;
	} else {
		// Absolute positions of the BTP and ETP, and total distance between them
		var BTPPos;
		var ETPPos;
		var total;

		if (this.BTP.id) {
			// Accounts for the offset too, if there is one
			BTPPos = document.getElementById(this.BTP.id).getBoundingClientRect().top + this.BTP.posY + window.pageYOffset;
		} else {
			BTPPos = this.BTP.posY;
		}
		if (this.ETP.id) {
			// Accounts for the offset too, if there is one
			ETPPos = document.getElementById(this.ETP.id).getBoundingClientRect().top + this.ETP.posY + window.pageYOffset;
		} else {
			ETPPos = this.ETP.posY;
		}
		total = ETPPos - BTPPos;

		this.ratio = parseFloat(window.pageYOffset - BTPPos)/total;
	}
}

/**
 * Checks the current animation state
 * @method
 */
ScrollingAnimation.prototype.checkState = function () {
	// Check if we crossed the BTP
	// Are we using a DOM element or absolute position?
	if (this.BTP.id) {
		var BTPTop = document.getElementById(this.BTP.id).getBoundingClientRect().top;
		// Did we cross the BTP? (if we have posY, it's used as an offset)
		if (BTPTop <= (-this.BTP.posY)) {
			this.state = 1; // We will check later if we are actually in the state 2
		} else {
			this.state = 0;
		}
	} else {
		// Did we cross the BTP?
		if (window.pageYOffset >= this.BTP.posY) {
			this.state = 1; // We will check later if we are actually in the state 2
		} else {
			this.state = 0;
		}
	}
	// Check if we crossed the ETP
	// Are we using a DOM element or absolute position?
	if (this.ETP.id) {
		var ETPTop = document.getElementById(this.ETP.id).getBoundingClientRect().top;
		// Did we cross the ETP? (if we have posY, it's used as an offset)
		if (ETPTop <= (-this.ETP.posY)) {
			this.state = 2;
		}
	} else {
		// Did we cross the ETP?
		if (window.pageYOffset >= this.ETP.posY) {
			this.state = 2;
		}
	}

	if (this.config.killOnEnd && this.state === 2) {
		clearInterval(this.intervalID);
	}
}
