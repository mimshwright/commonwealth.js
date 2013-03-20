/**
 * @namespace commonwealth
 */
var commonwealth = commonwealth || {};

commonwealth.Stateful = function () {
	var _ = commonwealth.util;

	var currentState = null;
	this.states = {};

	this.currentState = function currentState (state) {
		if (state) {
			return this.setCurrentState(state);
		} else {
			return this.getCurrentState();
		}
	};

	/**
    * Returns the current state.
    */
    this.getCurrentState = function getCurrentState () {
        return currentState;
    };

    /**
    * Sets the current state and calls the appropriate
    * methods to enter and exit the state.
    */
    this.setCurrentState = function setCurrentState (state) {
        if (_.isString(state)) {
            state = this.getStateByName(state);
            if (!state) {
                throw {message: "The state you're trying to set can't be found in the list of states for " + this + "."};
            }
        }

        var oldState = currentState,
            newState = state;

        if ( newState != oldState) {
            if (oldState && _.isFunction(oldState["exit"])) {
                oldState.exit();
            }
            if (this.history) {
                this.history.addState(oldState);
            }
            currentState = newState;

            if (newState && _.isFunction(newState["enter"])) {
                newState.enter();
            }
        }
        return currentState;
    };
};

commonwealth.Stateful.prototype.getStateByName = function getStateByName (name) {
	return this.states[name];
};

commonwealth.Stateful.prototype.addSubstate = function addSubstate (state) {
	var name = state.name;
	this.states[name] = state;
	return state;
};
commonwealth.Stateful.prototype.toString = function toString () {
    return "[object commonwealth.Stateful]";
};


/**
* Utility functions copied from Underscore.js
*/
commonwealth.util = {
    toString : Object.prototype.toString,
    isString : function(obj) { return this.toString.call(obj) === '[object String]'; },
    isNumber : function(obj) { return this.toString.call(obj) === '[object Number]'; },
    isFunction : function(obj) { return this.toString.call(obj) === '[object Function]'; },
    isArray : function(obj) { return this.toString.call(obj) === '[object Array]'; },
    extend : function(obj, sources) {
        var arg, source, prop;
        for (arg in arguments) {
            source = arguments[arg];
            if (source && source !== obj) {
                for (prop in source) {
                    obj[prop] = source[prop];
                }
            }
        }
        return obj;
    }
};