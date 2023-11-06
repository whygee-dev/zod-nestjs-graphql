import { AllowedZodTypes } from '../types'

export const isEnum = (
    type: AllowedZodTypes
): type is AllowedZodTypes.ZodEnum | AllowedZodTypes.ZodNativeEnum => {
    return (
        type === AllowedZodTypes.ZodEnum ||
        type === AllowedZodTypes.ZodNativeEnum
    )
}
