var c = commonwealth;

module("Dependencies");
// test ("Requires Underscore.js", function () {
//     ok (_, "Underscore is loaded.");
// });
test ("Commonwealth", function () {
    ok (commonwealth, "Commonwealth is loaded.");
});



module("Stateful");

test ("Stateful constructor", function () {
	var stateful = new c.Stateful ("test");
	ok (stateful, "Constructor works");
	equal (stateful.name, "test", "Name property can be set by constructor.");
});

test ("addSubstate() method", function () {
	var stateful  = new c.Stateful();
	var testState = stateful.addSubstate({
		name: "test"
	});
	equal(stateful.states.test, testState, "addSubstate() adds a state object and returns a reference to it.");
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

test ("getStateByName() method", function () {
	var stateful  = new c.Stateful();
	var testState = stateful.addSubstate({
		name: "test"
	});

	equal (testState, stateful.getStateByName("test"), "getStateByName() returns the state object if it exists.");
	equal (null, stateful.getStateByName("bogus"), "It returns the null if it doesn't exist.");
});

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
	mathStateful.addStateMethod ("process");

	equal(mathStateful.process(5), null, "By default, the result of a state method is null if there is no defualt function.");
	mathStateful.currentState(identityState);
	equal(5, mathStateful.process(5), "If the currentState implements a method called on the stateful host, control is diverted to the state.");
	mathStateful.currentState(doubleState);
	equal(10, mathStateful.process(5), "The return value of the substate function is returned.");
});

test ("Conversion methods", function () {
	var stateful = new c.Stateful();
	ok(stateful.toString().indexOf("Stateful") >= 0, "toString() produces " + stateful.toString());
});

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
});
