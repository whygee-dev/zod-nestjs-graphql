import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { parseZodSchema } from './parse-zod-schema'
import { parsedZodSchemaToModel } from './parsed-zod-schema-to-graphql'
import {
    Field,
    GraphQLSchemaBuilderModule,
    GraphQLSchemaFactory,
    Int,
    ObjectType,
    Query,
    Resolver,
    registerEnumType,
} from '@nestjs/graphql'
import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import { NestFactory } from '@nestjs/core'
import { INestApplication } from '@nestjs/common'
import cuid from 'cuid'
import { ensurePascalCase } from './ensure-pascal-case'

const getSchemaFactory = async () => {
    const app = await NestFactory.create(GraphQLSchemaBuilderModule)
    await app.init()

    return { app, factory: app.get(GraphQLSchemaFactory) }
}

const getFields = (schema: GraphQLSchema, name: string) =>
    (schema.getType(name) as GraphQLObjectType)?.getFields()

describe('parsedZodSchemaToModel', () => {
    let app: INestApplication, factory: GraphQLSchemaFactory

    beforeEach(async () => {
        const schemaFactory = await getSchemaFactory()
        app = schemaFactory.app
        factory = schemaFactory.factory
    })

    afterEach(async () => {
        await app.close()
    })

    test('should return the model of an object with diverse properties', async () => {
        // Arrange
        enum TestEnum {
            A = 'A',
            B = 'B',
        }

        const zodEnum = z.enum(['A', 'B'])

        const parsedZodSchema = parseZodSchema(
            z.object({
                stringField: z.string(),
                optionalStringField: z.string().optional(),

                numberField: z.number(),
                optionalNumberField: z.number().optional(),

                booleanField: z.boolean(),
                optionalBooleanField: z.boolean().optional(),

                intField: z.number().int(),
                optionalIntField: z.number().int().optional(),

                dateField: z.date(),
                optionalDateField: z.date().optional(),

                nativeEnumField: z.nativeEnum(TestEnum),
                nativeEnumOptionalField: z.nativeEnum(TestEnum).optional(),

                enumField: zodEnum,
                optionalEnumField: zodEnum.optional(),

                stringArrayField: z.array(z.string()),
                optionalStringArrayField: z.array(z.string()).optional(),
            })
        )

        // Act
        const model = parsedZodSchemaToModel(
            parsedZodSchema,
            {
                name: 'Test',
            },
            'ObjectType'
        )

        // Assert
        @Resolver()
        class TestResolver {
            @Query(() => model)
            test() {
                return model
            }
        }

        const schema = await factory.create([TestResolver])

        const fields = getFields(schema, 'Test')

        expect(fields.intField.type.toString()).toEqual('Int!')
        expect(fields.optionalIntField.type.toString()).toEqual('Int')

        expect(fields.stringField.type.toString()).toEqual('String!')
        expect(fields.optionalStringField.type.toString()).toEqual('String')

        expect(fields.numberField.type.toString()).toEqual('Float!')
        expect(fields.optionalNumberField.type.toString()).toEqual('Float')

        expect(fields.booleanField.type.toString()).toEqual('Boolean!')
        expect(fields.optionalBooleanField.type.toString()).toEqual('Boolean')

        expect(fields.dateField.type.toString()).toEqual('DateTime!')
        expect(fields.optionalDateField.type.toString()).toEqual('DateTime')

        expect(fields.stringArrayField.type.toString()).toEqual('[String!]!')
        expect(fields.optionalStringArrayField.type.toString()).toEqual(
            '[String!]'
        )

        expect(fields.nativeEnumField.type.toString()).toEqual(
            'Test_NativeEnumField!'
        )
        expect(fields.nativeEnumOptionalField.type.toString()).toEqual(
            'Test_NativeEnumOptionalField'
        )

        expect(fields.enumField.type.toString()).toEqual('Test_EnumField!')
        expect(fields.optionalEnumField.type.toString()).toEqual(
            'Test_OptionalEnumField'
        )

        expect(fields.stringArrayField.type.toString()).toEqual('[String!]!')
        expect(fields.optionalStringArrayField.type.toString()).toEqual(
            '[String!]'
        )
    })

    test('should return the model of a nested object', async () => {
        // Arrange
        const parsedZodSchema = parseZodSchema(
            z.object({
                nested: z.object({
                    stringField: z.string(),
                    numberField: z.number(),
                    nestedEvenMore: z.object({
                        stringField: z.string(),
                    }),
                    optionalNestedEvenMore: z
                        .object({
                            booleanField: z.boolean(),
                        })
                        .optional(),
                }),
            })
        )

        // Act
        const model = parsedZodSchemaToModel(
            parsedZodSchema,
            {
                name: 'Test',
            },
            'ObjectType'
        )

        // Assert
        @Resolver()
        class TestResolver {
            @Query(() => model)
            test() {
                return model
            }
        }

        const schema = await factory.create([TestResolver])

        const testFields = getFields(schema, 'Test')
        const testNestedFields = getFields(schema, 'Test_Nested')
        const testNestedEvenMoreFields = getFields(
            schema,
            'Test_Nested_NestedEvenMore'
        )
        const testOptionalNestedEvenMoreFields = getFields(
            schema,
            'Test_Nested_OptionalNestedEvenMore'
        )

        expect(testFields.nested.type.toString()).toEqual('Test_Nested!')
        expect(testNestedFields.stringField.type.toString()).toEqual('String!')
        expect(testNestedFields.numberField.type.toString()).toEqual('Float!')
        expect(testNestedFields.nestedEvenMore.type.toString()).toEqual(
            'Test_Nested_NestedEvenMore!'
        )
        expect(testNestedFields.optionalNestedEvenMore.type.toString()).toEqual(
            'Test_Nested_OptionalNestedEvenMore'
        )

        expect(testNestedEvenMoreFields.stringField.type.toString()).toEqual(
            'String!'
        )
        expect(
            testOptionalNestedEvenMoreFields.booleanField.type.toString()
        ).toEqual('Boolean!')
    })

    test('should return the model of an array of object', async () => {
        // Arrange
        const parsedZodSchema = parseZodSchema(
            z.array(
                z.object({
                    stringField: z.string(),
                })
            )
        )

        // Act
        const model = parsedZodSchemaToModel(
            parsedZodSchema,
            {
                name: 'Test',
            },
            'ObjectType'
        )

        // Assert
        @Resolver()
        class TestResolver {
            @Query(() => model)
            test() {
                return model
            }
        }

        const schema = await factory.create([TestResolver])

        const fields = getFields(schema, 'Test')

        const query = getFields(schema, 'Query').test

        expect(fields.stringField.type.toString()).toEqual('String!')
        expect(query.type.toString()).toEqual('[Test!]!')
    })

    test('should return the model of a mix of nested arrays objects', async () => {
        // Arrange
        const parsedZodSchema = parseZodSchema(
            z.object({
                array: z.array(
                    z.object({
                        stringField: z.string(),
                        nested: z.array(
                            z.object({
                                numberField: z.number(),
                            })
                        ),
                    })
                ),
                simpleObject: z.object({
                    stringField: z.string(),
                }),
            })
        )

        // Act
        const model = parsedZodSchemaToModel(
            parsedZodSchema,
            {
                name: 'Test',
            },
            'ObjectType'
        )

        // Assert
        @Resolver()
        class TestResolver {
            @Query(() => model)
            test() {
                return model
            }
        }

        const schema = await factory.create([TestResolver])

        const testFields = getFields(schema, 'Test')
        const testSimpleObjectFields = getFields(schema, 'Test_SimpleObject')
        const testArrayFields = getFields(schema, 'Test_Array')
        const testArrayNestedFields = getFields(schema, 'Test_Array_Nested')

        const query = getFields(schema, 'Query').test

        expect(testFields.array.type.toString()).toEqual('[Test_Array!]!')
        expect(testFields.simpleObject.type.toString()).toEqual(
            'Test_SimpleObject!'
        )

        expect(testSimpleObjectFields.stringField.type.toString()).toEqual(
            'String!'
        )

        expect(testArrayFields.stringField.type.toString()).toEqual('String!')
        expect(testArrayFields.nested.type.toString()).toEqual(
            '[Test_Array_Nested!]!'
        )

        expect(testArrayNestedFields.numberField.type.toString()).toEqual(
            'Float!'
        )

        expect(query.type.toString()).toEqual('Test!')
    })

    test('should return the model taking into account a custom separator', async () => {
        // Arrange

        const id = cuid()
        const simpleObjectId = `simpleObject${id}`

        const parsedZodSchema = parseZodSchema(
            z.object({
                [simpleObjectId]: z.object({
                    stringField: z.string(),
                }),
            })
        )

        // Act
        const model = parsedZodSchemaToModel(
            parsedZodSchema,
            {
                name: 'Test',
                separator: '7',
            },
            'ObjectType'
        )

        // Assert
        @Resolver()
        class TestResolver {
            @Query(() => model)
            test() {
                return model
            }
        }

        const schema = await factory.create([TestResolver])

        const testFields = getFields(schema, 'Test')
        const testSimpleObjectFields = getFields(
            schema,
            `Test7${ensurePascalCase(simpleObjectId)}`
        )

        expect(testFields[simpleObjectId].type.toString()).toEqual(
            `Test7${ensurePascalCase(simpleObjectId)}!`
        )

        expect(testSimpleObjectFields.stringField.type.toString()).toEqual(
            'String!'
        )
    })

    test('should return the model of objects and enum taking into account model mapping', async () => {
        // Arrange
        enum TestEnum {
            A = 'A',
            B = 'B',
        }

        const id = cuid()
        const simpleObjectId = `simpleObject${id}`
        const simpleObject2Id = `simpleObject2${id}`

        const parsedZodSchema = parseZodSchema(
            z.object({
                [simpleObjectId]: z.object({
                    stringField: z.string(),
                }),
                [simpleObject2Id]: z.object({
                    stringField: z.string(),
                }),
                enumField: z.nativeEnum(TestEnum),
            })
        )

        @ObjectType()
        class TestObject {
            @Field(() => String)
            modifiedStringField!: string
        }

        registerEnumType(TestEnum, {
            name: 'ModifiedTestEnum',
        })

        // Act
        const model = parsedZodSchemaToModel(
            parsedZodSchema,
            {
                name: 'Test',
                map: {
                    [simpleObjectId]: TestObject,
                    enumField: TestEnum,
                },
            },
            'ObjectType'
        )

        // Assert
        @Resolver()
        class TestResolver {
            @Query(() => model)
            test() {
                return model
            }
        }

        const schema = await factory.create([TestResolver])

        const testFields = getFields(schema, 'Test')
        const testSimpleObjectFields = getFields(schema, 'TestObject')
        const testSimpleObject2Fields = getFields(
            schema,
            `Test_${ensurePascalCase(simpleObject2Id)}`
        )

        expect(testFields[simpleObjectId].type.toString()).toEqual(
            'TestObject!'
        )
        expect(testFields[simpleObject2Id].type.toString()).toEqual(
            `Test_${ensurePascalCase(simpleObject2Id)}!`
        )
        expect(testFields.enumField.type.toString()).toEqual(
            'ModifiedTestEnum!'
        )

        expect(
            testSimpleObjectFields.modifiedStringField.type.toString()
        ).toEqual('String!')
        expect(testSimpleObject2Fields.stringField.type.toString()).toEqual(
            'String!'
        )
    })

    test('should return the model of nested objects and arrays taking into account model mapping', async () => {
        // Arrange
        enum TestEnum {
            A = 'A',
            B = 'B',
        }

        const parsedZodSchema = parseZodSchema(
            z.object({
                object: z.object({
                    stringField: z.string(),
                    nestedObject: z.object({
                        booleanField: z.boolean(),
                    }),
                    nestedObjectUnmapped: z.object({
                        booleanField: z.boolean(),
                    }),
                    nestedArrayField: z.array(
                        z.object({
                            stringField: z.string(),
                        })
                    ),
                    nestedArrayFieldUnmapped: z.array(
                        z.object({
                            stringField: z.string(),
                        })
                    ),
                    enumField: z.nativeEnum(TestEnum),
                }),
                object2: z.object({
                    stringField: z.string(),
                    nestedObject: z.object({
                        evenMoreNestedObjectField: z.object({
                            intField: z.number().int(),
                        }),
                        evenMoreNestedObjectFieldUnmapped: z.object({
                            intField: z.number().int(),
                        }),
                        evenMoreNestedArrayField: z.array(
                            z.object({
                                stringField: z.string(),
                            })
                        ),
                        evenMoreNestedArrayFieldUnmapped: z.array(
                            z.object({
                                stringField: z.string(),
                            })
                        ),
                    }),
                }),
            })
        )

        @ObjectType()
        class NestedTestObject {
            @Field(() => Boolean)
            modifiedBooleanField!: string
        }

        @ObjectType()
        class NestedTestArrayElement {
            @Field(() => String)
            modifiedStringField!: string
        }

        @ObjectType()
        class EvenMoreNestedTestObjectField {
            @Field(() => Int)
            modifiedIntField!: number
        }

        @ObjectType()
        class EvenMoreNestedTestArrayElement {
            @Field(() => String)
            modifiedStringField!: string
        }

        registerEnumType(TestEnum, {
            name: 'ModifiedTestEnum',
        })

        // Act
        const model = parsedZodSchemaToModel(
            parsedZodSchema,
            {
                name: 'Test',
                map: {
                    'object.nestedObject': NestedTestObject,
                    'object.enumField': TestEnum,
                    'object.nestedArrayField': [NestedTestArrayElement],

                    'object2.nestedObject.evenMoreNestedObjectField':
                        EvenMoreNestedTestObjectField,
                    'object2.nestedObject.evenMoreNestedArrayField': [
                        EvenMoreNestedTestArrayElement,
                    ],
                },
            },
            'ObjectType'
        )

        // Assert
        @Resolver()
        class TestResolver {
            @Query(() => model)
            test() {
                return model
            }
        }

        const schema = await factory.create([TestResolver])

        const testFields = getFields(schema, 'Test')

        expect(testFields.object.type.toString()).toEqual('Test_Object!')
        expect(testFields.object2.type.toString()).toEqual('Test_Object2!')

        const testObjectFields = getFields(schema, 'Test_Object')

        expect(testObjectFields.stringField.type.toString()).toEqual('String!')
        expect(testObjectFields.nestedObject.type.toString()).toEqual(
            'NestedTestObject!'
        )
        expect(testObjectFields.nestedObjectUnmapped.type.toString()).toEqual(
            'Test_Object_NestedObjectUnmapped!'
        )
        expect(testObjectFields.enumField.type.toString()).toEqual(
            'ModifiedTestEnum!'
        )
        expect(testObjectFields.nestedArrayField.type.toString()).toEqual(
            '[NestedTestArrayElement!]!'
        )
        expect(
            testObjectFields.nestedArrayFieldUnmapped.type.toString()
        ).toEqual('[Test_Object_NestedArrayFieldUnmapped!]!')

        const testNestedObjectFields = getFields(schema, 'NestedTestObject')

        expect(
            testNestedObjectFields.modifiedBooleanField.type.toString()
        ).toEqual('Boolean!')

        const testNestedObjectUnmappedFields = getFields(
            schema,
            'Test_Object_NestedObjectUnmapped'
        )

        expect(
            testNestedObjectUnmappedFields.booleanField.type.toString()
        ).toEqual('Boolean!')

        const testEvenMoreNestedObjectFields = getFields(
            schema,
            'EvenMoreNestedTestObjectField'
        )
        expect(
            testEvenMoreNestedObjectFields.modifiedIntField.type.toString()
        ).toEqual('Int!')
        expect(
            testEvenMoreNestedObjectFields.modifiedIntField.type.toString()
        ).toEqual('Int!')

        const testObject2NestedObjectFields = getFields(
            schema,
            'Test_Object2_NestedObject'
        )

        expect(
            testObject2NestedObjectFields.evenMoreNestedObjectField.type.toString()
        ).toEqual('EvenMoreNestedTestObjectField!')
        expect(
            testObject2NestedObjectFields.evenMoreNestedObjectFieldUnmapped.type.toString()
        ).toEqual(
            'Test_Object2_NestedObject_EvenMoreNestedObjectFieldUnmapped!'
        )
        expect(
            testObject2NestedObjectFields.evenMoreNestedArrayField.type.toString()
        ).toEqual('[EvenMoreNestedTestArrayElement!]!')
        expect(
            testObject2NestedObjectFields.evenMoreNestedArrayFieldUnmapped.type.toString()
        ).toEqual(
            '[Test_Object2_NestedObject_EvenMoreNestedArrayFieldUnmapped!]!'
        )

        const testEvenMoreNestedArrayElementFields = getFields(
            schema,
            'EvenMoreNestedTestArrayElement'
        )

        expect(
            testEvenMoreNestedArrayElementFields.modifiedStringField.type.toString()
        ).toEqual('String!')
    })

    test('should throw an error if type is not supported and no custom type is provided', async () => {
        // Arrange
        const parsedZodSchema = parseZodSchema(
            z.object({
                union: z.union([z.string(), z.number()]),
            })
        )

        // Act
        const model = () =>
            parsedZodSchemaToModel(
                parsedZodSchema,
                {
                    name: 'Test',
                },
                'ObjectType'
            )

        // Assert
        expect(model).toThrowError(
            "Type of 'union' not supported, consider providing a custom type via the map option"
        )
    })

    test('should not throw an error if type is not supported but a custom type is provided', async () => {
        // Arrange
        const parsedZodSchema = parseZodSchema(
            z.object({
                union: z.union([z.string(), z.number()]),
            })
        )

        // Act
        const model = () =>
            parsedZodSchemaToModel(
                parsedZodSchema,
                {
                    name: 'Test',
                    map: {
                        union: String,
                    },
                },
                'ObjectType'
            )

        // Assert
        expect(model).not.toThrowError()
    })
})
