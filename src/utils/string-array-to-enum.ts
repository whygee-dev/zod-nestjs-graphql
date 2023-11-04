export const stringArrayToEnum = <T extends string>(
    o: Array<T>
): { [K in T]: K } => {
    return o.reduce((res, key) => {
        res[key] = key
        return res
    }, {} as { [K in T]: K })
}
