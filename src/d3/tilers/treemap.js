export function treemapTable(parent, x0, y0, x1, y1) {
    const style = parent.data.style;
    const columnCount = Math.min(style.renderer.tiler.columns, parent.children.length);
    const rows = Math.ceil(parent.children.length / columnCount);
    const rowHeight = (y1 - y0) / rows;
    const columnWidth = (x1 - x0) / columnCount;
    let i = 0;
    while(i < parent.children.length) {
        const node = parent.children[i];
        const columnIndex = i % 3;
        const rowIndex = Math.floor(i / 3);
        node.y0 = y0 + rowIndex * rowHeight;
        node.y1 = node.y0 + rowHeight;
        node.x0 = x0 + columnIndex * columnWidth;
        node.x1 = node.x0 + columnWidth;
        i++;
    }
}


export function treemapSliceDice(parent, x0, y0, x1, y1) {
    (parent.depth & 1 ? d3.treemapSlice : d3.treemapDice)(parent, x0, y0, x1, y1);
}


export function treemapDiceSlice(parent, x0, y0, x1, y1) {
    (parent.depth & 1 ? d3.treemapDice : d3.treemapSlice)(parent, x0, y0, x1, y1);
}

export function treemapSlice(parent, x0, y0, x1, y1) {
    return d3.treemapSlice(parent, x0, y0, x1, y1);
}

export function treemapDice(parent, x0, y0, x1, y1) {
    return d3.treemapDice(parent, x0, y0, x1, y1);
}