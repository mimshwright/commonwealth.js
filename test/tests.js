var stateful;

module("Dependencies");
test ("Requires Underscore.js", function () {
    ok (_, "Underscore is loaded.");
});
test ("Commonwealth", function () {
    ok (commonwealth, "Commonwealth is loaded.");
})
module("Stateful", {
    setup: function () {
        stateful = new commonwealth.Stateful({
            // define methods via constructor.
            methods: [
                        // define methods using string...
                        "methodsVarFunction_string",
                        
                        // named function 
                        function methodsVarFunction_function () {
                            console.log ("named");
                        },
                        
                        // object
                        {name: "methodsVarFunction_object", default: function() { return "default function"; } }
                        
                        // closure (should fail)
                        // function () {
                            // console.log ("anonymous");
                        // }
                     ],
            states : {                
                c : {
                     enter: function () {
                         console.log("Entering State C");
                     },

                     manualMethod: function () {
                         console.log("Manual C");
                     }
                }, 
                enterExitTestState : {
                    enter: function () {
                        stateful.calledEnter = true;
                    },
                    exit: function () {
                        stateful.calledExit = true;
                    }
                }
            }
         }); // end constructor.
         
         stateful.a = {
             enter: function() {
                 console.log("Entering state A");
             },

             exit: function() {
                 console.log("Exiting state A");
             },
             test: function() {
                 console.log("Test A");
             },
             sayHello: function(name) {
                 console.log("Hello,", name);
             },
             calculate: function () {
                 var i = 0, result = 0;
                 for (; i < arguments.length; i += 1) {
                     result += arguments[i];
                 }
                 return result;
             }
         };
          stateful.b = {
             enter: function() {
                 console.log("Entering state B");
             },

             test: function(arg) {
                 console.log("Test B", arg);
             }
         };
         
         stateful.manualMethod = function manualMethod () {
              console.log("Ran manual method. Current state is " + this.getCurrentState());
              this.getCurrentState().manualMethod();
          }
    },
    teardown: function () {

    }
});

test( "Test state properties", function() {
    equal (stateful.getCurrentState(), null, "By default, the current state is null.");
    stateful.setCurrentState(stateful.a);
    equal (stateful.getCurrentState(), stateful.a, "Set current state affects getCurrentState()");
    stateful.setCurrentState(null);
    equal (stateful.getCurrentState(), null, "State can be set to null.");
});

test( "Passing in methods via options object", function () {
    ok (stateful.methodsVarFunction_string && _.isFunction(stateful.methodsVarFunction_string), "Functions can be defined by mixing in an array of strings.");
    ok (stateful.methodsVarFunction_function && _.isFunction(stateful.methodsVarFunction_function), "Functions can be defined by mixing in an array of functions.");
    ok (stateful.methodsVarFunction_object && _.isFunction(stateful.methodsVarFunction_object), "Functions can be defined by mixing in an array of objects with name and default properties."); 
});

test( "Test addStateMethod", function () {
    stateful.addStateMethod("sayHello");
    ok (_.isFunction(stateful.sayHello), "sayHello() was defined by addStateMethod('sayHello')");

    stateful.addStateMethod("test", function(foo) {
        console.log("Default function", foo);
    });

    stateful.addStateMethod("calculate");

    stateful.test("Foo");
    stateful.sayHello();

    stateful.setCurrentState(stateful.a);
    stateful.test("Foo");
    stateful.sayHello("world");
    
    equal(stateful.calculate(1,2,3), 6, "Functions from states return results.");

    stateful.setCurrentState(stateful.b);
    stateful.test("Foo");
    stateful.sayHello("world");

    stateful.setCurrentState(null);
    stateful.test("Foo");
    stateful.sayHello("world");

    stateful.setCurrentState(stateful.c);
    stateful.test("Foo");
    stateful.sayHello("world");
    stateful.manualMethod();
}); 

test( "Enter and exit functions", function () {
    ok (!stateful.calledEnter && !stateful.calledExit);
    stateful.setCurrentState(stateful.enterExitTestState);
    ok (stateful.calledEnter, "When a state becomes active, enter() is called on the state.");
    stateful.setCurrentState(stateful.a);
    ok (stateful.calledExit, "When a state stops being active, exit() is called on the state.");
    
    stateful.setCurrentState(stateful.enterExitTestState);
    stateful.calledEnter = false;
    stateful.setCurrentState(stateful.enterExitTestState);
    equal (stateful.calledEnter, false, "Setting currentState to the same thing twice doesn't do anything.")
});

test( "History Class", function () {
   stateful.setCurrentState(stateful.a);
   var previousState = stateful.getCurrentState(); 
   stateful.setCurrentState(stateful.b);
   equal (stateful, stateful.history.getStateful(), "History has a reference to the stateful object.");
   equal (stateful.history.previousState, previousState, "Last state tracks the previous state of the stateful object.");
   var previousLength = stateful.history.states.length;
   stateful.setCurrentState(stateful.b);
   equal (stateful.history.states.length, previousLength, "Setting the current state to the same state doesn't change the history.");
   stateful.history.clear();
   equal (stateful.history.states.length, 0, "Clear() clears the history.")
});
