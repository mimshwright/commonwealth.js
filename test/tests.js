var c = commonwealth;

module("Dependencies");
test ("Commonwealth", function () {
    ok (commonwealth, "Commonwealth is loaded.");
});
test ("Commonwealth utils", function () {
    ok (commonwealth.utils, "Commonwealth utils is loaded.");
});

module("Creating and setting States");

test ("Stateful constructor", function () {
	var stateful = new c.Stateful ("test");
	ok (stateful, "Constructor works");
	equal (stateful.name, "test", "Name property can be set by constructor.");
});

test ("addSubstate() method", function () {
	var stateful  = new c.Stateful();

	// create a new state with the name existing.
	var existingState = new c.Stateful("existing");
	stateful.addSubstate(existingState);
	equal(existingState, stateful.states.existing, "addSubstate() adds an existing state object and returns a reference to it.");

	var newStateFromString = stateful.addSubstate("fromString");
	equal(newStateFromString, stateful.states.fromString, "addSubstate(string) creates a state object, adds it, and returns a reference to it.");
	var noName = stateful.addSubstate();

	equal(noName, stateful.states.state0, "Using addSubstate() with no arguments produces a new state with an automatically generated name starting with 'state0'");
	equal(stateful.addSubstate().name, "state1", "Each additional call automatically increments the state name.");
});

test ("currentState() method", function () {
	var stateful  = new c.Stateful();
	var testState = stateful.addSubstate({
		name: "test"
	});

	equal (null, stateful.currentState(), "By default, currentState() returns null.");
	stateful.currentState(testState);
	equal (testState, stateful.currentState(), "currentState(state) sets the current state while currentState() (no parameter) gets it.");
	equal (testState, stateful.currentState("test"), "You can use the name of a state instead of the state object to set the state");
	raises (function () { stateful.currentState("bogus"); }, "If you use a name instead of the state object and it can't be found, an error is thrown.");
	equal (stateful.setCurrentState("test"), stateful.getCurrentState(), "currentState() ≈ getCurrentState() ; currentState(state) ≈ setCurrentState(state)");
});

test ("addCurrentState() method", function () {
	var stateful  = new c.Stateful();
	var testState = stateful.addCurrentState("test");

	equal (testState.name, "test", "addCurrentState() creates a new state the same way as addSubstate().");
	equal (stateful.getCurrentState(), testState, "It also sets the currentState to the new state you created.");
});

test ("getStateByName() method", function () {
	var stateful  = new c.Stateful();
	var testState = stateful.addSubstate({
		name: "test"
	});

	equal (testState, stateful.getStateByName("test"), "getStateByName() returns the state object if it exists.");
	equal (null, stateful.getStateByName("bogus"), "It returns the null if it doesn't exist.");
});

module('State methods');

test ("addStateMethod()", function () {
	var mathStateful = new c.Stateful();
	var identityState = new c.Stateful();
	var doubleState = new c.Stateful();

	identityState.process = function (x) {
		return x;
	};

	doubleState.process = function (x) {
		return x*2;
	};

	mathStateful.addSubstate(identityState);
	mathStateful.addSubstate(doubleState);
	var process = mathStateful.addStateMethod ("process");

	equal(mathStateful.process(5), null, "By default, the result of a state method is null if there is no defualt function.");
	mathStateful.currentState(identityState);
	equal(5, mathStateful.process(5), "If the currentState implements a method called on the stateful host, control is diverted to the state.");
	mathStateful.currentState(doubleState);
	equal(10, mathStateful.process(5), "The return value of the substate function is returned.");
	equal(process, mathStateful.process, "Return a reference to the function, just for kicks.");
});

test ("Default methods", function () {
	var s = new c.Stateful();
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
	var parent = c.Stateful("parent");
	var child = parent.addSubstate("child");
	parent.currentState(child);

	var result = "";

	parent.addStateMethod("f");
	parent.f.before = function () { result += "before|"; };
	child.f = function () { result += "during|"; };
	parent.f.after = function () { result += "after"; };

	parent.f();
	equals(result, "before|during|after", "When you call a function, the before() and after() functions are called before and after the main function if they exist.");
	// TODO: test this on nested states.
});

