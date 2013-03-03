/**
 * @namespace commonwealth
 */
var commonwealth = commonwealth || {};

commonwealth.CLOSURE_ERROR = {message: "Anonymous function cannot be added this way."};


/**
 * An object with multiple states. Depending on the state of the
 * object, the object can appear to have multiple behaviors or properties.
 * When certain methods of a stateful object are called, control
 * is passed to the object stored in currentState.
 *
 * @param options An object used to set up the initial configuration of the
 *                Stateful object. An array called "methods" and an object called
 *                "states" can be passed in and will be parsed and added
 *                to the new object.
 */
commonwealth.Stateful = function Stateful (options) {
    var _ = commonwealth.util;

    /** The currentState of the object. */
    var currentState = null;

    this.states = {};

    // Create a history object
    if (!options || options.useHistory !== false ) {
        this.history = new commonwealth.History(this);
    }

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
            state = this.states[state];
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
    };

    // initialize the intance
    this.init(options);
};

commonwealth.Stateful.prototype.init = function init (options) {
    var methods,
        elem,
        method;

    if (options) {
        methods = options.methods;

        // Add the states from the options object to the stateful.
        commonwealth.util.extend(this.states, options.states);
    }

    if (methods)  {
        for (elem in methods) {
            method = methods[elem];
            if (commonwealth.util.isString(method)) {
                this.addStateMethod(method);
            } else if (commonwealth.util.isFunction (method)) {
                if (method.name && method.name !== "") {
                    this.addStateMethod(method.name, method);
                } else if (isNaN(parseInt(elem, 10))) {
                    this.addStateMethod(elem, method);
                } else {
                    // function was anonymous.
                    // throw an error because they can't be
                    // mapped to anything.
                    throw commonwealth.CLOSURE_ERROR;
                }
            } else {
                defaultFunc = method.defaultFunc || null;
                if (method.name && commonwealth.util.isString(method.name)) {
                    this.addStateMethod(method.name, defaultFunc);
                }
            }
            // else failed to add a method.
        }
    }
};

/**
 * Register a method to be handled by the stateful object's current
 * state (or by itself).
 *
 * @param methodName_or_defaultFunc The name of the function to
                                    register. Can also be the
                                    defaultFunc parameter.
 * @param defaultFunc (optional) A default function that will be run
 *                    by the stateful object itself if there is none
 *                    defined in the current state.
 */
commonwealth.Stateful.prototype.addStateMethod = function addStateMethod (methodName_or_defaultFunc, defaultFunc) {
    var methodName;
    // determine if the method name is the first parameter or
    // if it's the default function.
    if (commonwealth.util.isFunction(methodName_or_defaultFunc)) {
        defaultFunc = methodName_or_defaultFunc;
        methodName = defaultFunc.name;
        if (methodName === "") {
            throw commonwealth.CLOSURE_ERROR;
        }
    } else {
        methodName = methodName_or_defaultFunc;
    }

    this[methodName] = function() {
        var state = this.getCurrentState(),
            result = null;

        if (state && commonwealth.util.isFunction(state[methodName])) {
            result = state[methodName].apply(state, arguments);
        } else if (defaultFunc) {
            result = defaultFunc.apply(this, arguments);
        } else {
            // console.log("No method found called " + methodName + " in this state and no default method defined.");
        }

        return result;
    };
};

/**
* Register a State object with the stateful.
* These states are added to the stateful object's `state` property (a hash).
*/
commonwealth.Stateful.prototype.addState = function addState (name, state) {
    this.states[name] = state;
};


////////// HISTORY ////////////

/**
 * Stateful history object.
 * Responsible for recording references to the past states of a stateful
 * object.
 * @param stateful A reference to the stateful object that this history represents.
 */
commonwealth.History = function History (stateful) {

    this.getStateful = function getStateful () {
        return stateful;
    };

    this.previousState = null;
    this.states = null;

    this.clear();
};

/**
* Erases the history. Doesn't change the current state.
*/
commonwealth.History.prototype.clear = function clear () {
    this.states = [];
};
/**
* Shortcut function to get the number of states stored in history.
*/
commonwealth.History.prototype.getLength = function getLength () {
    return this.states.length;
};
/**
* Adds a state to the history array.
* @param state The state to add.
*/
commonwealth.History.prototype.addState = function addState (state) {
    this.states.push(state);
    this.previousState = state;
};
/**
* Steps back by one state. Changes the current state of the stateful
* object.
*/
commonwealth.History.prototype.rewind = function rewind () {
  if (this.states.length > 1) {
    var stateful = this.getStateful(),
        state = this.states.pop();
    stateful.setCurrentState(state);
    // remove the state which was added back on when
    // setCurrentState() was called.
    this.states.pop();
  }
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