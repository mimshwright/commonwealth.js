module("Dependencies");
test ("Requires Underscore.js", function () {
    ok (_, "Underscore is loaded.");
});
test ("Commonwealth", function () {
    ok (commonwealth, "Commonwealth is loaded.");
})
module("Stateful creation methods", {
    setup: function () {
        obj = new commonwealth.Stateful({
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
                 }
            }
         }); // end constructor.
         
         obj.a = {
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
          obj.b = {
             enter: function() {
                 console.log("Entering state B");
             },

             test: function(arg) {
                 console.log("Test B", arg);
             }
         };
         
         obj.manualMethod = function manualMethod () {
              console.log("Ran manual method. Current state is " + this.getCurrentState());
              this.getCurrentState().manualMethod();
          }
    },
    teardown: function () {

    }
});

test( "Test state properties", function() {
    equal (obj.getCurrentState(), null, "By default, the current state is null.");
    obj.setCurrentState(obj.a);
    equal (obj.getCurrentState(), obj.a, "Set current state affects getCurrentState()");
    obj.setCurrentState(null);
    equal (obj.getCurrentState(), null, "State can be set to null.");
});

test( "Passing in an object called methods to the extend function and calling init()", function () {
    ok (obj.methodsVarFunction_string && _.isFunction(obj.methodsVarFunction_string), "Functions can be defined by mixing in an array of strings.");
    ok (obj.methodsVarFunction_function && _.isFunction(obj.methodsVarFunction_function), "Functions can be defined by mixing in an array of functions.");
    ok (obj.methodsVarFunction_object && _.isFunction(obj.methodsVarFunction_object), "Functions can be defined by mixing in an array of objects with name and default properties."); 
});

test( "Test addStateMethod", function () {
    obj.addStateMethod("sayHello");
    ok (_.isFunction(obj.sayHello), "sayHello() was defined by addStateMethod('sayHello')");

    obj.addStateMethod("test", function(foo) {
        console.log("Default function", foo);
    });

    obj.addStateMethod("calculate");

    obj.test("Foo");
    obj.sayHello();

    obj.setCurrentState(obj.a);
    obj.test("Foo");
    obj.sayHello("world");

    equal(obj.calculate(1,2,3), 6, "Functions from states return results.");

    obj.setCurrentState(obj.b);
    obj.test("Foo");
    obj.sayHello("world");

    obj.setCurrentState(null);
    obj.test("Foo");
    obj.sayHello("world");

    obj.setCurrentState(obj.c);
    obj.test("Foo");
    obj.sayHello("world");
    obj.manualMethod();
}); 
test( "History", function () {
   obj.setCurrentState(obj.a);
   var previousState = obj.getCurrentState(); 
   obj.setCurrentState(obj.b);
   equal (obj.previousState, previousState, "Last state tracks the previous state of the stateful object.");
});
