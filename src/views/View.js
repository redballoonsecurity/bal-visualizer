import {shallowEqualObjects} from "shallow-equal";

export default class View {
    constructor(state) {
        this.state = state || {};
    }

    setState(state) {
        if (shallowEqualObjects(this.state ,state)) {
            return;
        }
        const prevState = this.state;
        this.state = state;
        console.log(`The ${this.constructor.name} state changed: `, prevState, state);
        this.render(state, prevState);
    }

    run() {
        throw Error("The View implementation must override the run method");
    }

    destroy() {
        throw Error("The View implementation must override the destroy method");
    }

    render(state, prevState) {
        throw Error("The View implementation must override the render method");
    }
}