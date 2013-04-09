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
 * An error thrown when a circular reference.
 */
commonwealth.INFINITE_LOOP_ERROR = {message: "Adding this state would create a circular reference because it's already part of the state chain."};


/**
 * State is the main class in commonwealth. It represents an
 * object that is both a state container and a state.
 * It is a composite state object.
 * For example, this may represent the backend for a login button
 * that contains two states, loggedIn and loggedOut which are also
 * both instances of State.
 *
 * About JSON format:
 *
 * A json object can be passed into the constructor to create the
 * intial values for your state object. The format looks like this:
 * <pre>
{
    name: "string", // only required field
    states: {...},  // an object containing 1 or more states
                    // which follow the exact same syntax as this json object.
    defaultState: "stateName", // the name of a state to set as
                               // the default substate.
    resetOnEnter: true, // true or false. Sets the resetOnEnter property.
    methods: {...}, // 1 or more methods to add using #addStateMethod()
    transitions: {...}  // 1 or more transitions using the same syntax as
                        // #addTransition()
}
 *
 *
 * @constructor
 * @class
 * @this {commonwealth.State}
 *
 * @param [name_or_JSON] {string|object} The name (id) of this state or a json object used to set properties of the state.
 */
commonwealth.State = function (name_or_JSON) {
    var _ = commonwealth.utils,
        jsonUtil = _.jsonUtil,
        json;

    if ( !(this instanceof arguments.callee) ) {
        return new commonwealth.State(name_or_JSON);
    }

    /**
     * An hash of states that have been registered as
     * substates.
     * @member states {object}
     * @memberof commonwealth.State
     * @instance
     */
    this.states = {};

    /**
     * A name (id) for the state. This name will be used
     * when referring to the state by a string rather than
     * by reference.
     * @member name {string}
     * @memberof commonwealth.State
     * @instance
     */
    this.name = null;

    /**
     * Used in conjunction with resetOnEnter. The default substate
     * of the state.
     *
     * @member defaultState {string|commonwealth.State}
     * @memberof commonwealth.State
     * @instance
     */
    this.defaultState = null;

    /**
     * If true, the state will revert to its defaultState
     * when it is set as the currentState for a parent state.
     *
     * @member resetOnEnter {boolean}
     * @memberof commonwealth.State
     * @instance
     */
    this.resetOnEnter = false;

    /**
     * A reference to the history object for this State.
     * The history object records the history of the different states
     * set on the State object.
     *
     * @member history {commonwealth.History}
     * @memberof commonwealth.State
     * @instance
     */
    this.history = new commonwealth.History(this);

     /**
     * @private
     */
    this._currentState = null;

    /**
     * @private
     */
    this._parentState = null;

    /**
     * A hash of message handler maps.
     * @private
     */
    this._handlers = {};

    // check for optional parameters.
    if (name_or_JSON) {
        // parameter is the name of the object
        if (_.isString(name_or_JSON)) {
            this.name = name_or_JSON;
        } else {
            // parameter is json. parse json object.
            json = name_or_JSON;

            this.initWithJSON(json);
        }
    }
};


/**
 * Uses a json object to set properties on a state object.
 * Normally this is used automatically by passing a json object to the
 * constructor. It can be used after an object has been instantiated
 * but keep in mind that values may get overridden.
 *
 * @this {commonwealth.State}
 * @param json {object} See constructor for full documentation.
 */
commonwealth.State.prototype.initWithJSON = function initWithJSON(json) {
    return commonwealth.utils.jsonUtil.parseState(this, json);
};


/**
 * Returns the current state.
 *
 * @this {commonwealth.State}
 *
 * @return {commonwealth.State}
 */
commonwealth.State.prototype.getCurrentState = function getCurrentState () {
    return this._currentState;
};

/**
* Sets the current state and calls the appropriate
* methods to enter and exit the state.
*
* @this {commonwealth.State}
*
* @param newState {(string|commonwealth.State)}
*        The new current state or it's name only.
* @return {commonwealth.State} Returns the currentState just set.
*/
commonwealth.State.prototype.setCurrentState = function setCurrentState (newState) {
    var oldState = this._currentState,
        _ = commonwealth.utils;

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

        if (this.stateChainToArray().indexOf(newState) >= 0) {
            throw INFINITE_LOOP_ERROR;
        }

        this._currentState = newState;


        if (this.history) {
            this.history.addState(oldState);
        }

        if (newState) {
            newState._parentState = this;

            // reset the newState to default if desired.
            if (newState.resetOnEnter) {
                newState.setCurrentState(newState.defaultState);
            }
            if (_.hasMethod(newState, "enter")) {
                newState.enter();
            }
        }
    }
    return this._currentState;
};



