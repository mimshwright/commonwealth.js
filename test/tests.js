var c = commonwealth;

module("Dependencies");
test ("Commonwealth", function () {
    ok (commonwealth, "Commonwealth is loaded.");
});
test ("Commonwealth utils", function () {
    ok (commonwealth.utils, "Commonwealth utils is loaded.");
});

module("Creating and setting States");

test ("State constructor", function () {
	var state = new c.State ("test");
	ok (state, "Constructor works");
	var state = c.State("test");
	ok (state, "Forgetting to use new still works.");
	equal (state.name, "test", "Name property can be set by constructor.");
});

test ("addSubstate() method", function () {
	var state  = new c.State();

	// create a new state with the name existing.
	var existingState = new c.State("existing");
	state.addSubstate(existingState);
	equal(existingState, state.states.existing, "addSubstate() adds an existing state object and returns a reference to it.");

	var newStateFromString = state.addSubstate("fromString");
	equal(newStateFromString, state.states.fromString, "addSubstate(string) creates a state object, adds it, and returns a reference to it.");

	raises(function () { var noName = state.addSubstate();}, "You must provide an argument or you get an error.");
});

test ("currentState() method", function () {
	var state  = new c.State();
	var testState = state.addSubstate({
		name: "test"
	});

	equal (null, state.currentState(), "By default, currentState() returns null.");
	state.currentState(testState);
	equal (testState, state.currentState(), "currentState(state) sets the current state while currentState() (no parameter) gets it.");
	equal (testState, state.currentState("test"), "You can use the name of a state instead of the state object to set the state");
	raises (function () { state.currentState("bogus"); }, "If you use a name instead of the state object and it can't be found, an error is thrown.");
	equal (state.setCurrentState("test"), state.getCurrentState(), "currentState() ≈ getCurrentState() ; currentState(state) ≈ setCurrentState(state)");

	// prevent infinite loops
	raises (function () {
		var parent = new c.State("parent");
		parent.addCurrentState("child").setCurrentState(parent);
	}, "Adding a state that is already in the chain is prohibited because it causes infinite loops.");
});

test ("addCurrentState() method", function () {
	var state  = new c.State();
	var testState = state.addCurrentState("test");

	equal (testState.name, "test", "addCurrentState() creates a new state the same way as addSubstate().");
	equal (state.getCurrentState(), testState, "It also sets the currentState to the new state you created.");
});

test ("getStateByName() method", function () {
	var state  = new c.State();
	var testState = state.addSubstate({
		name: "test"
	});

	equal (testState, state.getStateByName("test"), "getStateByName() returns the state object if it exists.");
	equal (null, state.getStateByName("bogus"), "It returns the null if it doesn't exist.");
	equal (null, state.getStateByName(null), "It returns the null if name is null.");
});

module('State methods');

test ("addStateMethod()", function () {
	var mathState = new c.State();
	var identityState = new c.State();
	var doubleState = new c.State();

	identityState.process = function (x) {
		return x;
	};

	doubleState.process = function (x) {
		return x*2;
	};

	mathState.addSubstate(identityState);
	mathState.addSubstate(doubleState);
	var process = mathState.addStateMethod ("process");

	equal(mathState.process(5), null, "By default, the result of a state method is null if there is no defualt function.");
	mathState.currentState(identityState);
	equal(5, mathState.process(5), "If the currentState implements a method called on the state host, control is diverted to the state.");
	mathState.currentState(doubleState);
	equal(10, mathState.process(5), "The return value of the substate function is returned.");
	equal(process, mathState.process, "Return a reference to the function, just for kicks.");
});

test ("Default methods", function () {
	var s = new c.State();
	s.addStateMethod("getInfo");

	var noInfoString = "No info found.";
	var infoString = "Here's the info you asked for.";
	var defaultString = "Nobody knows about this function.";
	var impliedString = "Everyone should have heard about this function.";

	var noInfo = s.addSubstate("noInfo");

	var info = s.addSubstate("info");
	info.getInfo = function () {
		return infoString;
	};

	s.getInfo.defaultFunction = function () {
		return noInfoString;
	};

	s.currentState(info);
	equal (s.getInfo(), infoString, "When a method is supported by a substate, it is called on the substate.");
	s.currentState(noInfo);
	equal (s.getInfo(), noInfoString, "When a method is not supported by a substate, the defaultFunction() property of the funciton is called instead.");

	s.addStateMethod("getInfoWithDefault", function () {
		return defaultString;
	});
	equal (s.getInfoWithDefault(), defaultString, "A defaultFunction can be passed in as the second argument in the addStateMethod() call.");

	s.addStateMethod(function impliedName () {
		return impliedString;
	});
	equal (s.impliedName(), impliedString, "A default function can be passed as the only argument if it is named.");

	s.currentState(info);
	info.impliedName = info.getInfo;
	equal (s.impliedName(), infoString, "Just checking that when you do this, the substate methods are still called instead.");

	raises (function () { s.addStateMethod(function () {}); }, "Trying to add just an anonymous function causes an error since there is no name data anywhere to be found.");
});

