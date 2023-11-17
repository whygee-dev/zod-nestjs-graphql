import 'reflect-metadata'
import { Class } from '../types/utility'
import {
    AllowedZodSchemaInput,
    AllowedZodTypes,
    Model,
    ModelMap,
    ModelMapValue,
    ParsedZodSchema,
    ZodToModelOptions,
} from '../types'
import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql'
import { stringArrayToEnum } from './string-array-to-enum'
import { ensurePascalCase } from './ensure-pascal-case'
import { get } from 'lodash'
import { isEnum } from './is-enum'

const defineClassName = (model: Class, name: string) => {
    Object.defineProperty(model, 'name', {
        value: name,
    })
}

const getScalar = (type: AllowedZodTypes, keys?: string[], name?: string) => {
    switch (type) {
        case AllowedZodTypes.ZodString:
            return String

        case AllowedZodTypes.ZodBoolean:
            return Boolean

        case AllowedZodTypes.ZodNumber:
            return Float

        case AllowedZodTypes.ZodInt:
            return Int

        case AllowedZodTypes.ZodDate:
            return Date

        case AllowedZodTypes.ZodEnum:
        case AllowedZodTypes.ZodNativeEnum:
            if (!keys) {
                throw new Error('Keys must be defined')
            }

            if (!name) {
                throw new Error('Name must be defined')
            }

            const generatedEnum = stringArrayToEnum(keys)

            registerEnumType(generatedEnum, {
                name: ensurePascalCase(name),
            })

            return generatedEnum
    }

    return null
}

type DefinePropertyArgs = {
    model: Class
    name: string
    type: AllowedZodTypes
    nullable: boolean
    keys?: string[]
    customType?: ModelMapValue
    enumName?: string
}

const defineProperty = ({
    model,
    name,
    type,
    keys,
    nullable,
    customType,
    enumName,
}: DefinePropertyArgs) => {
    if (isEnum(type) && !enumName) {
        throw new Error('Enum name must be defined')
    }

    if (customType) {
        Field(() => customType, { nullable })(model.prototype, name)

        return
    }

    const scalar = getScalar(type, keys, ensurePascalCase(enumName ?? name))

    if (!scalar) {
        throw new Error(
            `Type of '${name}' not supported, consider providing a custom type via the map option`
        )
    }

    Field(() => scalar, { nullable })(model.prototype, name)
}

type DefinePropertiesRecursivelyArgs = {
    model: Class
    parsedZodSchema: ParsedZodSchema
    map: ModelMap<AllowedZodSchemaInput>
    name: string
    currentKey?: string
    type: 'ObjectType' | 'InputType'
    separator?: string
}

const definePropertiesRecursively = ({
    model,
    parsedZodSchema,
    map,
    name,
    currentKey = '',
    type,
    separator = '_',
}: DefinePropertiesRecursivelyArgs) => {
    if (parsedZodSchema.type === AllowedZodTypes.ZodObject) {
        defineClassName(model, name)

        for (const [key, val] of Object.entries(
            parsedZodSchema.properties ?? {}
        )) {
            const pathKey = currentKey !== '' ? `${currentKey}.${key}` : key
            const mapped = get(map, pathKey)

            const newName = `${name}${separator}${ensurePascalCase(key)}`

            if ('properties' in val) {
                defineProperty({
                    ...val,
                    model,
                    name: key,
                    customType:
                        mapped ??
                        definePropertiesRecursively({
                            model: class {},
                            parsedZodSchema: val,
                            map,
                            name: newName,
                            currentKey: pathKey,
                            type,
                        }),
                })

                continue
            }

            if ('element' in val) {
                const elementType =
                    mapped ??
                    ((val.element.type === AllowedZodTypes.ZodObject
                        ? [
                              definePropertiesRecursively({
                                  model: class {},
                                  parsedZodSchema: val.element,
                                  map,
                                  name: newName,
                                  currentKey: pathKey,
                                  type,
                              }),
                          ]
                        : [
                              getScalar(
                                  val.element.type,
                                  'keys' in val.element
                                      ? val.element.keys
                                      : undefined,
                                  newName
                              ),
                          ]) as ModelMapValue)

                defineProperty({
                    ...val,
                    model,
                    name: key,
                    customType: elementType,
                })

                continue
            }

            defineProperty({
                ...val,
                model,
                name: key,
                customType: mapped,
                enumName: newName,
            })
        }
    }

    if (
        parsedZodSchema.type === AllowedZodTypes.ZodArray &&
        'element' in parsedZodSchema
    ) {
        if (parsedZodSchema.element.type === AllowedZodTypes.ZodObject) {
            definePropertiesRecursively({
                model,
                parsedZodSchema: parsedZodSchema.element,
                map,
                name,
                currentKey,
                type,
            })
        } else {
            defineProperty({
                ...parsedZodSchema.element,
                model,
                name,
                customType: get(map, currentKey),
            })
        }
    }

    if (type === 'ObjectType') {
        ObjectType()(model)
    } else {
        InputType()(model)
    }

    return model
}

export const parsedZodSchemaToModel = <T extends AllowedZodSchemaInput>(
    parsedZodSchema: ParsedZodSchema,
    { map, name, separator }: ZodToModelOptions<T>,
    type: 'ObjectType' | 'InputType'
): Model<T> | [Model<T>] => {
    const model = class {}

    definePropertiesRecursively({
        model,
        parsedZodSchema,
        map: map ?? {},
        name,
        currentKey: '',
        type,
        separator,
    })

    if (parsedZodSchema.type === AllowedZodTypes.ZodArray) {
        return [model]
    }

    return model
}
