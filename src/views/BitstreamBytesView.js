import View from "./View.js";
import {getSelectedNode, getRootNode, createRootHierarchy} from "../stores/BistreamStore.js";
import {arrayEqual} from "../utils/arrayEqual.js";
import VirtualList from "../utils/VirtualList.js";
import {randomColor} from "randomcolor";

const BYTES_PER_ROW = 8;
const MAX_ROWS = Infinity;


export default class BitstreamBytesView extends View {
    constructor(domRoot, globalStore, bitstreamStore) {
        super({});
        this.bitstreamStore = bitstreamStore;
        this.globalStore = globalStore;
        this.domRoot = domRoot;
        // this.domScroll = domRoot.querySelector(".bytes-scroll");
        this.virtualList = null
    }

    run() {
        this.registerEvents();
    }

    registerEvents() {
        this.bitstreamStore.addChangeListener((s, ps) => this.updateBitstreamState(s, ps));
    }

    _flattenHierarchy(node) {
        if (node.children != null && node.children.length > 0) {
            return node.children
                .map((child) => this._flattenHierarchy(child))
                .reduce((aggregate, children) => {
                    aggregate.push(...children);
                    return aggregate;
                }, []);
        } else {
            return [node]
        }
    }

    updateBitstreamState(bitstreamState, prevBitstreamState) {
        const hierarchyChanged = bitstreamState.hierarchy !== prevBitstreamState.hierarchy;
        const rootNodeChanged = bitstreamState.rootNodePath !== prevBitstreamState.rootNodePath;
        if (
            !hierarchyChanged && !rootNodeChanged &&
            bitstreamState.bytes === prevBitstreamState.bytes &&
            bitstreamState.selectedNodePath === prevBitstreamState.selectedNodePath
        ) {
            return;
        }
        if (bitstreamState.hierarchy == null) {
            return this.setState({
                ...this.state,
                selectedNode: null,
                flatHierarchy: null,
            })
        }
        const rootNode = !hierarchyChanged && !rootNodeChanged ?
            this.state.rootNode : getRootNode(bitstreamState);
        const flatHierarchy = !hierarchyChanged && !rootNodeChanged ?
            this.state.flatHierarchy : this._flattenHierarchy(createRootHierarchy(bitstreamState));
        const selectedNode = !hierarchyChanged && bitstreamState.selectedNodePath === prevBitstreamState.selectedNodePath ?
            this.state.selectedNode : getSelectedNode(bitstreamState);
        this.setState({
            ...this.state,
            selectedNode,
            rootNode,
            flatHierarchy,
            bytes: bitstreamState.bytes,
        });
    }

    _toggleClass(domByteHex, domByteText, className, toggleOn=true) {
        if (toggleOn) {
            domByteHex.classList.add(className);
            domByteText.classList.add(className);
        } else {
            domByteHex.classList.remove(className);
            domByteText.classList.remove(className);
        }
    }

