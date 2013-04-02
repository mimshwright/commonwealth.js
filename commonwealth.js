/**
 * @namespace commonwealth
 */
var commonwealth = commonwealth || {};


/**
 * An error thrown when a closure is used where a named function is expected.
 */
commonwealth.CLOSURE_ERROR = {message: "Anonymous function cannot be added this way."};

/**
 * An error thrown when a method is missing a required argument.
 */
commonwealth.ARGUMENT_ERROR = {message: "A required argument is missing."};

/**
 * An error thrown when a state name isn't valid.
 */
commonwealth.INVALID_STATE_ID_ERROR = {message: "The name of a state cannot be ''"};

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
 * @param [name] {string} The name (id) of this state.
 */
commonwealth.Stateful = function (name) {
    var _ = commonwealth.utils;

    /**
     * An hash of states that have been registered as
     * substates.
     * @type {object}
     */
    this.states = {};

    /**
     * A hash of transition maps.
     * @type {object}
     */
     this.transitions = {};

    /**
     * A name (id) for the state. This name will be used
     * when referring to the state by a string rather than
     * by reference.
     * @type {string}
     */
    this.name = name;

    /**
     * A reference to the history object for this Stateful.
     * The history object records the history of the different states
     * set on the Stateful object.
     * @type {commonwealth.History}
     */
    this.history = new commonwealth.History(this);

    /** @private */
    var currentState = null;
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

            if (this.history) {
                this.history.addState(oldState);
            }

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
 * @param [state] {string|commonwealth.Stateful} If supplied, the
 *        currentState is set to this value. If the value is a stateful
 *        object, that object is used. If the value is a string, the
 *        string is interpreted as a state name.
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
 * @throws Argument Error if there is no state_or_name argument.
 * @throws Invalid State ID Error if the name of the state provided is bogus.
 *
 * @param state_or_name {(commonwealth.Stateful|string)} The state to register or the name of a state to create.
 * @return {commonwealth.Stateful} A reference to the state object
 *         that was passed in or created.
 */
commonwealth.Stateful.prototype.addSubstate = function addSubstate (state_or_name) {
    var name, state;

    // If state is null or undefined, assign an auto-incremented name.
    if (!state_or_name) {
        throw commonwealth.ARGUMENT_ERROR;
    }

    // If state is a string, use it as the name of a new substate.
    if (commonwealth.utils.isString(state_or_name)) {
        name = state_or_name;
        state = new commonwealth.Stateful(name);
    }

    // Otherwise, assume it's a state object.
    else {
        state = state_or_name;
        name = state.name;
        if (name === "") {
            throw commonwealth.INVALID_STATE_ID_ERROR;
        }
    }

    this.states[name] = state;
    return state;
};

/**
 * Adds a substate and sets it as the current state in one fell swoop!
 *
 * @see commonwealth.Stateful#addSubstate
 * @see commonwealth.Stateful#setCurrentState
 *
 * @this {commonwealth.Stateful}
 * @param state {!(commonwealth.Stateful|string)} See addSubstate();
 * @return {commonwealth.Stateful} The current state.
 */
commonwealth.Stateful.prototype.addCurrentState = function addCurrentState (state) {
    state = this.addSubstate(state);
    this.setCurrentState(state);
    return state;
};

/**
 * Returns the state one higher in the chain. If state A uses
 * setCurrentState() on state B, B.parentState() points to A.
 * If there is no parent state, returns null.
 *
 * @this {commonwealth.Stateful}
 * @return {?commonwealth.Stateful} The parent state of this or null.
 */
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
 * Registers a method to be handled by the stateful object's current
 * state. When the method is called, the currentState() is checked to see
 * if it has an implementation of the method. This check cascades up the chain
 * to all subclass ancestors until the first one with the method defined is found.
 * If the method is never found in a subclass, the default method is called instead.
 * If the function has a function defined on it named `before` or `after`, that function
 * is called before or after the main function is called (regardless of what subclass
 * is ultimately used).
 *
 * @param methodName_or_defaultFunction The name of the function to register, or a defaultFunction with a name.
 * @param [defaultFunction] A function to be called as the default if there is nothing defined in the substate.
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

    return method;
};

commonwealth.Stateful.prototype.addTransition = function (transition, map) {
    var state;

    this.transitions[transition] = map;

    this.addStateMethod(transition, function () {
        for (var key in map) {
            state = map[key];
            if (key === "*" || this.getStateByName(key) == this.getCurrentState()) {
                this.setCurrentState(state);
                return;
            }
        }
    });

};

commonwealth.Stateful.prototype.dispatch = function (transition) {
    var map = this.transitions[transition],
        state,
        key;

    for (key in map) {
        state = map[key];
        if (key === "*" || this.getStateByName(key) === this.getCurrentState()) {
            this.setCurrentState(state);
            return;
        }
    }

    // todo: make it work in nested situations.
};

//// CONVERSION METHODS

/**
 * Standard implementation of toString() that returns the object type.
 *
 * @returns {string}
 */
commonwealth.Stateful.prototype.toString = function toString () {
    return "[object commonwealth.Stateful]";
};

/**
 * Returns an array of Stateful objects for the given object starting
 * with the object's root state and extending to the finalCurrentState.
 *
 * @returns {array}
 */
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
* @namespace
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


////////// HISTORY ////////////

/**
 * Stateful history object.
 * Responsible for recording references to the past states of a stateful
 * object.
 *
 * @constructor
 *
 * @this {commonwealth.History}
 *
 * @param stateful {commonwealth.Stateful} A reference to the stateful object that this history represents.
 */
commonwealth.History = function History (stateful) {

    /**
     * Returns a reference to the stateful for which the history is recorded.
     * @returns {commonwealth.Stateful}
     */
    this.getStateful = function getStateful () {
        return stateful;
    };

    /**
     * An array representing the history of current states in a Stateful object.
     * @type {array}
     */
    this.states = null;

    // initialize the object.
    this.clear();
};

/**
 * The previous state in the history.
 * @returns {commonwealth.Stateful}
 */
commonwealth.History.prototype.getPreviousState = function getPreviousState() {
    return this.states[this.states.length - 1];
};

/**
 * Erases the history. Doesn't change the current state.
 *
 * @this {commonwealth.History}
 */
commonwealth.History.prototype.clear = function clear () {
    this.states = [];
};

/**
 * Shortcut function to get the number of states stored in history.
 *
 * @this {commonwealth.History}
 */
commonwealth.History.prototype.getLength = function getLength () {
    return this.states.length;
};

/**
 * Adds a state to the history array.
 *
 * @this {commonwealth.History}
 *
 * @param state {commonwealth.Stateful} The state to add.
 */
commonwealth.History.prototype.addState = function addState (state) {
    this.states.push(state);
};

/**
 * Rolls back the state changes. Changes the current state of the stateful
 * object by the specified number of steps.
 *
 * @this {commonwealth.History}
 *
 * @param [steps] {number} The number of steps to go back. Default is 1.
 */
commonwealth.History.prototype.rewind = function rewind (steps) {
    var state, stateful;

    steps = steps || 1;
    steps = Math.min(Math.max(1, steps), this.states.length);

    if (this.states.length > 1) {
        stateful = this.getStateful();
        while (steps-- > 0) {
            state = this.states.pop();
        }
        stateful.setCurrentState(state);
        // remove the state which was added back on when
        // setCurrentState() was called.
        this.states.pop();
    }
};

/**
 * Standard implementation of toString() that returns the object type.
 *
 * @returns {string}
 */
commonwealth.History.prototype.toString = function toString () {
    return "[object commonwealth.History]";
};