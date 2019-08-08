import View from "./View.js";
import {createRootHierarchy} from "../stores/BistreamStore.js";

export default class BitstreamView extends View {
    /**
     *
     * @param {Element} domRoot
     * @param {GlobalStore} globalStore
     * @param {BitstreamStore} bitstreamStore
     * @param {D3Components} d3Components
     */
    constructor(domRoot, globalStore, bitstreamStore, d3Components) {
        super({});
        this.bitstreamStore = bitstreamStore;
        this.globalStore = globalStore;
        this.d3Components = d3Components;

        this.domRoot = domRoot;
        this.domData = domRoot.querySelector(".data-view");
        this.domDataSvg = this.domData.querySelector(".svg-view");

        this.dataView = null
    }

    run() {
        this.registerEvents();
        this.updateBitstreamState(this.bitstreamStore.getState())
    }

    registerEvents() {
        this.bitstreamStore.addChangeListener((s, ps) => this.updateBitstreamState(s, ps));
    }

    updateBitstreamState(bitstreamState, prevBitstreamState) {
        const updatedState = {
            ...this.state,
            hierarchy: null
        };
        if (bitstreamState.dataIsLoading === true) {
            updatedState.className = "loading";
        } else if (bitstreamState.hierarchy == null) {
            updatedState.className = "select-file";
        } else {
            updatedState.className = "data";
            if (
                prevBitstreamState == null ||
                bitstreamState.hierarchy !== prevBitstreamState.hierarchy ||
                bitstreamState.rootNodePath !== prevBitstreamState.rootNodePath ||
                bitstreamState.styles !== prevBitstreamState.styles
            ) {
                updatedState.hierarchy = this.buildD3Hierarchy(createRootHierarchy(bitstreamState))
            } else {
                updatedState.hierarchy = this.state.hierarchy;
            }
        }
        this.setState(updatedState)
    }

    buildD3Hierarchy(hierarchyRaw) {
        // Set the value of the root value to an arbitrary value. For any given node, the sum of the children values
        // must equal the parent's value for the visualizations to render properly.
        const root = d3.hierarchy(hierarchyRaw);
        root.value = 1;
        root.eachBefore(node => {
            if (node.children == null) {
                return;
            }
            const scaler = this.d3Components.getScaler(node.data.style.scaler.type);
            scaler(node, node.data.style.scaler)
        });
        return root;
    }

    render(state, prevState) {
        if (state.className !== prevState.className) {
            if (prevState.className !== null) {
                this.domRoot.classList.remove(prevState.className);
            }
            if (state.className !== null) {
                this.domRoot.classList.add(state.className)
            }
        }

        if (state.hierarchy !== prevState.hierarchy) {
            if (this.dataView != null) {
                this.dataView.destroy();
                this.dataView = null;
            }
            if (state.hierarchy != null) {
                const rect = this.domDataSvg.getBoundingClientRect();
                this.domDataSvg.style.height = `${window.innerHeight - rect.top- 16}px`;

                const View = this.d3Components.getView(state.hierarchy.data.style.renderer.type);
                this.dataView = new View(
                    this.domDataSvg,
                    this.globalStore,
                    this.bitstreamStore,
                    this.d3Components,
                    state.hierarchy
                );
                this.dataView.run()
            }
        }
    }
}