    _styleRowByteSelection(
        address,
        selectionStartAddress,
        selectionEndAddress,
        selectionStartRow,
        selectionEndRow,
        byteRow,
        domByteHex,
        domByteText,
        isSelected,
    ) {
        if (address < selectionStartAddress || address >= selectionEndAddress) {
            return;
        }
        const selectionSize = selectionEndAddress - selectionStartAddress;
        // Add the opening left border
        if (
            address === selectionStartAddress &&
            (selectionSize <= BYTES_PER_ROW || address % BYTES_PER_ROW !== 0)
        ) {
            this._toggleClass(domByteHex, domByteText, "selected-left", isSelected);
        }
        if (
            selectionStartRow + 1 === selectionEndRow ||
            (selectionStartRow + 2 === selectionEndRow && selectionSize <= BYTES_PER_ROW)
        ) {
            // Single row or 2 rows with no overlap
            this._toggleClass(domByteHex, domByteText, "selected-top", isSelected);
            this._toggleClass(domByteHex, domByteText, "selected-bottom", isSelected);
        } else {
            // We've got overlap going on
            if (byteRow === selectionStartRow) {
                // Always add a top border to the first row
                this._toggleClass(domByteHex, domByteText, "selected-top", isSelected);
                if (address % BYTES_PER_ROW === BYTES_PER_ROW - 1) {
                    // Add a right border to the last byte of the first row
                    this._toggleClass(domByteHex, domByteText, "selected-right", isSelected);
                }
            }
            if (
                byteRow === selectionStartRow + 1 &&
                address % BYTES_PER_ROW < selectionStartAddress % BYTES_PER_ROW
            ) {
                // Add top border to the second row up to the start offset in the previous row
                this._toggleClass(domByteHex, domByteText, "selected-top", isSelected);
            }
            if (
                byteRow === selectionEndRow - 2 &&
                address % BYTES_PER_ROW >= ((selectionEndAddress - 1) % BYTES_PER_ROW) + 1
            ) {
                // Add bottom border to the second to last row form the end offset in the next row
                this._toggleClass(domByteHex, domByteText, "selected-bottom", isSelected);
            }
            if (byteRow === selectionEndRow - 1) {
                // Always add a bottom border to the last row
                this._toggleClass(domByteHex, domByteText, "selected-bottom", isSelected);
                if (address % BYTES_PER_ROW === 0) {
                    // Add a left border to the fist byte of the last row
                    this._toggleClass(domByteHex, domByteText, "selected-left", isSelected);
                }
            }

        }
        // Add the closing right border
        if (
            address === selectionEndAddress - 1 &&
            (selectionSize <= BYTES_PER_ROW || address % BYTES_PER_ROW !== BYTES_PER_ROW - 1)
        ) {
            this._toggleClass(domByteHex, domByteText, "selected-right", isSelected);
        }
    }

    _createRowSkeleton(address, maxAddressLength, selectionStartAddress, selectionEndAddress) {
        const domRow = document.createElement("div");
        const rowAddress = address - address % BYTES_PER_ROW;
        domRow.classList.add("row");
        if (address >= selectionStartAddress && address + BYTES_PER_ROW - 1 < selectionEndAddress) {
            domRow.classList.add("selected")
        }
        domRow.dataset.address = rowAddress.toString();

        const domAddress = document.createElement("span");
        domAddress.classList.add("address");
        domAddress.textContent = rowAddress.toString(16).padStart(maxAddressLength, "0");

        const domHex = document.createElement("span");
        domHex.classList.add("hex");

        const domText = document.createElement("span");
        domText.classList.add("text");

        for (let i = 0; i < address % BYTES_PER_ROW; i++) {
            const domByteHex = document.createElement("span");
            domByteHex.textContent = "XX";
            domHex.appendChild(domByteHex);
            const domByteText = document.createElement("span");
            domByteText.textContent = "X";
            domText.appendChild(domByteText);
        }

        domRow.appendChild(domAddress);
        domRow.appendChild(domHex);
        domRow.appendChild(domText);

        return [domRow, domHex, domText];
    }

    _completeRowSkeleton(domRow, address) {
        for (let i = ((address - 1) % BYTES_PER_ROW) + 1; i < BYTES_PER_ROW; i++) {
            const domByteHex = document.createElement("span");
            domByteHex.textContent = "XX";
            domRow.childNodes[1].appendChild(domByteHex);
            const domByteText = document.createElement("span");
            domByteText.textContent = "X";
            domRow.childNodes[2].appendChild(domByteText);
        }
        return domRow
    }

