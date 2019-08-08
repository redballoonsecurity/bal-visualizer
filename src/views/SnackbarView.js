import View from "./View.js";

export default class SnackbarView extends View {
    /**
     *
     * @param {Element} domRoot
     * @param {GlobalStore} globalStore
     * @param {BitstreamStore} bitstreamStore
     */
    constructor(domRoot, globalStore, bitstreamStore) {
        super({});
        this.domRoot = domRoot;
        this.globalStore = globalStore;
        this.bitstreamStore = bitstreamStore;
    }

    run() {
        this.registerEvents();
    }

    registerEvents() {
        this.bitstreamStore.addChangeListener((s, ps) => this.updateBitstreamState(s, ps));
        this.globalStore.addChangeListener((s, ps) => this.updateGlobalState(s, ps))
    }

    _pushMessage(message, timeout) {
        this.domRoot.MaterialSnackbar.showSnackbar({message, timeout});
    }

    updateBitstreamState(bitstreamState, prevBistreamState) {
        if (bitstreamState.dataLoadError != null && bitstreamState.dataLoadError !== prevBistreamState.dataLoadError) {
            this._pushMessage(bitstreamState.dataLoadError, 2000);
        }

    }

    updateGlobalState(globalState, prevGlobalState) {
        if (globalState.snackbar === prevGlobalState.snackbar) {
            return
        }
        this._pushMessage(globalState.snackbar.message, globalState.snackbar.timeout);
    }

    render() {}
}