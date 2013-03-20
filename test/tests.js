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
	var stateful = new c.Stateful ();
	ok (stateful, "Constructor works");
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
	stateful.currentState(null);
	equal (testState, stateful.currentState("test"), "You can use the name of a state instead of the state object to set the state");
	equal (stateful.setCurrentState(null), stateful.getCurrentState(), "currentState() is an alias to setCurrentState(state) and getCurrentState()");
});

test ("getStateByName() method", function () {
	var stateful  = new c.Stateful();
	var testState = stateful.addSubstate({
		name: "test"
	});

	equal (testState, stateful.getStateByName("test"), "getStateByName() returns the state object if it exists.");
	equal (null, stateful.getStateByName("bogus"), "It returns the null if it doesn't exist.");
})

test ("Conversion methods", function () {
	var stateful = new c.Stateful();
	ok(stateful.toString().indexOf("Stateful") >= 0, "toString() produces " + stateful.toString());
});