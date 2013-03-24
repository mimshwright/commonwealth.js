/**
 * @namespace commonwealth
 */
var commonwealth = commonwealth || {};

commonwealth.Stateful = function (name) {
    var _ = commonwealth.utils;

    var currentState = null;
    this._parentState = null;
    this.states = {};
    this.name = name;

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
    this.setCurrentState = function setCurrentState (newState) {
        var oldState = currentState;

        if (_.isString(newState)) {
            newState = this.getStateByName(newState);
            if (!newState) {
                throw {message: "The state you're trying to set can't be found in the list of states for " + this + "."};
            }
        }

        if ( newState != oldState) {
            if (oldState) {
                if (_.hasMethod(oldState, "exit")) {
                    oldState.exit();
                }
                oldState._parentState = null;
            }

            currentState = newState;

            if (newState) {
                newState._parentState = this;
                if (_.hasMethod(newState, "enter")) {
                    newState.enter();
                }
            }
        }
        return currentState;
    };
};

commonwealth.Stateful.prototype.currentState = function currentState (state) {
    if (state) {
        return this.setCurrentState(state);
    } else {
        return this.getCurrentState();
    }
};

commonwealth.Stateful.prototype.finalCurrentState = function finalCurrentState() {
    var currentState = this.getCurrentState();
    if (currentState === null) {
        return this;
    }
    return currentState.finalCurrentState();
};

commonwealth.Stateful.prototype.getStateByName = function getStateByName (name) {
    return this.states[name];
};

commonwealth.Stateful.prototype.addSubstate = function addSubstate (state) {
    var name = state.name;
    this.states[name] = state;
    return state;
};
commonwealth.Stateful.prototype.parentState = function parentState () {
    return this._parentState;
};
commonwealth.Stateful.prototype.rootState = function rootState () {
    var parentState = this.parentState();
    if (parentState === null) {
        return this;
    }
    return parentState.rootState();
};

/**
 * Register a method to be handled by the stateful object's current
 * state.
 *
 * @param methodName The name of the function to register.
 */
commonwealth.Stateful.prototype.addStateMethod = function addStateMethod (methodName) {
    // Check to see if the state already has the method.
    if (commonwealth.utils.hasMethod(this, methodName) === false) {
        this[methodName] = function() {
            var state = this.getCurrentState(),
                result = null;

            if (commonwealth.utils.hasMethod(state, methodName)) {
                result = state[methodName].apply(state, arguments);
            }
            // else if (defaultFunc) {
            //    result = defaultFunc.apply(this, arguments);
            //} else {
                // console.log("No method found called " + methodName + " in this state and no default method defined.");
            //}

            return result;
        };
    }

    for (var i in this.states) {
        var state = this.states[i];
        state.addStateMethod(methodName);
    }
};

//// CONVERSION METHODS

commonwealth.Stateful.prototype.toString = function toString () {
    return "[object commonwealth.Stateful]";
};

commonwealth.Stateful.prototype.stateChainToArray = function stateChainToArray () {
    var state = this.rootState(),
        array = [];

    while (state !== null) {
        array.push(state);
        state = state.getCurrentState();
    }
    return array;
};


/**
* Utility functions copied from Underscore.js
*/
commonwealth.utils = {
    toString : Object.prototype.toString,
    isString : function(obj) { return this.toString.call(obj) === '[object String]'; },
    isNumber : function(obj) { return this.toString.call(obj) === '[object Number]'; },
    isFunction : function(obj) { return this.toString.call(obj) === '[object Function]'; },
    isArray : function(obj) { return this.toString.call(obj) === '[object Array]'; },
    hasMethod: function (obj, method) { return obj !== null && this.isFunction(obj[method]); },
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