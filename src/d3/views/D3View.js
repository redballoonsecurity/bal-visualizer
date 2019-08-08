import View from "../../views/View.js";
import {arrayEqual} from "../../utils/arrayEqual.js";

export default class D3View extends View {
    constructor(domRoot, globalStore, bitstreamStore, d3Components, hierarchy) {
        super({});
        this.domRoot = domRoot;
        this.bitstreamStore = bitstreamStore;
        this.globalStore = globalStore;
        this.d3Components = d3Components;
        this.hierarchy = hierarchy.copy();

        this.domByNodes = new Map();
        this.bindedUpdateBitstreamState = this.updateBitstreamState.bind(this);

        this.domSvg = this.createSVG();
        this.domRoot.appendChild(this.domSvg);
    }

    createSVG() {
        throw Error(`The ${this.constructor.name} instance must implement the createSVG method`);
    }

    registerElements(node, domElement) {
        this.domByNodes.set(node, domElement);
    }

    run() {
        this.registerEvents();
        this.updateBitstreamState(this.bitstreamStore.getState())
    }

    registerEvents() {
        this.bitstreamStore.addChangeListener(this.bindedUpdateBitstreamState);
    }

    destroy() {
        this.unregisterEvents();

        this.domByNodes.clear();
        this.domRoot.innerHTML = "" // Maybe there is a better way to clear the dom
    }

    unregisterEvents() {
        this.bitstreamStore.removeChangeListener(this.bindedUpdateBitstreamState)
    }

    updateBitstreamState(bitstreamState, prevBitstreamState) {
        const domNodes = this.getDomNodes(bitstreamState.selectedNodePath, bitstreamState.rootNodePath);
        if (domNodes == null &&
            (prevBitstreamState == null || bitstreamState.selectedNodePath !== prevBitstreamState.selectedNodePath)
        ) {
            console.warn("The selection path is invalid");
        }
        this.setState({
            ...this.state,
            domSelectedNodes: domNodes,
        })
    }

    getDomNodes(path, rootPath) {
        if (path == null) {
            return null;
        }
        let index = 0;
        if (rootPath !== null) {
            if (path.length < rootPath.length) {
                throw Error("The length of the provided path should be longer than or equal to the length root path.")
            }
            for (; index < rootPath.length; index++) {
                if (path[index] !== rootPath[index]) {
                    throw Error("The elements of the path should match the elements from the root path starting from the left. ")
                }
            }
        }
        let currentNode = this.hierarchy;
        const maxDepth = this.hierarchy.data.style.depth;
        const domNodes = [this.domByNodes.get(currentNode)];
        for (; index < path.length; index++) {
            if (currentNode.depth >= maxDepth) {
                break;
            }
            if (currentNode.children == null || currentNode.children.length <= path[index]) {
                return null;
            }
            currentNode = currentNode.children[path[index]];
            domNodes.push(this.domByNodes.get(currentNode))
        }
        return domNodes;
    }

    onNodeClick(node) {
        const domNode = this.domByNodes.get(node);
        if (domNode === this.state.domSelectedNodes) {
            return
        }
        this.bitstreamStore.setSelectedNode(this.buildNodePath(node));
    }

    onNodeDoubleClick(node) {
        let isRootFound = false;
        const nodePath = [];
        for (let currentNode = node; currentNode != null; currentNode = currentNode.parent) {
            if (currentNode.data.isViewRoot) {
                isRootFound = true;
            }
            if (currentNode.parent != null && isRootFound) {
                nodePath.unshift(currentNode.data.index);
            }
        }
        const bistreamState = this.bitstreamStore.getState();
        const absoluteNodePath = this.buildNodeAbsolutePath(nodePath);
        if (arrayEqual(bistreamState.rootNodePath, absoluteNodePath)) {
            this.globalStore.setSnackbarMessage(
                `No view configured for ${node.data.implementation || node.data.type}.`,
                1000
            );
        } else {
            this.bitstreamStore.setRootNode(absoluteNodePath);
        }
    }

    buildNodePath(node) {
        const path = [];
        for (let currentNode = node; currentNode.parent != null; currentNode = currentNode.parent) {
            path.unshift(currentNode.data.index);
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