test("before and after functions", function () {
	var parent = new c.State("parent");
	var child = parent.addSubstate("child");
	parent.currentState(child);

	var result = "";

	parent.addStateMethod("f", function () {
		result += "default|";
	});
	parent.f.before = function () { result = "before|"; };
	child.f = function () { result += "during|"; };
	parent.f.after = function () { result += "after"; };

	parent.f();
	equal(result, "before|during|after", "When you call a function, the before() and after() functions are called before and after the main function if they exist.");

	parent.setCurrentState(null);
	parent.f();
	equal(result, "before|default|after", "defaultFunction still works in conjunction with before() and after().");

	// TODO: test this on nested states.
});

test ("enter() and exit()", function () {
	var state = new c.State("root");
	state.lastStateEntered = null;
	state.lastStateExited = null;

	var enterTestState = new c.State("enter");
	enterTestState.enter = function () {
		this.rootState().lastStateEntered = this.name;
	};

	var exitTestState = new c.State("exit");
	exitTestState.exit = function () {
		var r = this.rootState();
		r.lastStateExited = this.name;
	};

	state.addSubstate(enterTestState);
	state.addSubstate(exitTestState);

	equal (state.lastStateEntered, null, "Before starting test, verify that lastStateEntered is null.");
	equal (state.lastStateExited, null, "Before starting test, verify that lastStateExited is null.");

	state.currentState("exit");
	equal (state.lastStateEntered, null, "If the currentState doesn't implement a function called enter() or exit(), that function isn't called.");
	state.currentState("enter");
	equal (state.lastStateExited, exitTestState.name, "exit() is called automatically when the currentState is replaced by a new state.");
	equal (state.lastStateEntered, enterTestState.name, "enter() is called automatically when a currentState is set.");
});

test ("onStateChange()", function () {
	var alf = new c.State("a");
	var buck = alf.addSubstate("b");
	var cris = alf.addSubstate("c");
	var dimitri = buck.addSubstate("d");

	var result = null;

	alf.onStateChange = function (oldState, newState) {
		result = oldState ? oldState.name : "-";
		result += ",";
		result += newState ? newState.name : "-";
		return result;
	};

	equal(result, null, "Result is null to begin with." );
	alf.setCurrentState(buck);
	equal(result, "-,b", "Function is called when setCurrentState is called." );
	alf.setCurrentState(cris);
	equal(result, "b,c", "Function is called when setCurrentState is called again." );
	buck.setCurrentState(dimitri);
	equal(result, "b,c", "Function is not called when a substate sets its state" );

});

module ("Nested States");

test ("currentState(), finalCurrentState(), parentState() and rootState() in nested State objects", function () {
	var root = new c.State("root");
	var child = new c.State("child");
	var grandchild = new c.State("grandchild");

	root.addSubstate(child);
	child.addSubstate(grandchild);

	root.currentState("child");
	child.currentState("grandchild");

	ok (root.currentState() == child && child.currentState() == grandchild, "State objects can be nested.");
	equal (root.finalCurrentState(), grandchild, "finalCurrentState() gets the the most distant ancestor in the state chain.");

	equal ( grandchild.parentState(), child, "parentState() points to the state's parent.");
	equal ( grandchild.rootState(), root, "rootState() points to the root of the hierarchy.");
	equal ( root.parentState(), null, "parentState() is equal to null if the state has no parents.");
	equal ( root.rootState(), root, "rootState() is equal to the state if the state has no parents.");
	equal ( child.rootState(), child.parentState(), "rootState() is equal to the parentState() if the child has only one parent.");
});

test ("Calling nested functions", function (){
	var root = new c.State("root");
	var child = new c.State("child");
	var grandchild = new c.State("grandchild");

	root.addSubstate(child);
	child.addSubstate(grandchild);

	root.currentState("child");
	child.currentState("grandchild");

	root.addStateMethod("noSkip");
	root.addStateMethod("skip");

	child.noSkip = function () {
		return this;
	};

	grandchild.skip = function () {
		return this;
	};

	equal(root.noSkip(), child, "Control is passed to substates when a method is called.");
	equal(root.skip(), grandchild, "More distant relatives will be checked for viable functions even if their parents haven't called addStateMethod() specifically. In other words, I can set up a function on the parent and the grandchild without doing anything to the child.");
});

