/**
 * @namespace commonwealth
 */
var commonwealth = commonwealth || {};

commonwealth.Stateful = function (name) {
    var _ = commonwealth.util;

    var currentState = null;
    this._parentState = this;
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
            // if (oldState && _.hasMethod(oldState, "exit") ) {
            //     oldState.exit();
            // }
            if (oldState) {
                oldState._parentState = oldState;
            }

            currentState = newState;

            if (newState) {
                newState._parentState = this;
            }

            // if (newState && _.hasMethod(newState, "enter") ) {
            //     newState.enter();
            // }
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
    if (this.currentState() === null) { return this; }
    return this.currentState().finalCurrentState();
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
    if (parentState === this) {
        return this;
    } else {
        return parentState.parentState();
    }
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
    hasMethod: function (obj, method) { return this.isFunction(obj[method]); },
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