import { AllowedZodSchemaInput, Model, ZodToInputOptions } from './types'
import { parseZodSchema } from './utils/parse-zod-schema'
import { parsedZodSchemaToModel } from './utils/parsed-zod-schema-to-graphql'

/**
 * Converts a Zod schema to an input type.
 *
 * @param zodSchema The Zod schema to convert.
 * @param options The options to use.
 * @returns The input type to be used with @nestjs/graphql.
 * @example
 * ```ts
 * import { z } from 'zod'
 * import { zodToInput, InferModel } from 'zod-type-graphql'
 *
 * const input = zodToInput(
 *    z.object({
 *       fullName: z.string(),
 *       age: z.number().int(),
 *       email: z.string().email(),
 *       phone: z.string().optional(),
 *   }),
 *   {
 *       name: 'User',
 *   }
 * )
 *
 * type Input = InferModel<typeof input>
 *
 * ```
 *
 */
export function zodToInput<T extends AllowedZodSchemaInput>(
    zodSchema: T,
    options: ZodToInputOptions<T>
): Model<T>
export function zodToInput<T extends AllowedZodSchemaInput>(
    zodSchema: T,
    options: ZodToInputOptions<T>
): [Model<T>]
export function zodToInput<T extends AllowedZodSchemaInput>(
    zodSchema: T,
    options: ZodToInputOptions<T>
): Model<T> | [Model<T>] {
    return parsedZodSchemaToModel(
        parseZodSchema(zodSchema),
        options,
        'InputType'
    )
}
