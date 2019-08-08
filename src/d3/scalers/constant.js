export default function constantScaler(node) {
    const child_value = node.value / node.children.length;
    node.children.forEach(child => {
        child.value = child_value;
    });
}