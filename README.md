# Zod => NestJS GraphQL

A utility library to transform Zod schemas into TypeGraphQL object and input types.

## Installation

With npm:

```bash
  npm i zod-nestjs-graphql
```

With yarn:

```bash
  yarn add zod-nestjs-graphql
```

With pnpm:

```bash
  pnpm add zod-nestjs-graphql
```

## Usage/Examples

Features:

-   All primitive scalars ( `String`, `Float`, `Int`, `DateTime` )
-   Nested `z.object()` and `z.array()`
-   Enums ( `z.nativeEnum()` and `z.enum()` )
-   Custom scalars / models mapping
-   Generated model / input typings
-   Custom separator for generated nested models
-   Unit tested

Supported Zod types and their corresponding GraphQL Scalar:

-   [x] `z.string()` ( String )
-   [x] `z.boolean()` ( Boolean )
-   [x] `z.number()` ( Float )
-   [x] `z.number().int()` ( Int )
-   [x] `z.date()` ( DateTime )
-   [x] `z.nativeEnum()`
-   [x] `z.enum()`
-   [x] `z.object()`
-   [x] `z.array()`
-   [x] Custom scalars

zodToModel

```typescript
import { z } from 'zod'
import { zodToModel, InferModel } from 'zod-nestjs-graphql'

const model = zodToModel(
    z.object({
        fullName: z.string(),
        age: z.number(),
        email: z.string().email(),
        phone: z.string().optional(),
    }),
    {
        name: 'User',
    }
)

type Model = InferModel<typeof model>
```

zodToInput

```typescript
import { z } from 'zod'
import { zodToInput, InferModel } from 'zod-nestjs-graphql'

const input = zodToInput(
    z.object({
        fullName: z.string(),
        age: z.number(),
        email: z.string().email(),
        phone: z.string().optional(),
    }),
    {
        name: 'User',
    }
)

type Input = InferModel<typeof input>
```

Custom mapping ( works with custom scalars and zodToInput the same way )

```typescript
import { z } from 'zod'
import { zodToModel, InferModel } from 'zod-nestjs-graphql'

@ObjectType()
class UserProfile {
    @Field()
    address?: string
}

const model = zodToModel(
    z.object({
        fullName: z.string(),
        profile: z.object({ address: z.string().optional() }),
        nestedObject: z.object({
            evenMoreNestedObject: z.object({
                address: z.string().optional(),
            }),
        }),
    }),
    {
        name: 'User',
        map: {
            profile: UserProfile,
            'nestedObjected.evenMoreNestedObject': UserProfile,
        },
    }
)

type Model = InferModel<typeof model>
```

Check out `examples` folder for advanced usage

## Roadmap

-   [ ] Mapping describe()
-   [ ] Validation pipe for inputs
-   [ ] ? ( Open a feature request )

## Acknowledgements

-   Inspired by [nestjs-graphql-zod](https://github.com/incetarik/nestjs-graphql-zod)
-   Initially developed for internal usage @ Beeldi

## Contributing

Contributions are always welcome!
