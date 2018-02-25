/*

The ControlledObjects (CO) is either a single "id" pointing to the object to be animated or
an array of "id's" pointing to all the objects to be animated. Internally, those will be stored
inside an array and then converted to the actuall DOM elements to avoid the costy use of
document.getElementById().

The AnimationBeginningState (ABS) is an object including the state of the Controlled Object in the 
beginning of the animation. i.e.: { left: "-100px", opacity: "0" }

The AnimationEndingState (AES) is an object including the state of the Controlled Object in the
end of the animation. i.e.: { left: "0", opacity: "1" }

The BeginningTriggeringPoint (BTP) is an object including two keys: "id" and "posY". If the "ID"
field is set the "posY" field is ignored, and the DOM object with the id is used as the
BTP reference. If "id" is null, "posY" (px) is used instead. i.e.: { id: null, posY: 400 }

The EndingTriggeringPoint (ETP) is an object including two keys: "id" and "posY". If the "ID"
field is set the "posY" field is ignored, and the DOM object with the id is used as the
ETP reference. If "id" is null, "posY" (px) is used instead. i.e.: { id: "anchor", posY: null }

The state is used to check the current animation state.
	0 = Inactive
	1 = Active
	2 = Done

*/

var ScrollingAnimation = function (ControlledObjects, AnimationBeginningState, AnimationEndingState, BeginningTriggeringPoint, EndingTriggeringPoint) {
	// Get the controlled objects, which will converted to an array with all the IDs if necessary:
	this.CO = ControlledObjects instanceof Array ? ControlledObjects.slice() : [ControlledObjects];
	// Convert the string IDs to DOM elements (requires Polyfill for Browsers < IE9)
	this.CO = this.CO.map(function(element){
		return document.getElementById(element);
	});

	// Get the animation beginning and ending states
	this.ABS = Object.assign({}, AnimationBeginningState);
	this.AES = Object.assign({}, AnimationEndingState);
	if (this.validateAnimStates(this.ABS, this.AES) === false) {
		console.error("[ScrollingAnimation] Error: The animation state objects have unmatched keys!");
		return null;
	}

	// Creates an array with the state of each CO and initialize the values
	this.COState = this.CO.map(function(element){
		var state = Object.assign({}, AnimationBeginningState); // Create the state (values don't matter here because we will change them)
		for(prop in state){
			state[prop] = element.style[prop]; // Get the initial values from the DOM element CSS
		}
		return state;
	});

	// Get the beginning and ending triggers
	this.BTP = Object.assign({id: null, posY: 0}, BeginningTriggeringPoint);
	this.ETP = Object.assign({id: null, posY: 0}, EndingTriggeringPoint);

	// Initial state and ratio
	this.state = 0;
	this.ratio = 0; // The ratio of the current position in relation to BTP and ETP

	//Bind methods
	this.checkState = this.checkState.bind(this);
	this.checkRatio = this.checkRatio.bind(this);
	this.updateStyle = this.updateStyle.bind(this);

	//Later change for animation frames
	setInterval(this.checkState, 16);
	setInterval(this.checkRatio, 16);
	setInterval(this.updateStyle, 16);
}

// Updates the style for each Controlled Object
ScrollingAnimation.prototype.updateStyle = function(){
	if (this.state === 0){
		// Style matches the ABS
		this.CO.forEach(function(element, index){
			var changedState = false; // Has the state changed?
			var newState = Object.assign({}, this.ABS); // Initial values don't matter, we will change them.

			for (prop in this.ABS){
				var appendPx = false;
				if (prop === "left" || prop === "right" || prop === "top" || prop === "bottom"){
					appendPx = true;
				}
				newState[prop] = appendPx ? this.ABS[prop] + "px" : this.ABS[prop];

				// Has at least some property in the state changed?
				if (newState[prop] !== this.COState[index][prop]) {
					changedState = true;
				}
			}

			if (changedState){
				for (prop in newState){
					element.style[prop] = newState[prop];
					this.COState[index][prop] = newState[prop];
				}
			}
		}, this);

	} else if (this.state === 2){
		// Style matches the AES
		this.CO.forEach(function(element, index){
			var changedState = false; // Has the state changed?
			var newState = Object.assign({}, this.ABS); // Initial values don't matter, we will change them.

			for (prop in this.AES){
				var appendPx = false;
				if (prop === "left" || prop === "right" || prop === "top" || prop === "bottom"){
					appendPx = true;
				}
				newState[prop] = appendPx ? this.AES[prop] + "px" : this.AES[prop];

				// Has at least some property in the state changed?
				if (newState[prop] !== this.COState[index][prop]) {
					changedState = true;
				}
			}

			if (changedState){
				for (prop in newState){
					element.style[prop] = newState[prop];
					this.COState[index][prop] = newState[prop];
				}
			}
		}, this);
	} else {
		// Style is between ABS and AES
		this.CO.forEach(function(element, index){
			var changedState = false; // Has the state changed?
			var newState = Object.assign({}, this.ABS); // Initial values don't matter, we will change them.

			for (prop in this.AES){
				var appendPx = false;
				if (prop === "left" || prop === "right" || prop === "top" || prop === "bottom"){
					appendPx = true;
				}
				var finalValue = this.ABS[prop] + (this.ratio * (this.AES[prop] - this.ABS[prop]));
				newState[prop] = appendPx ? finalValue + "px" : finalValue;

				// Has at least some property in the state changed?
				if (newState[prop] !== this.COState[index][prop]) {
					changedState = true;
				}
			}

			if (changedState){
				for (prop in newState){
					element.style[prop] = newState[prop];
					this.COState[index][prop] = newState[prop];
				}
			}
		}, this);
	}
}

// Checks if the ABP and AES objects have the same keys (and nothing else)
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

// Checks the current animation ratio
ScrollingAnimation.prototype.checkRatio = function () {
	if (this.state === 0) {
		this.ratio = 0;
	} else if (this.state === 2){
		this.ratio = 1;
	} else {
		// Are we using a DOM element or absolute position?
		if (this.BTP.id) {
			var elStartRect = document.getElementById(this.BTP.id).getBoundingClientRect();
			var elEndRect = document.getElementById(this.ETP.id).getBoundingClientRect();
			var total = elEndRect.top - elStartRect.top;

			this.ratio = parseFloat(Math.abs(elStartRect.top))/total;
		} else {
			var total = this.ETP.posY - this.BTP.posY;

			this.ratio = parseFloat(window.pageYOffset - this.BTP.posY)/total;
		}
	}
}

// Checks the current animation state
ScrollingAnimation.prototype.checkState = function () {
	// Check if we crossed the BTP
	// Are we using a DOM element or absolute position?
	if (this.BTP.id) {
		var el = document.getElementById(this.BTP.id);
		var elRect = el.getBoundingClientRect();
		//Did we cross the BTP?
		if (elRect.top <= 0) {
			this.state = 1; //We will check later if we are actually in the state 2
		} else {
			this.state = 0;
		}
	} else {
		//Did we cross the BTP?
		if (window.pageYOffset >= this.BTP.posY) {
			this.state = 1; //We will check later if we are actually in the state 2
		} else {
			this.state = 0;
		}
	}
	// Check if we crossed the ETP
	// Are we using a DOM element or absolute position?
	if (this.ETP.id) {
		var el = document.getElementById(this.ETP.id);
		var elRect = el.getBoundingClientRect();
		//Did we cross the ETP?
		if (elRect.top <= 0) {
			this.state = 2;
		}
	} else {
		//Did we cross the ETP?
		if (window.pageYOffset >= this.ETP.posY) {
			this.state = 2;
		}
	}
}
