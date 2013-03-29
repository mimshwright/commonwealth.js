/**
 * @namespace commonwealth
 */
var commonwealth = commonwealth || {};

/**
 * Stateful is the main class in commonwealth. It represents an
 * object that is both a stateful (having states) and a state.
 * It is a composite state object.
 * For example, this may represent the backend for a login button
 * that contains two states, loggedIn and loggedOut which are also
 * both instances of Stateful.
 *
 * @constructor
 * @this {commonwealth.Stateful}
 *
 * @param name {string} [optional] The name (id) of this state.
 */
commonwealth.Stateful = function (name) {
    var _ = commonwealth.utils;

    var currentState = null;
    this.states = {};
    this.name = name;

    /** @private */
    this._stateID = 0;
    /** @private */
    this._parentState = null;

    /**
    * Returns the current state.
    *
    * @return {commonwealth.Stateful}
    */
    this.getCurrentState = function getCurrentState () {
        return currentState;
    };

    /**
    * Sets the current state and calls the appropriate
    * methods to enter and exit the state.
    *
    * @this {commonwealth.Stateful}
    *
    * @param newState {(string|commonwealth.Stateful)}
    *        The new current state or it's name only.
    * @return {commonwealth.Stateful} Returns the currentState just set.
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

/**
 * Combination getter/setter for currentState using the JQuery style.
 *
 * @this {commonwealth.Stateful}
 *
 * @param {string|commonwealth.Stateful} [Optional] If supplied, the
 *        currentState is set to this value.
 * @return {commonwealth.Stateful} The current state or null.
 */
commonwealth.Stateful.prototype.currentState = function currentState (state) {
    if (state) {
        return this.setCurrentState(state);
    } else {
        return this.getCurrentState();
    }
};

/**
 * Gets the most distant ancestor of this state which is not null
 * or returns `this`.
 *
 * @this {commonwealth.Stateful}
 *
 * @return {commonwealth.Stateful}
 */
commonwealth.Stateful.prototype.finalCurrentState = function finalCurrentState() {
    // TODO: rename this
    var currentState = this.getCurrentState();
    if (currentState === null) {
        return this;
    }
    return currentState.finalCurrentState();
};

/**
 * Gets a substate of a stateful object based on the name property of that state.
 *
 * @this {commonwealth.Stateful}
 *
 * @return {commonwealth.Stateful}
 */
commonwealth.Stateful.prototype.getStateByName = function getStateByName (name) {
    return this.states[name];
};

/**
 * Registers a state as a substate of the Stateful object.
 * If one doesn't exist, it automatically creates it and assigns it
 * the name parameter.
 *
 * @param state {(commonwealth.Stateful|string)}
 * @return {commonwealth.Stateful} A reference to the state object
 *         that was passed in or created.
 */
commonwealth.Stateful.prototype.addSubstate = function addSubstate (state) {
    var name;

    // If state is null or undefined, assign an auto-incremented name.
    if (!state) {
        state = "state" + this._stateID++;
    }

    // If state is a string, use it as the name of a new substate.
    if (commonwealth.utils.isString(state)) {
        name = state;
        state = new commonwealth.Stateful(name);
    }

    // Otherwise, assume it's a state object.
    else {
        name = state.name;
    }

    this.states[name] = state;
    return state;
};
commonwealth.Stateful.prototype.addCurrentState = function addCurrentState (state) {
    state = this.addSubstate(state);
    this.setCurrentState(state);
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
 * @param methodName_or_defaultFunction The name of the function to register, or a defaultFunction with a name.
 * @param defaultFunction [optional] A function to be called as the default if there is nothing defined in the substate.
 */
commonwealth.Stateful.prototype.addStateMethod = function addStateMethod (methodName_or_defaultFunction, defaultFunction) {
    var methodName,
        _ = commonwealth.utils;

    // determine if the method name is the first parameter or
    // if it's the default function.
    if (_.isString(methodName_or_defaultFunction)) {
        methodName = methodName_or_defaultFunction;
        // defaultFunction pulls from second arg if available
    } else if (_.isFunction(methodName_or_defaultFunction)) {
        defaultFunction = methodName_or_defaultFunction;
        if (defaultFunction.name === "") {
            throw commonwealth.CLOSURE_ERROR;
        }
        methodName = defaultFunction.name;
    }

    // Check to see if the state already has the method.
    if (_.hasMethod(this, methodName) === false) {
        this[methodName] = function() {

            var iterator = this.getCurrentState(),
                result = null,
                before = this[methodName].before,
                defaultFunction = this[methodName].defaultFunction,
                after = this[methodName].after,
                firstStateWithMethodDefined = null,
                state;

            // check currentState for function, if not present, forward to it's currentState until null is reached.
            while (iterator && !firstStateWithMethodDefined) {
                if (_.hasMethod(iterator, methodName)) {
                    firstStateWithMethodDefined = iterator;
                } else {
                    iterator = iterator.getCurrentState();
                }
            }

            state = firstStateWithMethodDefined;

            // Call the before function if defined.
            if (_.isFunction(before)) {
                before.apply(this, arguments);
            }

            if (state) {
                result = state[methodName].apply(state, arguments);
            }
            else if (defaultFunction) {
                result = defaultFunction.apply(this, arguments);
            }
            // else {
                // console.log("No method found called " + methodName + " in this state and no default method defined.");
            //}

            // Call the after function if defined.
            if (_.isFunction(after)) {
                after.apply(this, arguments);
            }

            return result;
        };
    }

    var method = this[methodName];
    if (method && defaultFunction) {
        method.defaultFunction = defaultFunction;
    }

    // for (var i in this.states) {
    //     var state = this.states[i];
    //     state.addStateMethod(methodName);
    // }

    return method;
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

/**
 * An error thrown when a closure is used where a named function is expected.
 */
commonwealth.CLOSURE_ERROR = {message: "Anonymous function cannot be added this way."};