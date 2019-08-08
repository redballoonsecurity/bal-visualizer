import View from "./View.js";
import {getSelectedNode} from "../stores/BistreamStore.js";

export default class BitstreamInfoView extends View {
    constructor(domRoot, bitstreamStore) {
        super({});
        this.bitstreamStore = bitstreamStore;
        this.domRoot = domRoot;
    }

    run() {
        this.registerEvents();
    }

    registerEvents() {
        this.bitstreamStore.addChangeListener((s, ps) => this.updateBitstreamState(s, ps));
    }

    updateBitstreamState(bitstreamState, prevBitstreamState) {
        if (
            bitstreamState.hierarchy === prevBitstreamState.hierarchy &&
            bitstreamState.selectedNodePath === prevBitstreamState.selectedNodePath
        ) {
            return;
        }
        if (bitstreamState.hierarchy == null) {
            return this.setState({
                ...this.state,
                selectedNode: null,
            })
        }
        this.setState({
            ...this.state,
            selectedNode: getSelectedNode(bitstreamState)
        });
    }

    render(state, prevState) {
        this.domRoot.innerHTML = "";
        const node = state.selectedNode;
        if (node == null) {
            return
        }
        this.domRoot.appendChild(this.createItem("Type", node.type));
        if (node.implementation != null) {
            this.domRoot.appendChild(this.createItem("Implementation", node.implementation));
        }
        const nodeSize = (node.bitSize % 8 === 0) ?
            `0x${(node.bitSize / 8).toString(16)} bytes` :
            `0x${node.bitSize.toString(16)} bits`;
        this.domRoot.appendChild(this.createItem("Size", nodeSize));
        this.domRoot.appendChild(this.createItem("Status", node.unpacked ? "Unpacked": "Packed"));
        this.domRoot.appendChild(this.createItem(
            "Empty",
            node.isEmpty ? "True" : "False"
        ));
        this.domRoot.appendChild(this.createItem(
            "Children",
            (node.children) ? node.children.length : "Leaf"
        ));
        if (node.value != null) {
            this.domRoot.appendChild(this.createItem(
                "Value",
                `${node.value} (0x${node.value.toString(16)})`
            ));
        }
        if (node.valueName != null) {
            this.domRoot.appendChild(this.createItem(
                "Value Name",
                node.valueName
            ));
        }
        if (node.valueDescription != null) {
            this.domRoot.appendChild(this.createItem(
                "Value Description",
                node.valueDescription
            ));
        }
        if (node.description != null) {
            this.domRoot.appendChild(this.createItem(
                "Description",
                node.description
            ));
        }
    }

    createItem(name, value) {
        const domLi = document.createElement("li");
        domLi.classList.add("mdl-list__item", "mdl-list__item--two-line");

        const domContent = document.createElement("span");
        domContent.classList.add("mdl-list__item-primary-content");

        const domItemTitle = document.createElement("span");
        domItemTitle.textContent = name;

        const domItemValue = document.createElement("span");
        domItemValue.classList.add("mdl-list__item-sub-title");
        domItemValue.textContent = value;

        domContent.appendChild(domItemTitle);
        domContent.appendChild(domItemValue);
        domLi.appendChild(domContent);

        return domLi

    }
}