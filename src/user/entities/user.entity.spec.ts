import { User } from './user.entity';

describe('User', () => {
  let entity: User;

  beforeEach(() => {
    entity = new User();
  });

  it('should be defined', () => {
    expect(entity).toBeDefined();
  });

  it('should have all required properties', () => {
    entity.id = '123e4567-e89b-12d3-a456-426614174000';
    entity.nome = 'Test User';
    entity.username = 'testuser';
    entity.email = 'test@example.com';
    entity.password = 'hashedPassword';
    entity.tipo = 'UsuarioComum';
    entity.createdAt = new Date();
    entity.updatedAt = new Date();

    expect(entity.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(entity.nome).toBe('Test User');
    expect(entity.username).toBe('testuser');
    expect(entity.email).toBe('test@example.com');
    expect(entity.password).toBe('hashedPassword');
    expect(entity.tipo).toBe('UsuarioComum');
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
  });

  it('should handle different user types', () => {
    const types = ['Administrador', 'Gestor', 'Tecnico', 'UsuarioComum'];
    
    types.forEach(type => {
      entity.tipo = type;
      expect(entity.tipo).toBe(type);
    });
  });
});