test ("Resetting states on enter", function () {
	var root = new c.State("root");
	var child = root.addCurrentState("child");
	var grandson = child.addCurrentState("grandson");
	var granddaughter = child.addSubstate("granddaughter");

	child.defaultState = "grandson";
	child.resetOnEnter = true;

	equal(child.currentState().name, "grandson", "Starts out as grandson");
	child.currentState("granddaughter");
	equal(child.currentState().name, "granddaughter", "Switch to granddaughter");
	root.setCurrentState(null);
	equal(root.currentState(), null, "child is no longer active");
	root.currentState(child);
	equal(child.currentState().name, "grandson", "Reverts to defaultState");

	child.setCurrentState(granddaughter);
	child.reset();
	equal(child.currentState().name, "grandson", "Reset manually with reset()");

});

test ("get() and set()", function () {
	var root = new c.State("root");
	var child = root.addCurrentState("child");
	var grandson = child.addCurrentState("grandson");
	var granddaughter = child.addSubstate("granddaughter");

	root.set("name", "billy");
	equal(grandson.get("name"), "billy", "Using set works. Get works on the ancestors.");
	grandson.set("name", "jerry");
	equal(child.get("name"), "jerry", "Using set works from the ancestors.");
});

module ("Conversion methods");
test ("toString()", function () {
	var state = new c.State();
	ok(state.toString().indexOf("State") >= 0, "toString() produces " + state.toString());
});
test ("stateChainToArray()", function () {
	var root = new c.State("root");
	var child = new c.State("child");
	var grandchild = new c.State("grandchild");

	root.addSubstate(child);
	child.addSubstate(grandchild);

	root.currentState("child");
	child.currentState("grandchild");

	var a = root.stateChainToArray();
	ok(a[0] === root && a[1] === child && a[2] === grandchild, "stateChainToArray() produces an array of the current state chain from rootState to finalCurrentState.");

	// equal(root.stateChainToString(), "*root* > child > grandchild", "stateChainToString() produces an string of the current state chain from rootState to finalCurrentState.");
	// equal(child.stateChainToString(), "root > *child* > grandchild", "stateChainToString() produces an string of the current state chain from rootState to finalCurrentState.");
});

module ("Dispatching messages");

test ("Message handlers", function () {
	var greeter = new c.State("greeter");
	var en = greeter.addCurrentState("en");
	var fr = greeter.addSubstate("fr");
	var de = greeter.addSubstate("de");
	var formal = de.addCurrentState("formal");
	var casual = de.addSubstate("casual");

	var message = "Say hello";
	var result = "";

	en.on(message, function (message) {
		result = "Hello";
	});
	fr.on(message, function (message) {
		result = "Bonjour";
	});
	formal.on(message, function (message) {
		result = "Guten tag";
	});
	casual.on(message, function (message) {
		result = "Hallo";
	});

	greeter.dispatch(message);
	equal(result, "Hello", "Works for English." );

	greeter.currentState("fr");
	greeter.dispatch(message);
	equal(result, "Bonjour", "Works for French." );

	greeter.currentState("de");
	greeter.dispatch(message);
	equal(result, "Guten tag", "Works for nested German." );

	de.currentState("casual");
	greeter.dispatch(message);
	equal(result, "Hallo", "Works for nested German." );

});

