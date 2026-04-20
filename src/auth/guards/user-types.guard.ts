import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ALLOWED_USER_TYPES_KEY } from '../decorators/user-types.decorator';
import { UserType } from '../../common/enums/user-type.enum';

@Injectable()
export class UserTypesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const klass = context.getClass();

    const handlerAllowed =
      (Reflect.getMetadata(ALLOWED_USER_TYPES_KEY, handler) as UserType[]) ||
      null;
    const classAllowed =
      (Reflect.getMetadata(ALLOWED_USER_TYPES_KEY, klass) as UserType[]) ||
      null;

    const allowed = handlerAllowed ?? classAllowed;
    if (!allowed || allowed.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request?.user as { tipo?: UserType } | undefined;
    const tipo = user?.tipo;

    if (!tipo || !allowed.includes(tipo)) {
      throw new ForbiddenException('Acesso negado para este tipo de usuário');
    }

    return true;
  }
}

