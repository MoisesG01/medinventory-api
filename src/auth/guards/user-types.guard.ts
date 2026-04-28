import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ALLOWED_USER_TYPES_KEY } from '../decorators/user-types.decorator';
import { UserType } from '../../common/enums/user-type.enum';

function normalizeUserType(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  // Aceita variações comuns vindas de DB/seed/front (ex.: ADMINISTRADOR vs Administrador)
  const key = raw.toLowerCase();
  switch (key) {
    case 'admin':
    case 'administrador':
    case 'role_admin':
    case 'role_administrador':
      return UserType.Administrador.toLowerCase();
    case 'gestor':
    case 'role_gestor':
      return UserType.Gestor.toLowerCase();
    case 'tecnico':
    case 'técnico':
    case 'role_tecnico':
      return UserType.Tecnico.toLowerCase();
    case 'usuariocomum':
    case 'usuario_comum':
    case 'usuário comum':
    case 'role_usuariocomum':
      return UserType.UsuarioComum.toLowerCase();
    default:
      return key;
  }
}

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
    const user = request?.user as
      | {
          tipo?: unknown;
          tipoUsuario?: unknown;
          userType?: unknown;
          type?: unknown;
        }
      | undefined;
    const rawTipo = user?.tipo ?? user?.tipoUsuario ?? user?.userType ?? user?.type;
    const tipo = normalizeUserType(rawTipo);
    const allowedNormalized = allowed
      .map((t) => normalizeUserType(t))
      .filter((t): t is string => Boolean(t));

    if (!tipo || !allowedNormalized.includes(tipo)) {
      throw new ForbiddenException('Acesso negado para este tipo de usuário');
    }

    return true;
  }
}