/**
 * Combination getter/setter for currentState using the JQuery style.
 *
 * @this {commonwealth.State}
 *
 * @param [state] {string|commonwealth.State} If supplied, the
 *        currentState is set to this value. If the value is a state
 *        object, that object is used. If the value is a string, the
 *        string is interpreted as a state name.
 * @return {commonwealth.State} The current state or null.
 */
commonwealth.State.prototype.currentState = function currentState (state) {
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
 * @this {commonwealth.State}
 *
 * @return {commonwealth.State}
 */
commonwealth.State.prototype.finalCurrentState = function finalCurrentState() {
    // TODO: rename this
    var currentState = this.getCurrentState();
    if (currentState === null) {
        return this;
    }
    return currentState.finalCurrentState();
};

/**
 * Gets a substate of a state object based on the name property of that state.
 *
 * @this {commonwealth.State}
 *
 * @return {commonwealth.State}
 */
commonwealth.State.prototype.getStateByName = function getStateByName (name) {
    return this.states[name];
};

/**
 * Registers a state as a substate of the State object.
 * If one doesn't exist, it automatically creates it and assigns it
 * the name parameter.
 *
 * @throws Argument Error if there is no state_or_name argument.
 * @throws Invalid State ID Error if the name of the state provided is bogus.
 *
 * @param state_or_name {(commonwealth.State|string)} The state to register or the name of a state to create.
 * @return {commonwealth.State} A reference to the state object
 *         that was passed in or created.
 */
commonwealth.State.prototype.addSubstate = function addSubstate (state_or_name) {
    var name, state;

    // If state is null or undefined, assign an auto-incremented name.
    if (!state_or_name) {
        throw commonwealth.ARGUMENT_ERROR;
    }

    // If state is a string, use it as the name of a new substate.
    if (commonwealth.utils.isString(state_or_name)) {
        name = state_or_name;
        state = new commonwealth.State(name);
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
 * @see commonwealth.State#addSubstate
 * @see commonwealth.State#setCurrentState
 *
 * @this {commonwealth.State}
 * @param state {!(commonwealth.State|string)} See addSubstate();
 * @return {commonwealth.State} The current state.
 */
commonwealth.State.prototype.addCurrentState = function addCurrentState (state) {
    state = this.addSubstate(state);
    this.setCurrentState(state);
    return state;
};

/**
 * Returns the state one higher in the chain. If state A uses
 * setCurrentState() on state B, B.parentState() points to A.
 * If there is no parent state, returns null.
 *
 * @this {commonwealth.State}
 * @return {?commonwealth.State} The parent state of this or null.
 */
commonwealth.State.prototype.parentState = function parentState () {
    return this._parentState;
};
commonwealth.State.prototype.rootState = function rootState () {
    var parentState = this.parentState();
    if (parentState === null) {
        return this;
    }
    return parentState.rootState();
};

/**
 * Registers a method to be handled by the state object's current
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
commonwealth.State.prototype.addStateMethod = function addStateMethod (methodName_or_defaultFunction, defaultFunction) {
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

/**
 * Dispatches a message to all of the children in the state chain.
 *
 * @this {commonwealth.State}
 *
 * @param message {string} A message that is broadcast.
 */
commonwealth.State.prototype.dispatch = function (message) {
    var handlers = this._handlers[message],
        handler,
        current;

    for (var i in handlers) {
        handler = handlers[i];
        if (handler && commonwealth.utils.isFunction(handler)) {
            handler.call(this, message);
        }
    }

    // Bubble events up to substates
    current = this.currentState();
    if (current) {
        current.dispatch(message);
    }
};

/**
 * Registers a function that is called when a signal is dispatched
 * using dispatch().
 *
 * @this {commonwealth.State}
 *
 * @param signal {string} The message to respond to.
 * @param handler {function} The function to call when the message is 
 *                           dispatched.
 */
commonwealth.State.prototype.on = function on (signal, handler) {
    if (!this._handlers[signal]) {
        this._handlers[signal] = [];
    }
    this._handlers[signal].push(handler);
};

/**
 * Registers a one or more state changes that occur when a message is
 * dispatched using dispatch(). Also, this automatically registers a
 * method that dispatches the event for you (using addStateMethod()).
 * Once a transition is registered, you can use either dispatch() or
 * the generated method to transition.
 * e.g. dispatch("foo"); or foo();
 *
 * The map of state changes is an object with names of states paired
 * with the state they should change to when the transition event is
 * dispatched. "*" can be used on the left side to match any state.
 * `null` can be used to transition TO "no state" and the string "null"
 * can be used to transition FROM the null state.
 *
 * @this {commonwealth.State}
 *
 * @param transition {string} The name of the transition to register.
 * @param map {object} An object with mappings of states to transition
 *                     to and from.
 * @return The method created for transitioning.
 */
commonwealth.State.prototype.addTransition = function (transition, map) {
    var stateChangeFunc = function (transition) {
        var state,
            key;

        for (key in map) {
            state = map[key];
            if (key === "*" || // if the key is *, transition from any state.
                this.getStateByName(key) === this.getCurrentState() || // other wise states have to match.
                key === "null" && !this.getCurrentState() // special case for null, use "null"
                ) {
                this.setCurrentState(state);
                return;
            }
        }
    };

    this.on(transition, stateChangeFunc);

    return stateChangeFunc;
};

//// CONVERSION METHODS

/**
 * Standard implementation of toString() that returns the object type.
 *
 * @returns {string}
 */
commonwealth.State.prototype.toString = function toString () {
    return "[object commonwealth.State]";
};

/**
 * Returns an array of State objects for the given object starting
 * with the object's root state and extending to the finalCurrentState.
 *
 * @returns {array}
 */
commonwealth.State.prototype.stateChainToArray = function stateChainToArray () {
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
    },

    /**
     * @class
     * @private
     */
    jsonUtil : {
        /**
         * @static
         */
        parseName : function parseName(json) {
            if (json && commonwealth.utils.isString(json.name)) {
                return json.name;
            } else {
                throw commonwealth.INVALID_STATE_ID_ERROR;
            }
        },
        /**
         * @static
         */
        parseDefaultState: function parseDefaultState(json) {
            if (json && commonwealth.utils.isString(json.defaultState)) {
                return json.defaultState;
            }
        },
        /**
         * @static
         */
        parseEnterFunction: function parseEnterFunction(json) {
            if (json && commonwealth.utils.isFunction(json.enter)) {
                return json.enter;
            }
            return null;
        },
        /**
         * @static
         */
        parseExitFunction: function parseExitFunction(json) {
            if (json && commonwealth.utils.isFunction(json.exit)) {
                return json.exit;
            }
            return null;
        },
        /**
         * @static
         */
        parseMethods: function parseMethods(state, json) {
            var name, method;
            if (json && json.methods) {
                for (name in json.methods) {
                    method = json.methods[name];
                    state.addStateMethod(name, method);
                }
            }
        },
        /**
         * @static
         */
        parseStates: function parseStates(state, json) {
            var stateJSON, substate;

            if (json && json.states) {
                for (var name in json.states) {
                    stateJSON = json.states[name];
                    substate = new commonwealth.State(stateJSON);
                    state.addSubstate(substate);
                }
            }
        },
        /**
         * @static
         */
        parseState: function parseState(state, json) {
            var name, methods, method, states, substate,
                message;

            state.name = this.parseName(json);
            state.enter = this.parseEnterFunction(json);
            state.exit = this.parseExitFunction(json);

            // more complex recursive parsing.
            this.parseMethods(state, json);
            this.parseStates(state,json);

            for (message in json.transitions) {
                state.addTransition(message, json.transitions[message]);
            }
            state.setCurrentState(this.parseDefaultState(json));
            state.defaultState = state.getCurrentState();
            state.resetOnEnter = json.resetOnEnter;
        }
    }
};

////////// HISTORY ////////////

/**
 * State history object.
 * Responsible for recording references to the past states of a state
 * object.
 *
 * @constructor
 *
 * @this {commonwealth.History}
 *
 * @param state {commonwealth.State} A reference to the state object that this history represents.
 */
commonwealth.History = function History (state) {

    /**
     * Returns a reference to the state for which the history is recorded.
     * @returns {commonwealth.State}
     */
    this.getState = function getState () {
        return state;
    };

    /**
     * An array representing the history of current states in a State object.
     * @type {array}
     */
    this.states = null;

    // initialize the object.
    this.clear();
};

/**
 * The previous state in the history.
 * @returns {commonwealth.State}
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
 * @param state {commonwealth.State} The state to add.
 */
commonwealth.History.prototype.addState = function addState (state) {
    this.states.push(state);
};

/**
 * Rolls back the state changes. Changes the current state of the state
 * object by the specified number of steps.
 *
 * @this {commonwealth.History}
 *
 * @param [steps=1] {number} The number of steps to go back. Default is 1.
 */
commonwealth.History.prototype.rewind = function rewind (steps) {
    var substate, state;

    steps = steps || 1;
    steps = Math.min(Math.max(1, steps), this.states.length);

    if (this.states.length > 1) {
        state = this.getState();
        while (steps-- > 0) {
            substate = this.states.pop();
        }
        state.setCurrentState(substate);
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