    _createRows(rowStart, rowEnd) {
        const rows = [];
        const maxAddressLength = 6; // TODO: Compute this

        const selectionStartAddress = Math.floor((this.state.selectedNode.bitOffset) / 8);
        const selectionEndAddress = Math.ceil(
            (this.state.selectedNode.bitOffset + this.state.selectedNode.bitSize) / 8
        );
        const rootAddress = Math.floor(this.state.rootNode.bitOffset / 8);
        const renderRootAddress = rootAddress - rootAddress % BYTES_PER_ROW;
        const selectionStartRow = Math.floor((selectionStartAddress - renderRootAddress) / BYTES_PER_ROW);
        const selectionEndRow = Math.min(Math.ceil((selectionEndAddress - renderRootAddress) / BYTES_PER_ROW), MAX_ROWS);

        let address = rootAddress + rowStart * BYTES_PER_ROW;
        const maxAddress = rootAddress + rowEnd * BYTES_PER_ROW;

        let [domRow, domHex, domText] = this._createRowSkeleton(
            address,
            maxAddressLength,
            selectionStartAddress,
            selectionEndAddress,
        );
        this.state.flatHierarchy.forEach(node => {
            const nodeAddressStart = Math.ceil(node.bitOffset / 8);
            const nodeAddressEnd = Math.ceil((node.bitOffset  + node.bitSize) / 8);
            // TODO: Binary search to find the first node
            if (nodeAddressEnd < address || maxAddress < nodeAddressStart) {
                return
            }
            const nodeColor = node.isEmpty ?
                "rgb(200,200,200)" : randomColor({ luminosity: 'light', hue: "#3F51B5", seed: node.type});
            const clickHandler = this._onClick.bind(this, node);
            const doubleClickHandler = this._onNodeDoubleClick.bind(this, node);
            for (; address < nodeAddressEnd && address < maxAddress; address++) {
                const byteRow = Math.floor((address - renderRootAddress) / BYTES_PER_ROW);
                const byteValue = this.state.bytes[address];

                const domByteHex = document.createElement("span");
                domByteHex.style.backgroundColor = nodeColor;
                domByteHex.textContent = byteValue.toString(16).padStart(2, "0");
                domByteHex.addEventListener("click", clickHandler);
                domByteHex.addEventListener("dblclick", doubleClickHandler);
                domHex.appendChild(domByteHex);

                const domByteText = document.createElement("span");
                domByteText.style.backgroundColor = nodeColor;
                domByteText.textContent = byteValue >= 32 && byteValue <= 127 ? String.fromCharCode(byteValue) : ".";
                if (domByteText.textContent === " ") {
                    domByteText.innerHTML = "&nbsp;"
                }
                if (address >= selectionStartAddress)
                domByteText.addEventListener("click", clickHandler);
                domByteText.addEventListener("dblclick", doubleClickHandler);
                domText.appendChild(domByteText);
                if (address === nodeAddressStart) {
                    domByteHex.classList.add("first");
                    domByteText.classList.add("first");
                }
                if (address === nodeAddressEnd - 1) {
                    domByteHex.classList.add("last");
                    domByteText.classList.add("last");
                }
                this._styleRowByteSelection(
                    address,
                    selectionStartAddress,
                    selectionEndAddress,
                    selectionStartRow,
                    selectionEndRow,
                    byteRow,
                    domByteHex,
                    domByteText
                );
                if (address % BYTES_PER_ROW === BYTES_PER_ROW - 1) {
                    rows.push(this._completeRowSkeleton(domRow, address + 1));
                    [domRow, domHex, domText] = this._createRowSkeleton(
                        address + 1,
                        maxAddressLength,
                        selectionStartAddress,
                        selectionEndAddress,
                    );
                }
            }
        });
        if (address % BYTES_PER_ROW !== 0) {
            rows.push(this._completeRowSkeleton(domRow, address));
        }
        return rows
    }

    _renderVirtualList(state) {
        if (this.virtualList != null) {
            clearInterval(this.virtualList.rmNodeInterval);
            this.domRoot.innerHTML = ''
        }
        this.virtualList = new VirtualList({
            h: this.domRoot.offsetHeight,
            itemHeight: 20,
            totalRows: Math.ceil(Math.ceil(state.rootNode.bitSize / 8) / BYTES_PER_ROW),
            generatorFn: (rowStart, rowEnd) => this._createRows(rowStart, rowEnd)
        });
        this.domRoot.appendChild(this.virtualList.container)
    }