test ("Transitions", function () {
	var parent = new c.State("parent");
	var son = parent.addCurrentState("son");
	var daughter = parent.addSubstate("daughter");
	var stepDaughter = parent.addSubstate("stepDaughter");

	var changeGenderFunc = parent.addTransition("changeGender", {"son":"daughter", "daughter":"son"} );
	parent.addTransition("firstSon", {"*":"son"});
	parent.addTransition("sonNullNullSon", {"son":null, null:"son"});

	son.addTransition("changeGrandchildGender", {"grandson": "granddaughter", "granddaughter": "grandson"});
	son.addCurrentState("grandson");
	son.addSubstate("granddaughter");

	equal (parent.currentState(), son, "Start with son.");
	parent.dispatch("changeGender");
	equal (parent.currentState(), daughter, "Changed state with transition.");
	changeGenderFunc.call(parent);
	equal (parent.currentState(), son, "Transitions happen based on context. Transitions can be triggered with a method call too. addTransition() returns a reference to the generated function.");
	parent.currentState(stepDaughter);
	parent.dispatch("firstSon");
	equal (parent.currentState(), son, "Wildcard transitions with *.");
	parent.currentState(stepDaughter);
	parent.addTransition("changeGender", {"stepDaughter":"son"});
	parent.dispatch("changeGender"); // stepDaughter -> son
	parent.dispatch("changeGender"); // son -> daughter
	equal (parent.currentState().name, "daughter", "You can add transitions after one has been defined already and it won't affect the old ones (although one may overwrite the other if not careful).");
	parent.currentState("son");
	parent.dispatch("changeGrandchildGender");
	equal (son.currentState().name, "granddaughter", "Works with nested states.");
	parent.currentState("daughter");
	parent.dispatch("changeGrandchildGender");
	equal (son.currentState().name, "granddaughter", "Nested states are only affected if they're in the current state chain.");
	parent.dispatch("foo");
	equal (parent.currentState(), daughter, "Unregistered transitions do nothing.");
	parent.setCurrentState("son");
	parent.dispatch("sonNullNullSon");
	equal(parent.currentState(), null, "You can transition to null.");
	parent.dispatch("sonNullNullSon");
	equal(parent.currentState().name, "son", "You can transition from null.");
});

module ("JSON");

test ("jsonUtil", function () {
	ok (commonwealth.utils.jsonUtil, "jsonUtils defined.");
});

test ("Creating new states with JSON", function () {
	var result;
	var state = new c.State({
		name: "dad",
		states: {
			"son": {
				name: "son",
				enter: function () {
					result = "son entered";
				},
				exit: function () {
					result = "son exited";
				},
				methods: {
					greet: function () {
						return "billy";
					}
				}
			},
			"daughter" : {
				name: "daughter",

				methods: {
					greet: function () {
						return "sally";
					}
				}
			}
		},
		set: {
			"foo":"bar"
		},
		defaultState: "son",
		methods: {
			greet: function () {
				return "dad";
			}
		},
		transitions: {
			"changeGender" : {"son":"daughter", "daughter":"son"}
		}
	});

	// todo: test set
	// todo: test onStateChange()

	equal(state.name, "dad", "Set name with json.");
	ok(state.states["son"] && state.states["daughter"], "Substates are registered on the parent.");
	equal(state.currentState().name, "son" , "Set defaultState with json.");
	equal(result, "son entered" , "enter() function set with json.");
	state.currentState("daughter");
	equal(result, "son exited" , "enter() function set with json.");
	equal(state.greet(), "sally", "Methods are defined with json. Also nesting works!");
	state.dispatch("changeGender");
	equal(state.currentState().name, "son", "Transitions can be added through json.");
	equal(state.get("foo"), "bar", "Set works on root.");
	equal(state.currentState().get("foo"), "bar", "Set works on children.");
});

module("History");

test( "History functions", function () {
    var state = new c.State(),
        history = state.history,
        previousState;

    state.addSubstate("a");
    state.addSubstate("b");
    state.addSubstate("c");
    state.addSubstate("d");
    state.addSubstate("e");

    equal (state, history.getState(), "History has a reference to the state object.");

    equal (0, history.states.length, "The history should be empty before a state is set on the state object.");

    state.setCurrentState("a");
    equal (null, history.previousState, "The history should be record it when a state is set on the state object. The first state in the history should be null if that was the first state of the state object.");

    previousState = state.getCurrentState();
    state.setCurrentState("b");
    equal (history.getPreviousState().name, previousState.name, "getPreviousState() tracks the previous state of the state object.");

    var previousLength = history.states.length;
    state.setCurrentState(state.getCurrentState());
    equal (history.states.length, previousLength, "Setting the current state to the same state doesn't change the history.");

    equal(history.getLength(), history.states.length, "getLength() is a shortcut for getting the length of the array in the history object.");

    var preRewindLength = history.getLength();
    history.rewind();
    var postRewindLength = history.getLength();
    equal (state.getCurrentState().name, "a", "Calling rewind() goes to the previous state.");
    equal (preRewindLength - postRewindLength, 1, "The length property changes when rewinding.");

    state.currentState("b");
    state.currentState("c");
    state.currentState("d");
    state.currentState("e");
    history.rewind(3);
    equal (state.getCurrentState().name, "b", "Calling rewind(n) goes back n steps. rewind() is the same as rewind(1)");
    history.rewind(1000);
    equal (state.history.getLength(), 0, "You can only go back at most a number of steps equal to the length of the history.");

    history.clear();
    equal (history.states.length, 0, "Calling clear() clears the history.");
});