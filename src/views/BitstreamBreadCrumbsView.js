import View from "./View.js";

export default class BitstreamBreadCrumbsView extends View {
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

    _getNodeChild(bytes, node, style, childIndex) {
        if (node.children == null || node.children.length <= childIndex) {
            throw new Error("Invalid child index.")
        }
        return node.children[childIndex]
    }

    _createSelectedNodes(bitstreamState) {
        const hierarchy = bitstreamState.hierarchy,
            selectedPath = bitstreamState.selectedNodePath,
            rootPath = bitstreamState.rootNodePath,
            rootStyles = bitstreamState.styles,
            prevSelectedPath = bitstreamState.deepSelectedNodePath ;

        let currentSelectedNode = {
            node: hierarchy,
            isRoot: true,
            isRootChange: rootPath != null ? rootPath.length > 0 : false,
            isCurrentRoot: rootPath == null || rootPath.length === 0,
            isSelected: false,
        };
        const selectedNodes = [currentSelectedNode];
        if (selectedPath == null && rootPath == null){
            currentSelectedNode.isSelected = true;
            return selectedNodes;
        }
        const path = selectedPath != null ? selectedPath : rootPath;
        let style = rootStyles[hierarchy.implementation] || rootStyles[hierarchy.type];
        let depth = 1;
        let maxDepth = rootPath != null && rootPath.length > 0 ? Infinity : style.depth;
        let currentNode = hierarchy;
        let isWithinPrevPath = prevSelectedPath.length > path.length;
        for(let index = 0; index < path.length; index++, depth++) {
            currentNode = this._getNodeChild(bitstreamState.bytes, currentNode, style, path[index]);
            if (isWithinPrevPath && prevSelectedPath[index] !== path[index]){
                isWithinPrevPath = false
            }
            if (index >= rootPath.length - 1) {
                if (index === rootPath.length - 1) {
                    style = rootStyles[currentNode.implementation] || rootStyles[currentNode.type];
                    if (style == null) {
                        throw Error(`No style found for root node of type "${currentNode.type}".`)
                    }
                    if (style.depth == null) {
                        throw Error(`No depth found for root node of type "${currentNode.type}".`)
                    }
                    maxDepth = depth + style.depth
                } else if (depth <= maxDepth && style && style.styles) {
                    let updatedStyle = style.styles[currentNode.implementation] || style.styles[currentNode.type];
                    if (updatedStyle != null) {
                        style = updatedStyle;
                        if (updatedStyle.depth != null){
                            maxDepth = depth + style.depth
                        }
                    }
                }
            }
            currentSelectedNode = {
                node: currentNode,
                isRoot: !!(rootStyles[currentNode.implementation] || rootStyles[currentNode.type]),
                isRootChange: index < rootPath.length - 1 || depth > maxDepth,
                isCurrentRoot: index === rootPath.length - 1,
                isSelected: false,
            };
            selectedNodes.push(currentSelectedNode);
        }
        currentSelectedNode.isSelected = true;
        if (isWithinPrevPath) {
            for (let index = path.length; index < prevSelectedPath.length; index++, depth++) {
                currentNode = this._getNodeChild(bitstreamState.bytes, currentNode, style, prevSelectedPath[index]);
                if (index >= rootPath.length - 1 && depth <= maxDepth && style.styles) {
                    let updatedStyle = style.styles[currentNode.implementation] || style.styles[currentNode.type];
                    if (updatedStyle != null) {
                        style = updatedStyle;
                        if (updatedStyle.depth != null){
                            maxDepth = depth + style.depth
                        }
                    }
                }
                currentSelectedNode = {
                    node: currentNode,
                    isRoot: !!(rootStyles[currentNode.implementation] || rootStyles[currentNode.type]),
                    isRootChange: index < rootPath.length - 1 || depth > maxDepth,
                    isSelected: false,
                };
                selectedNodes.push(currentSelectedNode);
            }
        }
        return selectedNodes;

    }

    updateBitstreamState(bitstreamState, prevBitstreamState) {
        if (
            bitstreamState.hierarchy === prevBitstreamState.hierarchy &&
            bitstreamState.selectedNodePath === prevBitstreamState.selectedNodePath &&
            bitstreamState.rootNodePath === prevBitstreamState.rootNodePath
        ) {
            return;
        }

        if (bitstreamState.hierarchy == null) {
            return this.setState({
                ...this.state,
                selectedNodes: null
            });
        }
        else {
            return this.setState({
                ...this.state,
                selectedNodes: this._createSelectedNodes(bitstreamState)
            });
        }
    }

    render(state, prevState) {
        this.domRoot.innerHTML = "";

        if (state.selectedNodes == null) {
            return;
        }
        const domElements = [];
        state.selectedNodes.forEach((selectedNode, index)  => {
            if (selectedNode.isRoot && !selectedNode.isCurrentRoot) {
                const domSeparatorHref = document.createElement("a");
                domSeparatorHref.classList.add("separator");
                domSeparatorHref.setAttribute("href", "javascript:void(0)");
                domSeparatorHref.textContent = " > ";
                domSeparatorHref.addEventListener("click", () => this.onCrumbClick(index, true));
                domElements.push(domSeparatorHref);
            } else {
                const domSeparator = document.createElement("span");
                domSeparator.textContent = " > ";
                domElements.push(domSeparator);
            }
            if (!selectedNode.isSelected) {
                const domHref = document.createElement("a");
                if (!selectedNode.isRootChange) {
                    if (selectedNode.isCurrentRoot) {
                        domHref.classList.add("mdl-color-text--grey-900")
                    } else {
                        domHref.classList.add("mdl-color-text--grey-700")
                    }
                }
                domHref.setAttribute("href", "javascript:void(0)");
                domHref.textContent = selectedNode.node.implementation || selectedNode.node.type;
                domHref.addEventListener("click", () => this.onCrumbClick(index));
                domElements.push(domHref);
            }
            else {
                const domNode = document.createElement("span");
                domNode.textContent = selectedNode.node.implementation || selectedNode.node.type;
                if (selectedNode.isCurrentRoot) {
                    domNode.classList.add("mdl-color-text--grey-900");
                } else {
                    domNode.classList.add("mdl-color-text--grey-700");
                }
                domElements.push(domNode)
            }
        });
        domElements.forEach((dom) => this.domRoot.appendChild(dom))
    }

    onCrumbClick(crumbIndex, forceRoot=false) {
        let rootNodePath = [];
        const selectedNodePath = [];
        // The first crumb is for the root so skip it.
        for (let i = 1; i <= crumbIndex; i++) {
            const selectedNode = this.state.selectedNodes[i];
            selectedNodePath.push(selectedNode.node.index);
            if (selectedNode.isRoot) {
                rootNodePath = selectedNodePath.slice(0);
            }
        }
        if (this.state.selectedNodes[crumbIndex].isRootChange || forceRoot) {
            this.bitstreamStore.setRootNode(rootNodePath, selectedNodePath);
        } else {
            this.bitstreamStore.setSelectedNode(selectedNodePath);
        }
    }
}