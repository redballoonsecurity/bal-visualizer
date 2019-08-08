import BistreamStore from "./stores/BistreamStore.js";
import GlobalStore from "./stores/GlobalStore.js"

import ActionsView from "./views/ActionsView.js"
import BitstreamBreadCrumbsView from "./views/BitstreamBreadCrumbsView.js";
import BitstreamBytesView from "./views/BitstreamBytesView.js";
import BitstreamInfoView from "./views/BitstreamInfoView.js";
import BitstreamView from "./views/BitstreamView.js";
import HelpDialogView from "./views/HelpDialogView.js"
import SnackbarView from "./views/SnackbarView.js";

import D3Components from "./d3/D3Components.js";
import treeRenderer from "./d3/views/TreeView.js";
import treeMapRenderer from "./d3/views/TreeMapView.js";
import exponentialScaler from "./d3/scalers/exponential.js";
import constantScaler from "./d3/scalers/constant.js";
import {treemapTable, treemapDiceSlice, treemapSliceDice, treemapDice, treemapSlice} from "./d3/tilers/treemap.js";

function bootstrap() {
    const globalStore = new GlobalStore();
    const bitstreamStore = new BistreamStore();

    const domMenuRoot = document.getElementsByClassName("menu-view")[0];
    const domHelpDialog = document.getElementsByClassName("help-dialog-view")[0];
    const domBitstreamCrumbs = document.getElementsByClassName("crumbs-view")[0];
    const domBitstreamInfo = document.getElementsByClassName("info-view")[0];
    const domBitstreamBytes = document.getElementsByClassName("bytes-view")[0];
    const domBitstream = document.getElementsByClassName("bitstream-view")[0];
    const domSnackbar = document.getElementsByClassName("snackbar-view")[0];

    const d3Components = new D3Components();
    d3Components.addViews([
        treeRenderer,
        treeMapRenderer,
    ]);
    d3Components.addScalers([
        constantScaler,
        exponentialScaler,
    ]);
    d3Components.addTilers([
        treemapDice,
        treemapSlice,
        treemapSliceDice,
        treemapDiceSlice,
        treemapTable,
    ]);

    const views = [
        // new HelpDialogView(domHelpDialog, globalStore),
        new ActionsView(domMenuRoot, globalStore, bitstreamStore),
        new BitstreamView(domBitstream, globalStore, bitstreamStore, d3Components),
        new BitstreamBreadCrumbsView(domBitstreamCrumbs, bitstreamStore),
        new BitstreamInfoView(domBitstreamInfo, bitstreamStore),
        new BitstreamBytesView(domBitstreamBytes, globalStore, bitstreamStore),
        new SnackbarView(domSnackbar, globalStore, bitstreamStore),
    ];

    views.forEach(view => view.run());
}
bootstrap();