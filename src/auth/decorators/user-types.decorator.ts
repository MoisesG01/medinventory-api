import { SetMetadata } from '@nestjs/common';
import { UserType } from '../../common/enums/user-type.enum';

export const ALLOWED_USER_TYPES_KEY = 'allowed_user_types';

export const UserTypes = (...types: UserType[]) =>
  SetMetadata(ALLOWED_USER_TYPES_KEY, types);

