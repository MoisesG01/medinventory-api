import { Test, TestingModule } from '@nestjs/testing';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { CacheModule } from '../cache/cache.module';

describe('UserModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [CacheModule, UserModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide UserService', () => {
    const userService = module.get<UserService>(UserService);
    expect(userService).toBeDefined();
    expect(typeof userService.create).toBe('function');
  });
});
