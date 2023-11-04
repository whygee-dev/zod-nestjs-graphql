import {
    AllowedZodSchemaInput,
    AllowedZodTypes,
    ParsedZodSchema,
} from '../types'
import { AnyZodObject, z } from 'zod'
import { unwrapNestedZodRecursively } from './unwrap-zod'

const computeObjectProperties = (schema: AnyZodObject) =>
    Object.keys(schema.shape).reduce<Record<string, ParsedZodSchema>>(
        (acc, key) => {
            const property = schema.shape[key]

            acc[key] = parseZodSchema(property)

            return acc
        },
        {}
    )

export const parseZodSchema = (
    zodSchema: AllowedZodSchemaInput
): ParsedZodSchema => {
    const unwrapped = unwrapNestedZodRecursively(zodSchema)
    const type = AllowedZodTypes[unwrapped._def.typeName]

    if (!type) {
        throw new Error(`Type ${unwrapped._def.typeName} is not supported`)
    }

    const nullable = zodSchema.isNullable() || zodSchema.isOptional()

    if (unwrapped instanceof z.ZodArray) {
        return {
            type: AllowedZodTypes.ZodArray,
            element: parseZodSchema(unwrapped.element),
            nullable,
        }
    }

    const isInt =
        unwrapped instanceof z.ZodNumber &&
        (unwrapped as z.ZodNumber)._def.checks.some(
            (check) => check.kind === 'int'
        )

    if (isInt) {
        return {
            type: AllowedZodTypes.ZodInt,
            nullable,
        }
    }

    const isObject = type === AllowedZodTypes.ZodObject

    if (isObject) {
        return {
            type,
            nullable,
            properties: computeObjectProperties(unwrapped as AnyZodObject),
        }
    }

    const isEnum =
        type === AllowedZodTypes.ZodEnum && unwrapped instanceof z.ZodEnum

    if (isEnum) {
        return {
            type,
            nullable,
            keys: unwrapped._def.values,
        }
    }

    const isNativeEnum =
        type === AllowedZodTypes.ZodNativeEnum &&
        unwrapped instanceof z.ZodNativeEnum

    if (isNativeEnum) {
        return {
            type,
            nullable,
            keys: Object.keys(unwrapped._def.values),
        }
    }

    return {
        type,
        nullable,
    }
}
