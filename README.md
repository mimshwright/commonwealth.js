# Commonwealth.js

An implementation of [hierarchical state machines](http://bears.ece.ucsb.edu/class/ece253/samek0311.pdf) in JavaScript.

##### Version
0.6 (still under active development, not quite ready for prime time)

## Project Goals
- Finite State Machines and Hierarchical State Machines
- Unique features that take advantage of JS's particular characteristics
- Easy to understand and very straightforward to implement
- Based on Practical use cases rather than pure theory
- Super testy! Created by TDD with QUnit. [Check out the test suite](http://htmlpreview.github.com/?http://github.com/mimshwright/commonwealth.js/master/test/index.html)

## Documentation

- [Manual](http://htmlpreview.github.com/?http://github.com/mimshwright/commonwealth.js/master/MANUAL.md)
- [JSDoc](http://htmlpreview.github.com/?http://github.com/mimshwright/commonwealth.js/master/docs/index.html)
- [Examples](https://htmlpreview.github.com/mimshwright/commonwealth.js/blob/master/examples/index.html)

## Roadmap

### To Do:
- ~~Check for infinite loops~~
- ~~Instructions for use~~
- ~~Change name from stateful to something else (state?)~~
- ~~Json parsing, creating everything in one line~~
- Concurrent states
- ~~Set values using set() in the json.~~
- ~~onStateChanged()~~
- Timer States; timer transitions; some other kind of auto-timer.
- ~~Default states, reset on enter~~
- OnSuspend and onwakeup
- Functions to explicitly add on enter, exit, before and after. Additional params for addStateMethod
- Events dispatched when changing states
- Some way to tie into a view?
- Chaining methods ala jquery
- ~~Traffic light demo~~
- Appliance Demo
- Game demo
- Form demo (idle, invalid, valid, submitting, confirmed)
- State chart markup language support.
- Remove listeners and substates and transitions.

### Why the name Commonwealth?
Most names involving "states" or "state machines" were taken. Four of the states of the United States officially use the term "commonwealth" rather than "state." It's a unique name and also represents the open source nature of the project.
