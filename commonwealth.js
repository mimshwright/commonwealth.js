// var _ = require("./underscore");
var commonwealth = commonwealth || {};

commonwealth.Stateful = (function () {
    var currentState = null,
        that = this,
        S;
    
    Stateful = function Stateful (options) {
        _(this).extend(options.states);
            
        this.init(options);
    }

    Stateful.prototype.init = function (options) {
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

    Stateful.prototype.getCurrentState = function getCurrentState () {
        return currentState;
    }

    Stateful.prototype.setCurrentState = function setCurrentState (state) {
        var oldState = currentState,
            newState = state;

        if (oldState && _.isFunction(oldState["exit"])) {
            oldState.exit();
        }

        currentState = newState;

        if (newState && _.isFunction(newState["enter"])) {
            newState.enter();
        }
    }

    Stateful.prototype.addStateMethod = function addStateMethod (methodName, defaultFunc) {
        this[methodName] = function() {
            var state = this.getCurrentState(),
                result = null;
    
            if (state && _.isFunction(state[methodName])) {
                result = state[methodName].apply(state, arguments);
            } else if (defaultFunc) {
                result = defaultFunc.apply(that, arguments)
            } else {
                console.log("No method found called " + methodName + " in this state and no default method defined.");
            }
        
            return result;
        }
    }
    return Stateful;
})();

delete S;