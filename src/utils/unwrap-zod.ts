// Code copied and modified from:
// https://github.com/incetarik/nestjs-graphql-zod/blob/master/src/helpers/unwrap.ts
// Author: incetarik

import {
    ZodCatch,
    ZodDefault,
    ZodEffects,
    ZodLazy,
    ZodNullable,
    ZodOptional,
    ZodPromise,
    ZodTransformer,
    ZodType,
} from 'zod'

export type Prev = [
    never,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    ...0[]
]

/**
 * Unwraps any given zod type by one level.
 *
 * The supported zod wrappers are:
 * - {@link ZodCatch}
 * - {@link ZodDefault}
 * - {@link ZodEffects}
 * - {@link ZodLazy}
 * - {@link ZodNullable}
 * - {@link ZodOptional}
 * - {@link ZodPromise}
 * - {@link ZodTransformer}
 *
 * @template T The zod type.
 */
export type UnwrapNestedZod<T extends ZodType> = T extends ZodOptional<infer I>
    ? I
    : T extends ZodTransformer<infer I>
    ? I
    : T extends ZodDefault<infer I>
    ? I
    : T extends ZodEffects<infer I>
    ? I
    : T extends ZodNullable<infer I>
    ? I
    : T extends ZodCatch<infer I>
    ? I
    : T extends ZodPromise<infer I>
    ? I
    : T extends ZodLazy<infer I>
    ? I
    : T

/**
 * Unwraps any given zod type recursively.
 *
 * The supported zod wrappers are:
 * - {@link ZodCatch}
 * - {@link ZodDefault}
 * - {@link ZodEffects}
 * - {@link ZodLazy}
 * - {@link ZodNullable}
 * - {@link ZodOptional}
 * - {@link ZodPromise}
 * - {@link ZodTransformer}
 *
 * @template T The zod type.
 * @template Depth The maximum depth to unwrap, default `5`.
 */
export type UnwrapNestedZodRecursive<
    T extends ZodType,
    Depth extends number = 5
> = [Prev[Depth]] extends [never]
    ? never
    : [T] extends [UnwrapNestedZod<T>]
    ? T
    : UnwrapNestedZodRecursive<UnwrapNestedZod<T>, Prev[Depth]>

/**
 * Unwraps the zod object one level.
 *
 * The supported zod wrappers are:
 * - {@link ZodCatch}
 * - {@link ZodDefault}
 * - {@link ZodEffects}
 * - {@link ZodLazy}
 * - {@link ZodNullable}
 * - {@link ZodOptional}
 * - {@link ZodPromise}
 * - {@link ZodTransformer}
 *
 * @export
 * @template T The type of the input.
 * @param {T} input The zod input.
 * @return {UnwrapNestedZod<T>} The unwrapped zod instance.
 *
 * @__PURE__
 */
export function unwrapNestedZod<T extends ZodType>(
    input: T
): UnwrapNestedZod<T> {
    if (input instanceof ZodCatch) {
        return input._def.innerType as UnwrapNestedZod<T>
    }

    if (input instanceof ZodDefault) {
        return input._def.innerType as UnwrapNestedZod<T>
    }

    if (input instanceof ZodEffects) {
        return input.innerType() as UnwrapNestedZod<T>
    }

    if (input instanceof ZodLazy) {
        return input.schema as UnwrapNestedZod<T>
    }

    if (input instanceof ZodNullable) {
        return input.unwrap() as UnwrapNestedZod<T>
    }

    if (input instanceof ZodOptional) {
        return input.unwrap() as UnwrapNestedZod<T>
    }

    if (input instanceof ZodPromise) {
        return input.unwrap() as UnwrapNestedZod<T>
    }

    if (input instanceof ZodTransformer) {
        return input.innerType() as UnwrapNestedZod<T>
    }

    return input as UnwrapNestedZod<T>
}

/**
 * Unwraps the zob object recursively.
 *
 * @export
 * @template T The type of the input.
 * @template Depth The maximum depth for the recursion, `5` by default.
 * @param {T} input The zod input.
 * @return {UnwrapNestedZodRecursive<T, Depth>} The unwrapped zod instance.
 *
 * @__PURE__
 */
export function unwrapNestedZodRecursively<
    T extends ZodType,
    Depth extends number = 5
>(input: T): UnwrapNestedZodRecursive<T, Depth> {
    let current = input as ZodType

    for (const layer of iterateZodLayers(input)) {
        current = layer
    }

    return current as UnwrapNestedZodRecursive<T, Depth> & ZodType
}

/**
 * Iterates the zod layers by unwrapping the values of the following types:
 *
 * - {@link ZodCatch}
 * - {@link ZodDefault}
 * - {@link ZodEffects}
 * - {@link ZodLazy}
 * - {@link ZodNullable}
 * - {@link ZodOptional}
 * - {@link ZodPromise}
 * - {@link ZodTransformer}
 *
 * @export
 * @template T The input zod type.
 * @param {T} input The zod input.
 */
export function* iterateZodLayers<T extends ZodType>(input: T) {
    let current = input as ZodType
    let unwrapped = unwrapNestedZod(input) as ZodType

    while (unwrapped !== current) {
        yield current
        current = unwrapped
        unwrapped = unwrapNestedZod(current) as ZodType
    }

    yield current
}
