import { z } from 'zod';
import { zodToModel } from '../../../src/zod-to-model';
import { InferModel } from '../../../src/types';
import {
  Field,
  GraphQLISODateTime,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

registerEnumType(UserRole, {
  name: 'UserRole',
});

enum UserCountry {
  FR = 'FR',
  US = 'US',
  UK = 'UK',
}

registerEnumType(UserCountry, {
  name: 'UserCountry',
});

const UserProfileSchema = z.object({
  address: z.string(),
  name: z.string(),
  age: z.number().int(),
  email: z.string().email(),
  phone: z.string().optional(),
  country: z.enum(['FR', 'US', 'UK']).optional(),
  customCountry: z.nativeEnum(UserCountry).optional(),
  birthDate: z.date().optional(),
  customBirthDate: z.date().optional(),
});

const UserSchema = z.object({
  id: z.string().cuid(),
  profile: UserProfileSchema,
  customProfile: UserProfileSchema,
  hobbies: z.array(z.string()),
  roles: z.enum(['ADMIN', 'USER']).optional(),
  customRoles: z.nativeEnum(UserRole).optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
});

const UsersSchema = z.array(UserSchema);

@ObjectType()
export class CustomProfile {
  @Field()
  address: string;

  @Field()
  name: string;

  @Field(() => Int)
  age: number;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field(() => UserCountry)
  country: UserCountry;
}

export const User = zodToModel(UserSchema, {
  name: 'User',
  map: {
    customRoles: UserRole,
    'profile.customCountry': UserCountry,
    customProfile: CustomProfile,
    'profile.customBirthDate': GraphQLISODateTime,
  },
});

export const Users = zodToModel(UsersSchema, {
  name: 'Users',
});

export type User = InferModel<typeof User>;
