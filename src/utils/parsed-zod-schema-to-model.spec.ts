import { describe, test, expect } from 'vitest'
import { z } from 'zod'
import { parseZodSchema } from './parse-zod-schema'
import { parsedZodSchemaToModel } from './parsed-zod-schema-to-model'
import { Query, Resolver, buildSchema } from 'type-graphql'
import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import { printSchemaWithDirectives } from '@graphql-tools/utils'

const getFields = (schema: GraphQLSchema, name: string) =>
    (schema.getType(name) as GraphQLObjectType)?.getFields()

describe('parsedZodSchemaToModel', () => {
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

        const schema = await buildSchema({
            resolvers: [TestResolver],
        })

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

        expect(fields.nativeEnumField.type.toString()).toEqual(
            'NativeEnumField!'
        )
        expect(fields.nativeEnumOptionalField.type.toString()).toEqual(
            'NativeEnumOptionalField'
        )

        expect(fields.enumField.type.toString()).toEqual('EnumField!')
        expect(fields.optionalEnumField.type.toString()).toEqual(
            'OptionalEnumField'
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

        const schema = await buildSchema({
            resolvers: [TestResolver],
        })

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

        const schema = await buildSchema({
            resolvers: [TestResolver],
        })

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
                object: z.object({
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

        const schema = await buildSchema({
            resolvers: [TestResolver],
        })

        const testFields = getFields(schema, 'Test')
        const testObjectFields = getFields(schema, 'Test_Object')
        const testArrayFields = getFields(schema, 'Test_Array')
        const testArrayNestedFields = getFields(schema, 'Test_Array_Nested')

        const query = getFields(schema, 'Query').test

        expect(testFields.array.type.toString()).toEqual('[Test_Array!]!')
        expect(testFields.object.type.toString()).toEqual('Test_Object!')

        expect(testObjectFields.stringField.type.toString()).toEqual('String!')

        expect(testArrayFields.stringField.type.toString()).toEqual('String!')
        expect(testArrayFields.nested.type.toString()).toEqual(
            '[Test_Array_Nested!]!'
        )

        expect(testArrayNestedFields.numberField.type.toString()).toEqual(
            'Float!'
        )

        expect(query.type.toString()).toEqual('Test!')
    })
})
