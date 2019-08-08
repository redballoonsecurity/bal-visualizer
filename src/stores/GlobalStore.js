import Store from "./Store.js";

export default class GlobalStore extends Store {
    constructor() {
        super({
            isHelpDialogOpened: false,
            snackbar: {
                message: null,
                timeout: null
            }
        });
    }

    setHelpDiologOpened(value){
        this._setState({
            ...this._state,
            isHelpDialogOpened: value,
        });
    }

    setSnackbarMessage(message, timeout){
        this._setState({
            ...this._state,
            snackbar: {
                message,
                timeout
            }
        });
    }
}