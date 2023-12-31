import { AllowedZodSchemaInput, Model, ZodToModelOptions } from './types'
import { parseZodSchema } from './utils/parse-zod-schema'
import { parsedZodSchemaToModel } from './utils/parsed-zod-schema-to-graphql'

/**
 * Converts a Zod schema to a model type.
 *
 * @param zodSchema The Zod schema to convert.
 * @param options The options to use.
 * @returns The model type to be used with @nestjs/graphql.
 * @example
 * ```ts
 * import { z } from 'zod'
 * import { zodToModel, InferModel } from 'zod-nestjs-graphql'
 *
 * const model = zodToModel(
 *    z.object({
 *      fullName: z.string(),
 *      age: z.number().int(),
 *      email: z.string().email(),
 *      phone: z.string().optional(),
 *    }),
 *    {
 *      name: 'User',
 *    }
 * )
 *
 * type Model = InferModel<typeof model>
 *
 * ```
 */
export function zodToModel<T extends AllowedZodSchemaInput>(
    zodSchema: T,
    options: ZodToModelOptions<T>
): Model<T>
export function zodToModel<T extends AllowedZodSchemaInput>(
    zodSchema: T,
    options: ZodToModelOptions<T>
): [Model<T>]
export function zodToModel<T extends AllowedZodSchemaInput>(
    zodSchema: T,
    options: ZodToModelOptions<T>
): Model<T> | [Model<T>] {
    return parsedZodSchemaToModel(
        parseZodSchema(zodSchema),
        options,
        'ObjectType'
    )
}
