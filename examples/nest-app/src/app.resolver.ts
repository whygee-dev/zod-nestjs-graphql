import { Query, Resolver } from '@nestjs/graphql';
import { User, Users } from './app.model';

@Resolver()
export class AppResolver {
  @Query(() => User)
  async user() {
    return null;
  }

  @Query(() => Users)
  async users() {
    return null;
  }
}