test ("enter() and exit()", function () {
	var stateful = new c.Stateful("root");
	stateful.lastStateEntered = null;
	stateful.lastStateExited = null;

	var enterTestState = new c.Stateful("enter");
	enterTestState.enter = function () {
		this.rootState().lastStateEntered = this.name;
	};

	var exitTestState = new c.Stateful("exit");
	exitTestState.exit = function () {
		var r = this.rootState();
		r.lastStateExited = this.name;
	};

	stateful.addSubstate(enterTestState);
	stateful.addSubstate(exitTestState);

	equal (stateful.lastStateEntered, null, "Before starting test, verify that lastStateEntered is null.");
	equal (stateful.lastStateExited, null, "Before starting test, verify that lastStateExited is null.");

	stateful.currentState("exit");
	equal (stateful.lastStateEntered, null, "If the currentState doesn't implement a function called enter() or exit(), that function isn't called.");
	stateful.currentState("enter");
	equal (stateful.lastStateExited, exitTestState.name, "exit() is called automatically when the currentState is replaced by a new state.");
	equal (stateful.lastStateEntered, enterTestState.name, "enter() is called automatically when a currentState is set.");
});

// test ("supportsMethod()", function () {
// 	var parent = new Stateful();
// 	var child = parent.addSubstate("child");

// 	parent.addStateMethod("both");
// 	child.both = function () {};
// 	ok(parent.supportsMethod("both") && child.supportsMethod("both"), "Testing that a state root and a substate can both support a method.");

// 	parent.addStateMethod("parentOnly");
// 	ok(parent.supportsMethod("parentOnly") && !child.supportsMethod("parentOnly"), "Testing a state root which added a method through addStateMethod().");

// 	child.childOnly("childOnly");
// 	ok(!parent.supportsMethod("childOnly") && child.supportsMethod("childOnly"), "Testing a state which added a method through function definition.");
// });

module ("Nested States");

test ("currentState(), finalCurrentState(), parentState() and rootState() in nested Stateful objects", function () {
	var root = new c.Stateful("root");
	var child = new c.Stateful("child");
	var grandchild = new c.Stateful("grandchild");

	root.addSubstate(child);
	child.addSubstate(grandchild);

	root.currentState("child");
	child.currentState("grandchild");

	ok (root.currentState() == child && child.currentState() == grandchild, "Stateful objects can be nested.");
	equal (root.finalCurrentState(), grandchild, "finalCurrentState() gets the the most distant ancestor in the state chain.");

	equal ( grandchild.parentState(), child, "parentState() points to the state's parent.");
	equal ( grandchild.rootState(), root, "rootState() points to the root of the hierarchy.");
	equal ( root.parentState(), null, "parentState() is equal to null if the state has no parents.");
	equal ( root.rootState(), root, "rootState() is equal to the stateful if the stateful has no parents.");
	equal ( child.rootState(), child.parentState(), "rootState() is equal to the parentState() if the child has only one parent.");
});

test ("Calling nested functions", function (){
	var root = new c.Stateful("root");
	var child = new c.Stateful("child");
	var grandchild = new c.Stateful("grandchild");

	root.addSubstate(child);
	child.addSubstate(grandchild);

	root.currentState("child");
	child.currentState("grandchild");

	root.addStateMethod("f");

	grandchild.f = function () {
		return this;
	};

	ok (commonwealth.utils.hasMethod(child, "f"), "State methods are automatically added to substates.");
	equal(root.f(), grandchild, "Control is passed to substates when a method is called.");
});

module ("Conversion methods");
test ("toString()", function () {
	var stateful = new c.Stateful();
	ok(stateful.toString().indexOf("Stateful") >= 0, "toString() produces " + stateful.toString());
});
test ("stateChainToString() and stateChainToArray()", function () {
	var root = new c.Stateful("root");
	var child = new c.Stateful("child");
	var grandchild = new c.Stateful("grandchild");

	root.addSubstate(child);
	child.addSubstate(grandchild);

	root.currentState("child");
	child.currentState("grandchild");

	var a = root.stateChainToArray();
	ok(a[0] === root && a[1] === child && a[2] === grandchild, "stateChainToArray() produces an array of the current state chain from rootState to finalCurrentState.");

	equal(root.stateChainToString(), "*root* > child > grandchild", "stateChainToString() produces an string of the current state chain from rootState to finalCurrentState.");
	equal(child.stateChainToString(), "root > *child* > grandchild", "stateChainToString() produces an string of the current state chain from rootState to finalCurrentState.");
});
