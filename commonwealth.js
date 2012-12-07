// var _ = require("./underscore");

var stateful = (function () {
    var getCurrentState = null,
        that = this;
            
    function hasMethod (obj, methodName) {
        return (obj && obj.hasOwnProperty(methodName) && _.isFunction(obj[methodName]));
    }        
                
    return {
        init: function () {
            var elem, method, defaultFunc;
            
            if (this.methods && _.isArray(this.methods))  {
                for (elem in this.methods) {
                    method = this.methods[elem];
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
                delete this.methods;
            }
        },
        
        getCurrentState: function () {
            return getCurrentState;
        },
    
        setCurrentState: function (state) {
            var oldState = getCurrentState,
                newState = state;

            if (oldState && oldState.hasOwnProperty("exit")) {
                oldState.exit();
            }

            getCurrentState = newState;

            if (newState && newState.hasOwnProperty("enter")) {
                newState.enter();
            }
        },
    
        addStateMethod: function (methodName, defaultFunc) {
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
    }
})();