    _renderSelection(state, isSelected=true) {
        const selectionStartAddress = Math.floor((state.selectedNode.bitOffset) / 8);
        const selectionEndAddress = Math.ceil(
            (state.selectedNode.bitOffset + state.selectedNode.bitSize) / 8
        );
        const rootAddress = Math.floor(this.state.rootNode.bitOffset / 8);
        const renderRootAddress = rootAddress - rootAddress % BYTES_PER_ROW;
        const selectionStartRow = Math.floor((selectionStartAddress - renderRootAddress) / BYTES_PER_ROW);
        const selectionEndRow = Math.min(Math.ceil((selectionEndAddress - renderRootAddress) / BYTES_PER_ROW), MAX_ROWS);

        this.virtualList.container.childNodes
            .forEach(domRow => {
                if (domRow.dataset.address == null) {
                    return;
                }
                const rowAddress = parseInt(domRow.dataset.address);
                if (rowAddress >= selectionStartAddress && rowAddress + BYTES_PER_ROW - 1 < selectionEndAddress) {
                    if (isSelected) {
                        domRow.classList.add("selected")
                    } else {
                        domRow.classList.remove("selected")
                    }
                }
                for (let i = 0; i < BYTES_PER_ROW; i++) {
                    const address = rowAddress + i;
                    const byteRow = Math.floor((address - renderRootAddress) / BYTES_PER_ROW);
                    this._styleRowByteSelection(
                        address,
                        selectionStartAddress,
                        selectionEndAddress,
                        selectionStartRow,
                        selectionEndRow,
                        byteRow,
                        domRow.childNodes[1].childNodes[i],
                        domRow.childNodes[2].childNodes[i],
                        isSelected,
                    )
                }
            });
        if (isSelected === true) {
            this.virtualList.scrollTo(selectionStartRow, selectionEndRow);
        }
    }

    render(state, prevState) {
        if (prevState == null || state.flatHierarchy !== prevState.flatHierarchy) {
            this._renderVirtualList(state);
        }
        if (prevState == null || state.selectedNode !== prevState.selectedNode) {
            if (prevState.selectedNode != null) {
                this._renderSelection(prevState, false);
            }
            this._renderSelection(state, true);
        }
    }

    _onClick(node) {
        this.bitstreamStore.setSelectedNode(this.buildNodePath(node));
    }

    _onNodeDoubleClick(node) {
        let isRootFound = false;
        const nodePath = [];
        for (let currentNode = node; currentNode != null; currentNode = currentNode.parent) {
            if (currentNode.isViewRoot) {
                isRootFound = true;
            }
            if (currentNode.parent != null && isRootFound) {
                nodePath.unshift(currentNode.index);
            }
        }
        const bistreamState = this.bitstreamStore.getState();
        const absoluteNodePath = this.buildNodeAbsolutePath(nodePath);
        if (arrayEqual(bistreamState.rootNodePath, absoluteNodePath)) {
            this.globalStore.setSnackbarMessage(
                `No view configured for ${node.implementation || node.type}.`,
                1000
            );
        } else {
            this.bitstreamStore.setRootNode(absoluteNodePath);
        }
    }

    buildNodePath(node) {
        const path = [];
        for (let currentNode = node; currentNode.parent != null; currentNode = currentNode.parent) {
            path.unshift(currentNode.index);
        }
        return this.buildNodeAbsolutePath(path)
    }

    buildNodeAbsolutePath(nodePath) {
        const rootPath = this.bitstreamStore.getState().rootNodePath;
        if (rootPath == null) {
            return nodePath;
        }
        return [...rootPath, ...nodePath]
    }
}