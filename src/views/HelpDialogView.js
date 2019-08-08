import View from "./View.js";

export default class HelpDialogView extends View {
    constructor(domRoot, globalStore) {
        super({
            opened: false
        });
        this.storeGlobal = globalStore;
        this.domRoot = domRoot;
    }

    run() {
        this.registerEvents();
    }

    registerEvents() {
        this.domRoot.addEventListener('click', (event) => {
            if (event.target === this.domRoot) {
                this.storeGlobal.setHelpDiologOpened(false)
            }
        });

        this.storeGlobal.addChangeListener(() => this.updateState())
    }

    updateState() {
        const globalState = this.storeGlobal.getState();
        this.setState({
            opened: globalState.isHelpDialogOpened
        });
    }

    render() {
        if (this.state.opened) {
            this.domRoot.showModal()
        } else {
            this.domRoot.close()
        }
    }
}