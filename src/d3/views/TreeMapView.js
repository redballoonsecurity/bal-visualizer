import D3View from "./D3View.js";
import {randomColor} from "randomcolor";

export default class TreeMapView extends D3View {
    render(state, prevState) {
        // Render the selection
        if (state.domSelectedNodes != null &&
            (prevState == null || state.domSelectedNodes !== prevState.domSelectedNodes)
        ) {
            if (prevState != null && prevState.domSelectedNodes != null) {
                prevState.domSelectedNodes.forEach(domNode => {
                    domNode.classList.remove("outline");
                });
            }
            if (state.domSelectedNodes != null) {
                state.domSelectedNodes.forEach(domNode => {
                    domNode.classList.add("outline");
                });
            }
        }
    }

    createSVG() {
        const treeMapLayout = d3.treemap()
            .tile((parent, x0, y0, x1, y1) => {
                const style = parent.data.style;
                const tiler = this.d3Components.getTiler(style.renderer.tiler.type);
                return tiler(parent, x0, y0, x1, y1);
            })
            .size([this.domRoot.offsetWidth, this.domRoot.offsetHeight])
            .padding(1)
            .round(true);

        const root = treeMapLayout(this.hierarchy);
        const svg = d3.create("svg")
            .attr("viewBox", [0, 0, this.domRoot.offsetWidth, this.domRoot.offsetHeight])
            .style("font", "10px sans-serif");

        // Do the rectangle first so they are "under" the text.
        const shapeGroups = svg
            .append("g")
                .classed("shapes", true)
                .selectAll("g")
                .data(root.descendants())
                .join("g")
                    .attr("transform", d => `translate(${d.x0},${d.y0})`);

        shapeGroups.append("rect")
            .attr("fill", d => {
                if (d.children != null) {
                    // Transparent
                    return "rgba(0, 0, 0, 0)";
                }
                else if (!d.data.isEmpty) {
                    // A color related to the material UI purple and the type of the object.
                    return randomColor({
                        luminosity: 'light',
                        hue: "#3F51B5",
                        seed: d.data.type
                    })
                } else {
                    // Grey
                    return "rgb(200,200,200)";
                }
            })
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

        // Register the click events on the actual rectangle
        shapeGroups.filter(d => d.children == null)
            .on("click", this.onNodeClick.bind(this))
            .on("dblclick", this.onNodeDoubleClick.bind(this));


        const labelGroups = svg
            .append("g")
                .classed("labels", true)
                .selectAll("g")
                .data(root.descendants())
                .join("g")
                    .attr("transform", d => `translate(${d.x0},${d.y0})`);

        labelGroups
            .filter(n => {
                // Either the label is explicitly false, or it is not explicitly true but there are children.
                if (n.data.style.renderer.label === false ||
                    (n.children != null && n.data.style.renderer.label !== true)
                ) {
                    return false;
                }
                const width = n.x1 - n.x0, height = n.y1 - n.y0;
                if (height > width && width < 200) {
                    n.vertical = true
                }
                return (height > 15 && width > 50) || (width > 15 && height > 50)
            })
            .append("text")
                .classed("vertical", n => n.vertical)
                .classed("type", true)
                .append("tspan")
                .attr("x", n => n.vertical ? -5: 5)
                .attr("y", `1.1em`)
                .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
                .text(d => `${d.data.implementation ? d.data.implementation: d.data.type}`);

        labelGroups
            .filter(n => {
                if (!n.data.style.renderer.description || !n.data.description) {
                    return false;
                }
                const width = n.x1 - n.x0, height = n.y1 - n.y0;
                if (height > width && width < 200) {
                    n.vertical = true
                }
                return (height > 15 && width > 100) || (width > 15 && height > 100)
            })
            .append("text")
                .classed("vertical", n => n.vertical)
                .classed("description", true)
                .append("tspan")
                .attr("x", n => n.vertical ? -5: 5)
                .attr("y", `2.1em`)
                .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
                .text(d => d.data.description);

        labelGroups
            .filter(n => {
                const height = n.y1 - n.y0;
                if (height < 35) {
                    return false
                }
                return n.data.value != null && n.data.style.renderer.value !== false
            })
            .append("text")
                .attr("x", d => (d.x1 - d.x0) / 2)
                .attr("y", d => Math.max(22, (d.y1 - d.y0) / 2))
                .text(d => {
                    const intValue = `0x${d.data.value.toString(16)}`;
                    if (d.data.valueName == null) {
                        return intValue
                    }
                    return `${d.data.valueName} (${intValue})`
                })
                .classed("value", true);

        // The Element is provided as the callback's context, preventing the use of the arrow syntax and requiring to
        // make the TreeMapView instance available in another way.
        const registerElements = this.registerElements.bind(this);
        shapeGroups.each(function(item){ registerElements(item, this) });

        return svg.node();
    }
}