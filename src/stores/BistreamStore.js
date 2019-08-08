import Store from "./Store.js";
import {arrayEqual} from "../utils/arrayEqual.js";

export const getNodeBytes = (bytes, node) => {
    const offsetStart = Math.floor(node.bitOffset / 8);
    const offsetEnd = Math.ceil((node.bitOffset + node.bitSize) / 8);
    return bytes.slice(offsetStart, offsetEnd);
};

export const getNode = (state, nodePath) => {
    let node = state.hierarchy;
    for (let i = 0; i < nodePath.length; i++) {
        if (node == null || node.children == null || nodePath[i] >= node.children.length) {
            return null;
        }
        node = node.children[nodePath[i]];
    }
    return node;
};

export const getSelectedNode = (state) => {
    if (state.hierarchy == null || state.selectedNodePath == null){
        return state.hierarchy;
    }
    return getNode(state, state.selectedNodePath);
};

export const getRootNode = (state) => {
    if (state.hierarchy == null || state.rootNodePath == null){
        return state.hierarchy;
    }
    return getNode(state, state.rootNodePath);
};


function _createHierarchyRecursive(bytes, parentNode, node, style, rootStyles, depth, maxDepth) {
    const updatedNode = {
        ...node,
        style,
        parent: parentNode,
        isViewRoot: !!rootStyles[node.type] || !!rootStyles[node.implementation],
    };
    if (depth < maxDepth && style.renderer.parser != null) {
        const parserConfig = style.renderer.parser;
        if (parserConfig.type === "bytes") {
            const nodeBytes = getNodeBytes(bytes, node);
            if (nodeBytes.length % parserConfig.size) {
                throw new Error(
                    `The size of the node data (${nodeBytes.length}) should be a multiple of ${parserConfig.size()}`
                )
            }
            updatedNode.children = [];
            const nodeView = new DataView(nodeBytes.buffer);
            for(let offset = 0, index = 0; offset < nodeBytes.length; offset += parserConfig.size, index++) {
                const value = nodeView[parserConfig.getter](offset, parserConfig.endianness === "little");
                const child = {
                    style: style,
                    isViewRoot: false,
                    type: parserConfig.model_type,
                    implementation: parserConfig.model_implementation,
                    description: parserConfig.model_description,
                    unpacked: true,
                    bitSize: parserConfig.size * 8,
                    isEmpty: value === 0,
                    valueName: null,
                    valueDescription: null,
                    value: value,
                    index: index,
                    parent: updatedNode,
                    bitOffset: node.bitOffset + offset * 8,
                };
                if (style.styles != null) {
                    child.style = style.styles[child.implementation] || style.styles[child.type] || style;
                }
                updatedNode.children.push(child)
            }
            node.children = updatedNode.children;
        } else {
            throw new Error(`Unknown parser type ${parserConfig.type}`)
        }
    } else if (depth < maxDepth && node.children != null) {
        updatedNode.children = node.children.map(child => {
            let childStyle = style;
            if (style.styles != null) {
                childStyle = style.styles[child.implementation] || style.styles[child.type] || style;
            }
            return _createHierarchyRecursive(
                bytes,
                updatedNode,
                child,
                childStyle,
                rootStyles,
                depth + 1,
                childStyle && childStyle.depth != null ? childStyle.depth : maxDepth
            );
        })
    } else {
        updatedNode.children = null;
    }
    return updatedNode;
}

export const createRootHierarchy = (state) => {
    const rootPath = state.rootNodePath,
        styles = state.styles;
    if (state.hierarchy == null || rootPath == null) {
        return null;
    }
    const rootNode = getNode(state, rootPath);
    if (rootNode == null) {
        throw Error(`The node at path ${rootPath} does not exist.`);
    }
    const style = styles[rootNode.implementation] || styles[rootNode.type];
    if (style == null) {
        throw Error(`No style found for root node of type "${rootNode.type}".`)
    }
    return _createHierarchyRecursive(state.bytes, null, rootNode, style, styles, 0, style.depth);
};


export default class BitstreamStore extends Store {
    constructor() {
        super({
            styles: null,
            hierarchy: null,
            bytes: null,
            selectedNodePath: [],
            deepSelectedNodePath: [],
            rootNodePath: [],
            dataIsModified: false,
            dataLoadError: null,
            dataIsLoading: false
        });
    }

    setHierarchy(hierarchy, bytes, styles) {
        this._setState({
            ...this._state,
            styles,
            hierarchy,
            bytes,
            dataLoadError: null,
            dataIsLoading: false,
            dataIsModified: false,
        });
    }

    setDataLoading(dataIsLoading) {
        this._setState({
            ...this._state,
            hierarchy: null,
            bytes: null,
            dataLoadError: null,
            dataIsModified: false,
            dataIsLoading
        });
    }

    setDataLoadError(loadError) {
        this._setState({
            ...this._state,
            hierarchy: null,
            bytes: null,
            dataLoadError: loadError,
            dataIsLoading: false,
            dataIsModified: false,
        });
    }

    setDataModified() {
        this._setState({
            ...this._state,
            dataIsModified: true,
        });
    }

    setStyles(styles) {
        this._setState({
            ...this._state,
            styles,
        });
    }

    setSelectedNode(selectedNodePath) {
        this._setState({
            ...this._state,
            ...this._buildSelectedNode(selectedNodePath),
        });
    }

    setRootNode(path, selectedNodePath) {
        this._setState({
            ...this._state,
            ...this._buildSelectedNode(selectedNodePath),
            rootNodePath: path,
        });
    }

    _buildSelectedNode(selectedNodePath) {
        if (selectedNodePath == null ||
            (this._state.selectedNodePath != null && arrayEqual(selectedNodePath, this._state.selectedNodePath))
        ) {
            // No state override
            return {}
        }
        let deepSelectedNodePath = this._state.deepSelectedNodePath;
        if (
            selectedNodePath.length > deepSelectedNodePath.length ||
            !arrayEqual(deepSelectedNodePath.slice(0, selectedNodePath.length), selectedNodePath)
        ) {
                deepSelectedNodePath = selectedNodePath;
        }
        return {
            selectedNodePath,
            deepSelectedNodePath
        }
    }
}