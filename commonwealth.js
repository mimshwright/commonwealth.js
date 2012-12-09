// var _ = require("./underscore");

var Stateful = function (options) {
    var currentState = null,
        that = this,
        methods = options.methods;
                
    function hasMethod (obj, methodName) {
        return (obj && obj.hasOwnProperty(methodName) && _.isFunction(obj[methodName]));
    }        
    
    var elem, method, defaultFunc;
    
    _(this).extend(options.states);
    
    this.getCurrentState = function getCurrentState () {
        return currentState;
    }
    
    this.setCurrentState = function setCurrentState (state) {
        var oldState = currentState,
            newState = state;

        if (hasMethod(oldState, "exit")) {
            oldState.exit();
        }

        currentState = newState;

        if (hasMethod(newState, "enter")) {
            newState.enter();
        }
    }

    this.addStateMethod = function addStateMethod (methodName, defaultFunc) {
        this[methodName] = function() {
            var state = this.getCurrentState(),
                result = null;
        
            if (hasMethod(state, methodName)) {
                result = state[methodName].apply(state, arguments);
            } else if (defaultFunc) {
                result = defaultFunc.apply(that, arguments)
            } else {
                console.log("No method found called " + methodName + " in this state and no default method defined.");
            }
            
            return result;
        }
    }
    
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