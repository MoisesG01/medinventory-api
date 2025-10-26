import { FindUserDto } from './find-user.dto';
import { validate } from 'class-validator';

describe('FindUserDto', () => {
  let dto: FindUserDto;

  beforeEach(() => {
    dto = new FindUserDto();
  });

  it('should be defined', () => {
    expect(dto).toBeDefined();
  });

  it('should have username property', () => {
    dto.username = 'testuser';
    expect(dto.username).toBe('testuser');
  });

  describe('validation', () => {
    it('should pass validation with valid username', async () => {
      dto.username = 'validuser';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty username', async () => {
      dto.username = '';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1); // IsNotEmpty and MinLength combined
      expect(errors[0].property).toBe('username');
    });

    it('should fail validation with username too short', async () => {
      dto.username = 'ab';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1); // MinLength
    });

    it('should fail validation with username too long', async () => {
      dto.username = 'a'.repeat(51);
      const errors = await validate(dto);
      expect(errors).toHaveLength(1); // MaxLength
    });

    it('should fail validation with non-string username', async () => {
      dto.username = 123 as any;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1); // IsString
    });
  });
});
