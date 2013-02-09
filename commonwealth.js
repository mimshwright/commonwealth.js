var commonwealth = commonwealth || {};

commonwealth.Stateful = function Stateful (options) {
    var currentState = null;

    if (options && options.useHistory !== false ) {
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
        var oldState = currentState,
            newState = state;

        if ( newState != oldState) {
            if (oldState && commonwealth.util.isFunction(oldState["exit"])) {
                oldState.exit();
            }
            if (this.history) {
              this.history.addState(oldState);
            }
            currentState = newState;

            if (newState && commonwealth.util.isFunction(newState["enter"])) {
                newState.enter();
            }
        }

    };

    // initialize the intance
    this.init(options);
};

commonwealth.Stateful.prototype.init = function init (options) {
  var methods = options.methods,
      elem,
      method;

  // Add the states from the options object to the stateful.
  commonwealth.util.extend(this, options.states);

  if (methods && commonwealth.util.isArray(methods))  {
      for (elem in methods) {
          method = methods[elem];
          if (commonwealth.util.isString(method)) {
              this.addStateMethod(method);
          } else if (commonwealth.util.isFunction (method)) {
              if (method.name && method.name !== "") {
                  this.addStateMethod(method.name, method);
              } else {
                  // function was anonymous.
                  // throw an error because they can't be
                  // mapped to anything.
                  throw {message: "Anonymous function cannot be added this way."};
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

commonwealth.Stateful.prototype.addStateMethod = function addStateMethod (methodName, defaultFunc) {
    this[methodName] = function() {
        var state = this.getCurrentState(),
            result = null;

        if (state && commonwealth.util.isFunction(state[methodName])) {
            result = state[methodName].apply(state, arguments);
        } else if (defaultFunc) {
            result = defaultFunc.apply(this, arguments);
        } else {
            console.log("No method found called " + methodName + " in this state and no default method defined.");
        }

        return result;
    };
};

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
commonwealth.History.prototype.clear = function clear () {
    this.states = [];
};

commonwealth.History.prototype.addState = function addState (state) {
    this.states.push(state);
    this.previousState = state;
};



commonwealth.util = {
  toString : Object.prototype.toString,
  isString : function(obj) { return this.toString.call(obj) == '[object String]'; },
  isFunction : function(obj) { return this.toString.call(obj) == '[object Function]'; },
  isArray : function(obj) { return this.toString.call(obj) == '[object Array]'; },
  extend : function(obj, sources) {
    for (var arg in arguments) {
      var source = arguments[arg];
      if (source && source !== obj) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    }
    return obj;
  }
};