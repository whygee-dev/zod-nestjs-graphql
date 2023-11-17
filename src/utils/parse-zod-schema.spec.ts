import { expect, test, describe } from 'vitest'
import { z } from 'zod'
import { parseZodSchema } from './parse-zod-schema'
import { AllowedZodTypes } from '../types'

describe('parseZodSchema', () => {
    test('ZodString', () => {
        // Arrange
        const zodSchema = z.object({
            nonNullableString: z.string(),
            nullableString: z.string().nullable(),
            optionalString: z.string().optional(),
        })

        // Act
        const result = parseZodSchema(zodSchema)

        // Assert
        expect(result).toEqual({
            type: AllowedZodTypes.ZodObject,
            properties: {
                nonNullableString: {
                    type: AllowedZodTypes.ZodString,
                    nullable: false,
                },
                nullableString: {
                    type: AllowedZodTypes.ZodString,
                    nullable: true,
                },
                optionalString: {
                    type: AllowedZodTypes.ZodString,
                    nullable: true,
                },
            },
            nullable: false,
        })
    })

    test('ZodNumber', () => {
        // Arrange
        const zodSchema = z.object({
            nonNullableNumber: z.number(),
            nullableNumber: z.number().nullable(),
            optionalNumber: z.number().optional(),
        })

        // Act
        const result = parseZodSchema(zodSchema)

        // Assert
        expect(result).toEqual({
            type: AllowedZodTypes.ZodObject,
            properties: {
                nonNullableNumber: {
                    type: AllowedZodTypes.ZodNumber,
                    nullable: false,
                },
                nullableNumber: {
                    type: AllowedZodTypes.ZodNumber,
                    nullable: true,
                },
                optionalNumber: {
                    type: AllowedZodTypes.ZodNumber,
                    nullable: true,
                },
            },
            nullable: false,
        })
    })

    test('ZodInt', () => {
        // Arrange
        const zodSchema = z.object({
            nonNullableInt: z.number().int(),
            nullableInt: z.number().int().nullable(),
            optionalInt: z.number().int().optional(),
        })

        // Act
        const result = parseZodSchema(zodSchema)

        // Assert
        expect(result).toEqual({
            type: AllowedZodTypes.ZodObject,
            properties: {
                nonNullableInt: {
                    type: AllowedZodTypes.ZodInt,
                    nullable: false,
                },
                nullableInt: {
                    type: AllowedZodTypes.ZodInt,
                    nullable: true,
                },
                optionalInt: {
                    type: AllowedZodTypes.ZodInt,
                    nullable: true,
                },
            },
            nullable: false,
        })
    })

    test('ZodBoolean', () => {
        // Arrange
        const zodSchema = z.object({
            nonNullableBoolean: z.boolean(),
            nullableBoolean: z.boolean().nullable(),
            optionalBoolean: z.boolean().optional(),
        })

        // Act
        const result = parseZodSchema(zodSchema)

        // Assert
        expect(result).toEqual({
            type: AllowedZodTypes.ZodObject,
            properties: {
                nonNullableBoolean: {
                    type: AllowedZodTypes.ZodBoolean,
                    nullable: false,
                },
                nullableBoolean: {
                    type: AllowedZodTypes.ZodBoolean,
                    nullable: true,
                },
                optionalBoolean: {
                    type: AllowedZodTypes.ZodBoolean,
                    nullable: true,
                },
            },
            nullable: false,
        })
    })

    test('ZodDate', () => {
        // Arrange
        const zodSchema = z.object({
            nonNullableDate: z.date(),
            nullableDate: z.date().nullable(),
            optionalDate: z.date().optional(),
        })

        // Act
        const result = parseZodSchema(zodSchema)

        // Assert
        expect(result).toEqual({
            type: AllowedZodTypes.ZodObject,
            properties: {
                nonNullableDate: {
                    type: AllowedZodTypes.ZodDate,
                    nullable: false,
                },
                nullableDate: {
                    type: AllowedZodTypes.ZodDate,
                    nullable: true,
                },
                optionalDate: {
                    type: AllowedZodTypes.ZodDate,
                    nullable: true,
                },
            },
            nullable: false,
        })
    })

    test('ZodEnum', () => {
        // Arrange
        const testEnum = z.enum(['A', 'B'])

        const zodSchema = z.object({
            nonNullableEnum: testEnum,
            nullableEnum: testEnum.nullable(),
            optionalEnum: testEnum.optional(),
        })

        // Act
        const result = parseZodSchema(zodSchema)

        // Assert
        expect(result).toEqual({
            type: AllowedZodTypes.ZodObject,
            properties: {
                nonNullableEnum: {
                    type: AllowedZodTypes.ZodEnum,
                    nullable: false,
                    keys: ['A', 'B'],
                },
                nullableEnum: {
                    type: AllowedZodTypes.ZodEnum,
                    nullable: true,
                    keys: ['A', 'B'],
                },
                optionalEnum: {
                    type: AllowedZodTypes.ZodEnum,
                    nullable: true,
                    keys: ['A', 'B'],
                },
            },
            nullable: false,
        })
    })

    test('ZodNativeEnum', () => {
        // Arrange
        enum TestEnum {
            A = 'A',
            B = 'B',
            C = 'another value',
        }

        const zodSchema = z.object({
            nonNullableEnum: z.nativeEnum(TestEnum),
            nullableEnum: z.nativeEnum(TestEnum).nullable(),
            optionalEnum: z.nativeEnum(TestEnum).optional(),
        })

        // Act
        const result = parseZodSchema(zodSchema)

        // Assert
        expect(result).toEqual({
            type: AllowedZodTypes.ZodObject,
            properties: {
                nonNullableEnum: {
                    type: AllowedZodTypes.ZodNativeEnum,
                    nullable: false,
                    keys: ['A', 'B', 'C'],
                },
                nullableEnum: {
                    type: AllowedZodTypes.ZodNativeEnum,
                    nullable: true,
                    keys: ['A', 'B', 'C'],
                },
                optionalEnum: {
                    type: AllowedZodTypes.ZodNativeEnum,
                    nullable: true,
                    keys: ['A', 'B', 'C'],
                },
            },
            nullable: false,
        })
    })

    test('ZodArray', () => {
        // Arrange
        const zodSchema = z.object({
            arrayOfStrings: z.array(z.string()),
            arrayOfObjects: z.array(
                z.object({
                    name: z.string(),
                })
            ),
            optionalArrayOfStrings: z.array(z.string()).optional(),
        })

        // Act
        const result = parseZodSchema(zodSchema)

        // Assert
        expect(result).toEqual({
            type: AllowedZodTypes.ZodObject,
            properties: {
                arrayOfStrings: {
                    type: AllowedZodTypes.ZodArray,
                    element: {
                        type: AllowedZodTypes.ZodString,
                        nullable: false,
                    },
                    nullable: false,
                },
                arrayOfObjects: {
                    type: AllowedZodTypes.ZodArray,
                    element: {
                        type: AllowedZodTypes.ZodObject,
                        properties: {
                            name: {
                                type: AllowedZodTypes.ZodString,
                                nullable: false,
                            },
                        },
                        nullable: false,
                    },
                    nullable: false,
                },
                optionalArrayOfStrings: {
                    type: AllowedZodTypes.ZodArray,
                    element: {
                        type: AllowedZodTypes.ZodString,
                        nullable: false,
                    },
                    nullable: true,
                },
            },
            nullable: false,
        })
    })

    test('nested ZodObject', () => {
        // Arrange
        const zodSchema = z.object({
            nestedObject: z.object({
                name: z.string(),
            }),
            optionalNestedObject: z
                .object({
                    name: z.string(),
                })
                .optional(),
            nestedObjectRefined: z
                .object({
                    age: z.number(),
                })
                .refine((data) => data.age > 18),
        })

        // Act
        const result = parseZodSchema(zodSchema)

        // Assert
        expect(result).toEqual({
            type: AllowedZodTypes.ZodObject,
            properties: {
                nestedObject: {
                    type: AllowedZodTypes.ZodObject,
                    properties: {
                        name: {
                            type: AllowedZodTypes.ZodString,
                            nullable: false,
                        },
                    },
                    nullable: false,
                },
                optionalNestedObject: {
                    type: AllowedZodTypes.ZodObject,
                    properties: {
                        name: {
                            type: AllowedZodTypes.ZodString,
                            nullable: false,
                        },
                    },
                    nullable: true,
                },
                nestedObjectRefined: {
                    type: AllowedZodTypes.ZodObject,
                    properties: {
                        age: {
                            type: AllowedZodTypes.ZodNumber,
                            nullable: false,
                        },
                    },
                    nullable: false,
                },
            },
            nullable: false,
        })
    })
})
