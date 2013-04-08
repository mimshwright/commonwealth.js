commonwealth.js
===============

An implementation of [hierarchical state machines](http://bears.ece.ucsb.edu/class/ece253/samek0311.pdf) in JavaScript.

## Project Goals
- Finite State Machines and Hierarchical State Machines
- Unique features that take advantage of JS's particular characteristics
- Easy to understand and very straightforward to implement
- Based on Practical use cases rather than pure theory
- Super testy! Created by TDD with QUnit. [Check out the test suite](http://htmlpreview.github.com/?http://github.com/mimshwright/commonwealth.js/master/test/index.html)

## Why Commonwealth?

Most names involving "states" or "state machines" were taken. Four of the states of the United States officially use the term "commonwealth" rather than "state."

## Documentation

- [JSDoc](http://htmlpreview.github.com/?http://github.com/mimshwright/commonwealth.js/master/docs/index.html)
- [Examples](https://github.com/mimshwright/commonwealth.js/blob/master/examples/index.html)

## Roadmap

### Current Version
0.4 (still under active development, not quite ready for prime time)

### To Do:
- ~~Check for infinite loops~~
- Instructions for use
- Change name from stateful to something else (state?)
- Json parsing,  creating everything in one line
- Concurrent states
- Timer States
- Default states, reset on enter
- OnSuspend and onwakeup
- Functions to explicitly add on enter, exit. Additional params for addStateMethod
- Events dispatched when changing states
- Some way to tie into a view?
- Clear function
- Chaining methods ala jquery
- Traffic light demo
- Appliance Demo
- Game demo
- Form demo (idle, invalid, valid, submitting, confirmed)