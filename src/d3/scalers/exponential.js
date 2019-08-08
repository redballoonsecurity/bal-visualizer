export default function exponentialScaler(node, scalerConfig) {
    // Apply the exponential scalers to the children
    const exponent = scalerConfig.exponent;
    node.children.forEach(child => {
        child.value = Math.pow(child.data.bitSize, exponent);
    });
    // Scale the new value of the children so they aggregate to the node's value
    const total_children_size = node.children.reduce((size, child) => child.value + size, 0);
    const update_ratio = node.value / total_children_size;
    node.children.forEach(child => {
        child.value = update_ratio * child.value
    });
}