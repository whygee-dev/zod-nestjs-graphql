import { z, AnyZodObject, TypeOf, EnumLike } from 'zod'
import { Class, NestedObjectPaths } from './utility'
import { GraphQLScalarType } from 'graphql'

export enum AllowedZodTypes {
    ZodObject = 'ZodObject',
    ZodString = 'ZodString',
    ZodNumber = 'ZodNumber',
    ZodInt = 'ZodInt',
    ZodBoolean = 'ZodBoolean',
    ZodDate = 'ZodDate',
    ZodNativeEnum = 'ZodNativeEnum',
    ZodEnum = 'ZodEnum',
    ZodArray = 'ZodArray',
}

export type AllowedZodSchemaInput =
    | AnyZodObject
    | z.ZodString
    | z.ZodNumber
    | z.ZodBoolean
    | z.ZodDate
    | z.ZodNativeEnum<any>
    | z.ZodEnum<any>
    | z.ZodArray<any>

export type ParsedZodSchema =
    | {
          type: AllowedZodTypes
          properties?: Record<string, ParsedZodSchema>
          nullable: boolean
      }
    | {
          type: AllowedZodTypes.ZodArray
          element: ParsedZodSchema
          nullable: boolean
      }
    | {
          type: AllowedZodTypes.ZodEnum
          keys: string[]
          nullable: boolean
      }
    | {
          type: AllowedZodTypes.ZodNativeEnum
          keys: string[]
          nullable: boolean
      }

export type ModelMapValue =
    | Class
    | [Class]
    | EnumLike
    | GraphQLScalarType
    | [GraphQLScalarType]

export type ModelMap<T extends AllowedZodSchemaInput> = Partial<
    Record<NestedObjectPaths<TypeOf<T>>, ModelMapValue>
>

export type ZodToModelOptions<T extends AllowedZodSchemaInput> = {
    name: string
    separator?: string
    map?: ModelMap<T>
}

export type ZodToInputOptions<T extends AllowedZodSchemaInput> =
    ZodToModelOptions<T>

export type Model<T extends AllowedZodSchemaInput> = { new (): TypeOf<T> }

export type InferModel<T extends Model<any> | [Model<any>]> = T extends [
    infer U
]
    ? U extends Model<any>
        ? InstanceType<U>[]
        : never
    : T extends Model<any>
    ? InstanceType<T>
    : never
