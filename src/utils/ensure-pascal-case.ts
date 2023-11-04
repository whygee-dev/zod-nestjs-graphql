export const ensurePascalCase = (str: string): string => {
    return str.length ? str.at(0)!.toUpperCase() + str.slice(1) : str
}
