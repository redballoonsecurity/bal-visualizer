import View from "./View.js";

export default class ActionsView extends View {
    /**
     *
     * @param {Element} domRoot
     * @param {GlobalStore} globalStore
     * @param {BitstreamStore} bitstreamStore
     */
    constructor(domRoot, globalStore, bitstreamStore) {
        super({});
        this.globalStore = globalStore;
        this.bitstreamStore = bitstreamStore;
        this.domSelectFileInput = domRoot.querySelector(".menu-view-select-file input");
        this.domClearFile = domRoot.querySelector(".menu-view-clear-file");
        this.domRefreshFile = domRoot.querySelector(".menu-view-refresh-file");
        // this.domHelp = domRoot.querySelector(".menu-view-help");

        this.currentFile = null;
        this.currentFileRefreshHandle = null
    }

    run() {
        this.registerEvents();
        this.updateBitstreamState(this.bitstreamStore.getState(), null)
    }

    registerEvents() {
        // this.domHelp.addEventListener("click", this._onHelpClick.bind(this));
        this.domSelectFileInput.addEventListener("change", this._onFileChange.bind(this));
        this.domClearFile.addEventListener("click", this._onClearClick.bind(this));
        this.domRefreshFile.addEventListener("click", this._onRefreshFile.bind(this));

        this.bitstreamStore.addChangeListener((s, ps) => this.updateBitstreamState(s, ps))
    }

    _onClearClick() {
        this.bitstreamStore.setHierarchy(null, null);
        this._clearWatchFile();
    }

    _onHelpClick() {
        this.globalStore.setHelpDiologOpened(true)
    }

    _onFileChange(event) {
        if (event.target.files.length === 0){
            return
        }
        this._setFile(event.target.files[0]);
        // Reset the state of the file input so that the same file can be selected again.
        event.target.value = null;
    }

    _onRefreshFile() {
        if (this.currentFile == null) {
            throw new Error("The view should have a file set in order to refresh it");
        }
        this._setFile(this.currentFile);
    }

    _watchFile(file) {
        const fileLastModified = file.lastModified;
        this.currentFile = file;
        this.currentFileRefreshHandle = setInterval(() => {
            if (fileLastModified !== file.lastModified) {
                this.bitstreamStore.setDataModified();
                clearInterval(this.currentFileRefreshHandle);
            }
        }, 100)
    }

    _clearWatchFile() {
        clearInterval(this.currentFileRefreshHandle);
        this.currentFile = null;
    }

    _buildHierarchy(nodeData, bitOffset) {
        if (nodeData == null) {
            return null;
        }
        const node = {
            type: nodeData.type,
            implementation: nodeData.implementation,
            description: nodeData.description,
            unpacked: !!nodeData.unpacked,
            bitSize: nodeData.bit_size,
            isEmpty: nodeData.is_empty,
            valueName: nodeData.value_name,
            valueDescription: nodeData.value_description,
            value: nodeData.value,
            bitOffset: bitOffset,
            style: null,
            isViewRoot: null
        };
        if (nodeData.children == null) {
            return node;
        }
        node.children = nodeData.children
            .filter(childNodeData => childNodeData != null)
            .map(childNodeData => {
                const child = this._buildHierarchy(childNodeData, bitOffset);
                bitOffset += child.bitSize;
                return child
            })
            .map((child, index) => {
                child.index = index;
                return child
            });
        return node;
    }

    _setFile(file) {
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            try {
                const result = JSON.parse(e.target.result);
                if (result.data == null || result.style == null) {
                    throw new Error("The JSON data should have a data and style attribute.")
                }
                this.bitstreamStore.setHierarchy(
                    this._buildHierarchy(result.data, 0),
                    Uint8Array.from(atob(result.bytes), c => c.charCodeAt(0)),
                    result.style
                );
                this._watchFile(file)
            } catch (e) {
                console.error(e);
                this.bitstreamStore.setDataLoadError(e.message);
                this._clearWatchFile()
            }
        };
        fileReader.onerror = (e) => {
            this.setDataLoadError(e.message);
        };
        this.bitstreamStore.setDataLoading(true);
        fileReader.readAsText(file)
    }

    updateBitstreamState(bitstreamState, prevBistreamState) {
        this.setState({
            clearEnabled: bitstreamState.hierarchy != null,
            refreshEnabled: bitstreamState.dataIsModified === true
        });
    }

    render(state) {
        if (state.clearEnabled) {
            this.domClearFile.removeAttribute("disabled");
        } else {
            this.domClearFile.setAttribute("disabled", "");
        }
        if (state.refreshEnabled) {
            this.domRefreshFile.removeAttribute("disabled");
        } else {
            this.domRefreshFile.setAttribute("disabled", "");
        }
    }
}