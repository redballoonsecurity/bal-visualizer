import {shallowEqualObjects} from "../../node_modules/shallow-equal/dist/index.esm.js"

export default class Store {
    constructor(state) {
        this._listeners = new Set();
        this._state = state;
        this._updating = false;
    }

    getState() {
        return this._state
    }

    _setState(state) {
        if (shallowEqualObjects(state, this._state)) {
            return
        }
        if (this._updating === true) {
            throw Error("The state is already updating");
        }
        const prevState = this._state;
        try {
            this._updating = true;
            this._state = state;
            console.log(`The ${this.constructor.name} state changed: `, prevState, state);
            this._listeners.forEach((listener) => listener(state, prevState));
        } finally {
            this._updating = false;
        }
    }

    addChangeListener(listener) {
        this._listeners.add(listener)
    }

    removeChangeListener(listener) {
        this._listeners.delete(listener)
    }
}