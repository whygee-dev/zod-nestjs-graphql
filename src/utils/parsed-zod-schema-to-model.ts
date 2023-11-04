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
} from 'type-graphql'
import { stringArrayToEnum } from './string-array-to-enum'
import { ensurePascalCase } from './ensure-pascal-case'
import { get } from 'lodash'

const defineClassName = (model: Class, name: string) => {
    Object.defineProperty(model, 'name', {
        value: name,
    })
}

const defineProperty = (
    model: Class,
    name: string,
    {
        type,
        keys,
        nullable,
        customType,
    }: {
        type: AllowedZodTypes
        nullable: boolean
        keys?: string[]
        customType?: ModelMapValue
    }
) => {
    model.prototype[name] = customType ?? true

    if (customType) {
        Field(() => customType, { nullable, name })(model.prototype, name)

        return
    }

    switch (type) {
        case AllowedZodTypes.ZodString:
            Field(() => String, { nullable, name })(model.prototype, name)
            break

        case AllowedZodTypes.ZodBoolean:
            Field(() => Boolean, { nullable, name })(model.prototype, name)
            break

        case AllowedZodTypes.ZodNumber:
            Field(() => Float, { nullable, name })(model.prototype, name)
            break

        case AllowedZodTypes.ZodInt:
            Field(() => Int, { nullable, name })(model.prototype, name)
            break

        case AllowedZodTypes.ZodDate:
            Field(() => Date, { nullable, name })(model.prototype, name)
            break

        case AllowedZodTypes.ZodEnum:
        case AllowedZodTypes.ZodNativeEnum:
            if (!keys) {
                throw new Error('Keys must be defined')
            }

            const generatedEnum = stringArrayToEnum(keys)

            registerEnumType(generatedEnum, {
                name: ensurePascalCase(name),
            })

            Field(() => generatedEnum, { nullable, name })(
                model.prototype,
                name
            )
            break
    }
}

const definePropertiesRecursively = (
    model: Class,
    parsedZodSchema: ParsedZodSchema,
    map: ModelMap<AllowedZodSchemaInput>,
    name: string,
    type: 'ObjectType' | 'InputType'
) => {
    if (parsedZodSchema.type === AllowedZodTypes.ZodObject) {
        defineClassName(model, name)

        for (const [key, val] of Object.entries(
            parsedZodSchema.properties ?? {}
        )) {
            const mapped = get(map, key)
            const newName = `${name}_${ensurePascalCase(key)}`

            if ('properties' in val) {
                defineProperty(model, key, {
                    ...val,
                    customType:
                        mapped ??
                        definePropertiesRecursively(
                            class {},
                            val,
                            map,
                            newName,
                            type
                        ),
                })

                continue
            }

            if ('element' in val) {
                defineProperty(model, key, {
                    ...val,
                    customType: mapped ?? [
                        definePropertiesRecursively(
                            class {},
                            val.element,
                            map,
                            newName,
                            type
                        ),
                    ],
                })

                continue
            }

            defineProperty(model, key, {
                ...val,
                customType: get(map, key),
            })
        }
    }

    if (
        parsedZodSchema.type === AllowedZodTypes.ZodArray &&
        'element' in parsedZodSchema
    ) {
        definePropertiesRecursively(
            model,
            parsedZodSchema.element,
            map,
            name,
            type
        )
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
    options: ZodToModelOptions<T>,
    type: 'ObjectType' | 'InputType'
): Model<T> | [Model<T>] => {
    const model = class {}

    definePropertiesRecursively(
        model,
        parsedZodSchema,
        options.map ?? {},
        options.name,
        type
    )

    if (parsedZodSchema.type === AllowedZodTypes.ZodArray) {
        return [model]
    }

    return model
}
