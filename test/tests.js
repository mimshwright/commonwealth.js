var stateful;

module("Dependencies");
// test ("Requires Underscore.js", function () {
//     ok (_, "Underscore is loaded.");
// });
test ("Commonwealth", function () {
    ok (commonwealth, "Commonwealth is loaded.");
});



module("Stateful");

test( "Get and set current state properties", function() {
    var stateful = new commonwealth.Stateful();

    stateful.states.a = {};
    equal (stateful.getCurrentState(), null, "By default, the current state is null.");
    stateful.setCurrentState(stateful.states);
    equal (stateful.getCurrentState(), stateful.states, "Set current state affects getCurrentState()");
    stateful.setCurrentState(null);
    equal (stateful.getCurrentState(), null, "State can be set to null.");

    stateful.setCurrentState("a");
    equal(stateful.getCurrentState(), stateful.states.a, "If states are defined in the `states` object, you can set them by using the name as a string.");

    raises (
        function () {
            stateful.setCurrentState("undefined state");
        },
        "Trying to set the state with a string that can't be found raises an error."
    );
});

test( "Passing in states and methods via options object", function () {
    var stateful = new commonwealth.Stateful({
        // define methods via constructor.
        methods: [
            // define methods using string...
            "methodsVarFunction_string",

            // named function
            function methodsVarFunction_function () {
                console.log ("named");
            },

            // object
            {
                name: "methodsVarFunction_object",
                defaultFunc: function() { return "default function"; }
            }
        ]
    });

    ok (commonwealth.util.isFunction(stateful.methodsVarFunction_string), "Functions can be defined by mixing in an array of strings.");
    ok (commonwealth.util.isFunction(stateful.methodsVarFunction_function), "Functions can be defined by mixing in an array of functions.");
    ok (commonwealth.util.isFunction(stateful.methodsVarFunction_object), "Functions can be defined by mixing in an array of objects with name and default properties.");

    raises(
        function () {
            new commonwealth.Stateful( {
                methods: [
                    function () {
                        console.log ("anonymous");
                    }
                ]
            });
        },
        "Trying to pass a closure as a method should throw an error."
    );

    stateful = new commonwealth.Stateful({
        methods: { test: function () {} }
    });
    ok(commonwealth.util.isFunction(stateful.test), "'methods' can be an array or an object.");

    stateful = new commonwealth.Stateful({
        states : {
            testState : {}
        }
    });

    ok (stateful.states.testState, "Providing an array of states called 'states' creates the state.");
});

test( "Test addStateMethod()", function () {
    var stateful = new commonwealth.Stateful();

    stateful.addStateMethod("sayHello");
    ok (commonwealth.util.isFunction(stateful.sayHello), "sayHello() was defined by addStateMethod('sayHello')");

    stateful.addStateMethod(
        function skipName() { return ("Default function");}
    );
    equal(stateful.skipName(), "Default function", "A named default function can be added as the first parameter instead of using methodName and defaultFunc parameters.");

    stateful.addStateMethod("test", function(foo) {
        return ("Default function");
    });
    equal(stateful.test(), "Default function", "test() defined by addStateMethod('test', function() {...}); Default function gets called when there isn't one defined on the state.");

    raises( function () {
        stateful.addStateMethod(function () {});
    }, "Passing an anonymous function as the first parameter raises an error since a method name must be provided.");

    stateful.addStateMethod("add");
    var a = {
        add: function (x,y,z) {
            return x+y+z;
        }
    };
    stateful.setCurrentState(a);
    equal(stateful.add(1,2,3), 6, "Functions from states return results.");
});

test("Test addState()", function (){
    var stateful = new commonwealth.Stateful();
    stateful.addState("a", {
        test: function () {
            return "a";
        }
    });
    stateful.addStateMethod("test");
    stateful.setCurrentState("a");

    equal(stateful.test(), "a", "States can be added using addState()");
});

test( "Calling funcitons on state objects", function () {
    var stateful = new commonwealth.Stateful({
        methods: [function who () { return "stateful"; }],
        states: {
            a: { who: function () { return "a";} },
            b: {},
            c: {}
        }
    });
    stateful.states.b.who = function () { return "b"; };

    var x = stateful.who();
    stateful.setCurrentState(stateful.states.a);
    var a = stateful.who();
    stateful.setCurrentState(stateful.states.b);
    var b = stateful.who();
    stateful.setCurrentState(stateful.states.c);
    var c = stateful.who();

    equal(x, "stateful", "When the state is null, the default state is used.");
    equal(a, "a", "Control is passed to the current state if it defines the method.");
    equal(b, "b", "Control is passed to the current state if it defines the method.");
    equal(c, "stateful", "Control is passed back to the stateful object if the registered method isn't found on the state.");
});

test( "Enter and exit functions", function () {
    var stateful = new commonwealth.Stateful({
        states : {
            enterExitTestState : {
                enter: function () {
                    stateful.calledEnter = true;
                },
                exit: function () {
                    stateful.calledExit = true;
                }
            }
        }
    });

    ok (!stateful.calledEnter && !stateful.calledExit, "enter() and exit() haven't been called yet.");

    stateful.setCurrentState(stateful.states.enterExitTestState);
    ok (stateful.calledEnter, "When a state becomes active, enter() is called on the state.");

    stateful.setCurrentState(null);
    ok (stateful.calledExit, "When a state stops being active, exit() is called on the state.");

    stateful.setCurrentState(stateful.states.enterExitTestState);
    stateful.calledEnter = false;
    stateful.setCurrentState(stateful.states.enterExitTestState);
    equal (stateful.calledEnter, false, "Setting currentState to the same thing twice doesn't do anything.");
});

module("History");

test( "History functions", function () {
    var stateful = new commonwealth.Stateful(),
        history = stateful.history,
        previousState,
        a = {},
        b = {};

    equal (stateful, history.getStateful(), "History has a reference to the stateful object.");

    equal (0, history.states.length, "The history should be empty before a state is set on the stateful object.");

    stateful.setCurrentState(a);
    equal (null, history.previousState, "The history should be record it when a state is set on the stateful object. The first state in the history should be null if that was the first state of the stateful object.");

    previousState = stateful.getCurrentState();
    stateful.setCurrentState(b);
    equal (history.previousState, previousState, "Last state tracks the previous state of the stateful object.");

    var previousLength = history.states.length;
    stateful.setCurrentState(stateful.getCurrentState());
    equal (history.states.length, previousLength, "Setting the current state to the same state doesn't change the history.");

    equal(history.getLength(), history.states.length, "getLength() is a shortcut for getting the length of the array in the history object.");

    history.rewind();
    equal (stateful.getCurrentState(), previousState, "Calling rewind() goes to the previous state.");

    history.clear();
    equal (history.states.length, 0, "Calling clear() clears the history.");

    var noHistory = new commonwealth.Stateful({useHistory:false});
    equal(noHistory.history, undefined, "History can be disabled by adding useHistory:false to the options object.");
});
