import { UserRegisterDto } from './user-register.dto';
import { UserType } from '../../common/enums/user-type.enum';
import { validate } from 'class-validator';

describe('UserRegisterDto', () => {
  let dto: UserRegisterDto;

  beforeEach(() => {
    dto = new UserRegisterDto();
  });

  it('should be defined', () => {
    expect(dto).toBeDefined();
  });

  it('should extend BaseUserDto', () => {
    // Test that it has all the properties from BaseUserDto
    dto.nome = 'Test User';
    dto.username = 'testuser';
    dto.email = 'test@example.com';
    dto.password = 'password123';
    dto.tipo = UserType.UsuarioComum;

    expect(dto.nome).toBe('Test User');
    expect(dto.username).toBe('testuser');
    expect(dto.email).toBe('test@example.com');
    expect(dto.password).toBe('password123');
    expect(dto.tipo).toBe(UserType.UsuarioComum);
  });

  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      dto.nome = 'Test User';
      dto.username = 'testuser';
      dto.email = 'test@example.com';
      dto.password = 'password123';
      dto.tipo = UserType.UsuarioComum;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with invalid email', async () => {
      dto.nome = 'Test User';
      dto.username = 'testuser';
      dto.email = 'invalid-email';
      dto.password = 'password123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('email');
    });

    it('should fail validation with short password', async () => {
      dto.nome = 'Test User';
      dto.username = 'testuser';
      dto.email = 'test@example.com';
      dto.password = '123';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('password');
    });
  });
});
