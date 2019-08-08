export function arrayEqual(arr1, arr2) {
    const length = arr1.length;
    if (length !== arr2.length) return false;
    for (let i = 0; i < length; i++)
        if (arr1[i] !== arr2[i])
            return false;
    return true;
}