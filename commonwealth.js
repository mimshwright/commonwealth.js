// var _ = require("./underscore");
var commonwealth = commonwealth || {};

commonwealth.Stateful = function Stateful (options) {
    var currentState = null,
    that = this;
        
    _(this).extend(options.states);
    
    this.previousState = null;
    
    /**
    * Returns the current state.
    */
    this.getCurrentState = function getCurrentState () {
        return currentState;
    }

    /**
    * Sets the current state and calls the appropriate 
    * methods to enter and exit the state.
    */
    this.setCurrentState = function setCurrentState (state) {
        var oldState = currentState,
            newState = state;

        if (oldState && _.isFunction(oldState["exit"])) {
            oldState.exit();
        }
        this.previousState = oldState;
        currentState = newState;

        if (newState && _.isFunction(newState["enter"])) {
            newState.enter();
        }
    }
    
    // initialize the intance
    this.init(options);
}

commonwealth.Stateful.prototype.init = function (options) {
  var methods = options.methods,
      elem, 
      method;

  if (methods && _.isArray(methods))  {
      for (elem in methods) {
          method = methods[elem];
          if (_.isString(method)) {
              this.addStateMethod(method);
          } else if (_.isFunction (method)) {
              if (method.name && method.name != "") {
                  this.addStateMethod(method.name, method);
              } else { 
                  // function was anonymous.
                  // throw an error because they can't be 
                  // mapped to anything. 
                  throw {message: "Anonymous function cannot be added this way."}
              }
              
          } else {
              defaultFunc = method.default || null;
              if (method.name && _.isString(method.name)) {
                  this.addStateMethod(method.name, defaultFunc);
              }
          }
          // else failed to add a method.
      }
      delete methods;
  }
}

commonwealth.Stateful.prototype.addStateMethod = function addStateMethod (methodName, defaultFunc) {
    this[methodName] = function() {
        var state = this.getCurrentState(),
            result = null;

        if (state && _.isFunction(state[methodName])) {
            result = state[methodName].apply(state, arguments);
        } else if (defaultFunc) {
            result = defaultFunc.apply(this, arguments)
        } else {
            console.log("No method found called " + methodName + " in this state and no default method defined.");
        }
    
        return result;
    }
}