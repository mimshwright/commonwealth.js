# About Commonwealth

TL;DR: Commonwealth is a library written in JavaScript for creating composite states.

Before getting into what Commonwealth does, you might want to read about some of the [programming concepts](#concepts) behind it.  Otherwise, read on.

## States

Commonwealth is a library for creating [Hierarchical State Machines](#concepts). The main class in Commonwealth is [`State`](http://htmlpreview.github.com/?http://github.com/mimshwright/commonwealth.js/master/docs/commonwealth.State.html). `State` objects in Commonwealth represent both "stateful" objects, objects that have substates, and the substates themselves. In other words, **a `State` object can have states inside it**.

`State`s can be used as controllers for objects whose behaviour changes based on their state, such as a module that might _loading_, _ready_, or _disabled_.

**A simple [button example](http://htmlpreview.github.com/?http://github.com/mimshwright/commonwealth.js/master/examples/button-test.html)** shows a button element with two states, _on_ and _off_. The state of the button controls how the button behaves when clicked.

### Creating a `State` object

There are a few ways to create state objects. Here is the most basic.

	// A minimal state creation (all details to be provided later)
	var state = new commonwealth.State();

	// Create a state with the name of "on".
	var onState = new commonwealth.State("on");

	// If you hate typing commonwealth all the time you can
	// shortcut to constructor...
	var S = commonwealth.State;
	var state = new S();

Most of the time you will be creating states in the context of another state. For this, you can create substates with the `addSubstate()` method.

	var state = new commonwealth.State();
	var onState = new commonwealth.State("on");
	state.addSubstate(onState);

	// Automatically create a substate with a name
	var offState = state.addSubstate("off");

As you can see, the function returns a reference to the state it just created. Also, you can always get a reference to a state object by name like this:

	var onState = state.getStateByName("on");

The library also allows you to create `State` objects using a JSON object passed into the constructor. [Creating states with JSON](#json) will be covered later after you have a better understanding of how commonwealth works.

### Getting and Setting the current state

A stateful object contains states that determine its behavior. Therefore, the `currentState` of the object is important in deciding its reaction to a method call or event. You can get or set the current state like this...

	var state = new commonwealth.State();
	var onState = state.addSubstate("on");
	var offState = state.addSubstate("off");

	state.getCurrentState(); // By default, current state is null
	state.setCurrentState(onState);

	// You can use just the name of the state instead of the state
	// object if it's been added as a substate.
	state.setCurrentState("off");
	state.getCurrentState() === offState; // true

	// jQuery style syntax also works.
	state.currentState(); // onState
	state.currentState(onState); // same as setCurrentState(onState)

You can also create a substate and set it as current in one function.

	var disabled = state.addCurrentState("disabled");
	state.currentState() === disabled; // true

Once a current state is set, it's part of what I call the 'state chain'. This is especially important when there are states within states which we'll discuss later. The state at the bottom of the state chain, the one with no parent states, is called the 'root' state.

#### Setting `enter()` and `exit()` functions for states

Sometimes you want to trigger an action when switching states. To execute a function (like a callback) when you enter or exit simply define a function called `enter()` or `exit()` on the state. These functions will be automatically called when the state changes to or from that state.

	var sub = new commonwealth.State("submarine");

	var periscopeDepth = sub.addSubstate("periscopeDepth");
	periscopeDepth.enter = function () {
		// depth to 10m
		// raise scope
	};
	periscopeDepth.exit = function () {
		// retract scope
	};

	var silentRunning = sub.addSubstate("silentRunning");
	silentRunning.enter = function () {
		// disable sonar
	};
	silentRunning.exit = function () {
		// enable sonar
	};

	sub.currentState(periscopeDepth); // depth to 10m, raise periscope (enter)
	sub.currentState(silentRunning); // retract scope (exit), disable sonar (enter).
	sub.setCurrentState(null); // enable sonar (exit)

`enter` and `exit` functions are a good place to put code that animates the view during a state change.

### Adding methods to the state composite

Switching states around is not that exciting unless the behaviour of your program changes too. You can add methods to your state object that automatically are handled by the current state using `addStateMethod()`.

	var calculator = new commonwealth.State("calculator");
	var add = calculator.addSubstate("add");
	var multiply = calculator.addSubstate("multiply");

	// Add a method to the calculator called calculate.
	calculator.addStateMethod("calculate");

	// Define the function in the substates.
	// Use addStateMethod() on the substate.
	add.addStateMethod(function calculate (a, b) {
		return a + b;
	});

	// Or just set the function directly.
	multiply.calculate = function (a, b) { return a * b; };

	// Executing the method on the root state will call the function
	// on the current state.
	calculator.currentState("add");
	calculator.calculate(2,4); // returns 6

	calculator.currentState("multiply");
	calculator.calculate(2,4); // returns 8

	// If there is no substate, the function will return null.
	calculator.setCurrentState(null);
	calculator.calculate(2,4); // returns null since there is no default.

#### Default Methods

You can also provide a method that is executed by default when there is no substate set or when the substate doesn't support the method. You can do this by passing a **named** function to `addStateMethod()`.

	var greeter = new commonwealth.State("greeter");
	greeter.addStateMethod(function sayHello (name) {
		return "Hello, " + name + ".";
	});
	greeter.addSubstate("happy").addStateMethod(function sayHello(name) {
		return "Omigosh, HEY, " + name + ", how's it going!?";
	});
	greeter.addSubstate("sad").addStateMethod(function sayHello(name) {
		return "Oh hi, " + name + "... whatever.";
	});

	// When currentState is null, use the default function.
	greeter.sayHello("Dave"); // Hello, Dave.

	// Dave says something very hurtful.

	greeter.setCurrentState("sad");
	greeter.sayHello("Brian"); // Oh hi, Brian... whatever.

### Sharing values between states

Since you may often want to share some data between states, there are shortcut methods for getting and setting properties. Use `set(prop, val)` to set a property and `get(prop)` to retrive it. The values are shared amongst all the states in the state chain.

	var car = new commonwealth.State("car");
	var driving = car.addCurrentState("driving");

	car.set("speed", 40);

	// the speed is available from the driving state
	driving.get("speed"); // 40


### Messages & handlers

Commonwealth can send messages between states in the state chain. This allows states to respond to custom events. Unlike the state methods, all handler functions in the are called when an event is dispatched.

	var state = new commonwealth.State();
	var child = state.addCurrentState("child");
	var result = "";

	// return the child's name on the "sayName" event.
	child.on("sayName", function () {
		result = this.name;
	});

	// trigger the "sayName" event.
	state.trigger("sayName");
	result === "child"; // true

#### Transitions

Perhaps the most important thing you might to with a message handler is to trigger a state transition. Transition in this case simply means changing the current state, not an animation. This is very easy to set up in commonwealth. Use the method `addTransition()` to define one or more transitions that are triggered by a message. The syntax looks like this:

	state.addTransition("message", {"from":"to", "anotherFrom":"anotherTo"});

The first value is the message that will trigger the transition. The second is an object containing one or more pairs of states that will change. You can add as many transitions for each message as you like. If you want to cause a transition from _all_ states to another state, you can use a `*` as in `{"*":"foo"}`.

	var trafficLight = new commonwealth.State();
	var red = trafficLight.addCurrentState("red");
	var yellow = trafficLight.addSubstate("yellow");
	var green = trafficLight.addSubstate("green");

	// when the "change" event is triggered, cycle colors.
	trafficLight.addTransition("change", {"red":"green", "green":"yellow", "yellow":"red"});

	// trigger a change event every 1 second
	setInterval(function () {
		trafficLight.trigger("change");
	}, 1000);

#### onStateChange

There's a special event handler which is called every time the currentState changes. To use it, just define a function on your state called `onStateChange` with two arguments for the old and new state.

	var state = new commonwealth.State();
	state.onStateChange = function (oldState, newState) {
		console.log(oldState, " -> ", newState);
	};

<a id="json"></a>
### Creating States with JSON

Now that you've learned all the core functionality of the `State` class, I'll show you how to create complex `State` objects in a single line using a configuration object.

	// Config object basic syntax
	{
	    "name": "string", 				// only required field

	    "states": {...},  				// an object containing 1 or more states
	                      				// which follow the exact same syntax as
	                      				// this configuration object.

	    "defaultState": "stateName", 	// the name of a state to set as
	      	                            // the default substate.

	    "resetOnEnter": true, 			// true or false. Sets the resetOnEnter property.

	    "methods": {...}, 				// 1 or more methods to add using addStateMethod()

	    "transitions": {...}  			// 1 or more transitions using the same syntax as
	                          			// addTransition()

	    onStateChange: function (){...},// define onStateChange, enter, or exit
    	enter: function (){...},
    	exit: function (){...}
	}

	// Add state methods with this syntax:
	{
		"methodName": function () {
			// function body
		},
		... // more methods
	}

	// Add transitions with this syntax:
	{
		"signalName" : {
			"fromState":"toState",
		 	"anotherFromState":"anotherToState",
		 	"*": "toState", // matches all from states.
		 	... // more transitions
		},
		... // more signals
	}

Here's an example that creates a traffic light with nested states, transitions and everything, all within a single function call. Read through the comments for the details.

	// create a traffic light with a configuration object.
	var trafficLight = new commonwealth.State({
		// give the traffic light a name.
		"name": "trafficLight",

		// define the states within the traffic light
		"states": {
			// the first state, "off", doesn't do much
			"off": {},

			// the second state, "on", has lots of stuff going on
			// and even has nested states within it.
			"on": {

				// Define the nested states within the "on" state.
				"states" : {
					"red": {},
					"green": {},
					"yellow": {}
				},

				// Define the function that is called when this state
				// becomes active.
				"enter": function () {

					// Sets up a timer that triggers the "change"
					// event every 1 second.
					var id = setInterval(function () {
						trafficLight.trigger("change");
					}, 1000);

					// store the interval id so you can clear it later.
					trafficLight.set("id", id);
				},

				// Define the function that gets called when the state is exited.
				"exit" : function () {
					// Stop the timer.
					clearInterval(trafficLight.get(id));
				},

				// Setting "defaultState" makes it the currentState
				// when the program starts.
				defaultState: "red",

				// Define the transitions so they go in a cycle.
				transitions : {
					"change": {"red":"green", "green":"yellow", "yellow":"red"}
				},

				// When the state changes, log the name of the new
				// state.
				onStateChange: function (oldState, newState) {
					console.log(newState.name);
				}
			}
		},

		// Define transitions for trafficLight.
		// "on" always goes to the "on" state.
		// "off" always goes to the "off" state.
		"transitions" : {
			"on": {"*":"on"},
			"off": {"*":"off"}
		}
	});

	// Kick things off by turning "on" the light.
	trafficLight.trigger("on");

To see a more polished version of this example, check out the [Traffic Controller example](http://htmlpreview.github.com/?http://github.com/mimshwright/commonwealth.js/blob/master/examples/traffic-test.html) ([source code](https://github.com/mimshwright/commonwealth.js/blob/master/examples/traffic-test.html))

### Working with nested state composites

In the previous example, we created a traffic light with nested states (e.g. `trafficLight -> on -> red`). Nesting states is as easy as adding a substate to a substate but there are a few other features that help when dealing with state hierarchies.

#### Calling methods on nested states

When you have a nested state, methods are always called on the most distant child state that supports the method. If a state doesn't support the method, an attempt will be made to call the default method on its parent state. If no classes support the method, nothing happens.

	var A = new commonwealth.State("A");
	var B = A.addCurrentState("B")
	var C = B.addCurrentState("C");

	A.addStateMethod("a");
	A.addStateMethod("bar");
	A.addStateMethod("baz");

	C.addStateMethod(function foo () {
		console.log("C:foo");
	});

	B.addStateMethod(function bar() {
		console.log("B:bar");
	});

	A.foo(); // C:foo
	A.bar(); // B:bar
	A.baz(); // nothing happens

#### `parentState()`, `rootState()` and `finalCurrentState()`

You've already learned about `currentState()`, now we'll look at a few other methods for finding states in the state chain. For all of these examples, assume we have a state `A` with a current state of `B` and `B`'s current state is `C`.

	var A = new commonwealth.State("A");
	var B = A.addCurrentState("B")
	var C = B.addCurrentState("C");

- `parentState()` returns the parent state of a substate. So if `A`'s current state is `B`, `B.parentState()` is `A`. `A.parentState()` is `null` since it has no parent.
- `rootState()` is the first state in the chain. So if `A`'s current state is `B` and `B`'s current state is `C`, then `C.rootState()` is `A`. `A.rootState()` is also `A`.
- `finalCurrentState()` returns the state at the end or the state chain. `A.finalCurrentState()` is `C`. `C.finalCurrentState()` is also `C`.

#### Checking the state chain

If you need to get a quick look at the current structure of the state chain, you can use the `stateChainToArray()` method.

	A.stateChainToArray(); // [A,B,C]
	
	// This method works from any point in the chain.
	B.stateChainToArray(); // [A,B,C]
	C.stateChainToArray(); // [A,B,C]

## Conclusion

Hopefully by now you can see how quickly you can construct powerful and complex state composites. Unfortunately, I could not cover every detail of Commonwealth here. If you're interested in learning more, check out the [JSDoc documentation](http://htmlpreview.github.com/?http://github.com/mimshwright/commonwealth.js/blob/master/docs/index.html) and the other [examples](http://github.com/mimshwright/commonwealth.js/blob/master/examples/).

If you think this document could be improved in any way, please create an issue in Github or do a pull request. Thanks!

<a id="concepts"></a>
## Appendix A: The State Pattern and other Important Concepts

Before getting into what Commonwealth does, it's important to understand a few of the concepts that led to its creation.

### The State Pattern

The [State Pattern](http://books.google.com/books?id=GGpXN9SMELMC&pg=PA410&lpg=PA410&dq=state+pattern+head+first&source=bl&ots=IpG6OQS7FU&sig=iz-8RGvw5IetTidCJ0bj5LYC4pQ&hl=en&sa=X&ei=03BrUZKmBYH7igKE2oH4Dw&ved=0CC0Q6AEwAA#v=onepage&q=state%20pattern%20head%20first&f=false) is a [Design Pattern](http://en.wikipedia.org/wiki/Software_design_pattern) for modeling [Finite State Machines](http://en.wikipedia.org/wiki/Finite-state_machine). It essentially allows an object to come up with different ways of responding to the same function based on what state it's in. For example, in a video game, pressing the A button yields a different result depending on whether the game you're playing is in the main menu state, the game play state or a cutscene state.

### The Composite Pattern

The [Composite Pattern](http://books.google.com/books?id=LjJcCnNf92kC&pg=PA356&lpg=PA356&dq=composite+design+pattern+head+first&source=bl&ots=_a2-bJlapX&sig=fPwQcgcQmKqD4xCuf-wvQtTFQ4E&hl=en&sa=X&ei=DHVrUbXgIqiUigLgroHIBg&ved=0CDoQ6AEwAQ#v=onepage&q=composite%20design%20pattern%20head%20first&f=false) is another [Design Pattern](http://en.wikipedia.org/wiki/Software_design_pattern) for representing trees of hierarchical objects. A great example of this is HTML. An html tag is part of a tree of tags. Each element can contain more elements which in turn can contain more elements, and so on. Another example might be a folder on your hard drive that contains files and more folders. The nice thing about a composite is that the "branch" objects are usually indistinguishable from the "leaf" objects so you can always make the tree taller by making a leaf into a branch.

### Hierarchical State Machines

When you combine the hierarchical nature of the composite pattern with the context awareness of the state pattern, you get a new pattern for representing [Hierarchical State Machines](http://bears.ece.ucsb.edu/class/ece253/samek0311.pdf). This allows us to represent nested states within states. **Commonwealth is a library for creating Hierarchical State Machines.**

For example, a monster in a game might be 'alive' or 'dead', but within the 'alive' state, 'awake' or 'asleep', and within 'awake', 'patrolling', 'attacking', 'dazed' or 'taking damage'. Each state might cause the monster to perform a different behavior and show a different animation.


_Some possible states of a monster character._

**Monster**

- Alive
	- Asleep
	- Awake
		- Patrol
			- Normal
			- Suspicious
		- Attack
		- Dazed
		- Taking damage
	- Dying
- Dead

There is a lot of great information about all of these concepts online. A great place to look is the [Wikipedia page for UML State Machines](http://en.wikipedia.org/wiki/UML_state_machine) (also called State Graphs). You can learn all about the mechanics of nested states including concepts like [events](http://en.wikipedia.org/wiki/UML_state_machine#Events), [entry and exit actions](http://en.wikipedia.org/wiki/UML_state_machine#Entry_and_exit_actions), and concurrent ([orthogonal](http://en.wikipedia.org/wiki/UML_state_machine#Orthogonal_regions)) states.