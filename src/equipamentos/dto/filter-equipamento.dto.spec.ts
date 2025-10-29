import { validate } from 'class-validator';
import { FilterEquipamentoDto } from './filter-equipamento.dto';
import { StatusOperacional } from '../../common/enums/status-operacional.enum';

describe('FilterEquipamentoDto', () => {
  it('should be valid with all optional fields', async () => {
    const dto = new FilterEquipamentoDto();
    dto.nome = 'Monitor';
    dto.tipo = 'Monitor de Sinais Vitais';
    dto.setorAtual = 'UTI';
    dto.statusOperacional = StatusOperacional.EM_USO;
    dto.page = 1;
    dto.limit = 10;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with minimal fields', async () => {
    const dto = new FilterEquipamentoDto();
    dto.page = 1;
    dto.limit = 10;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be valid with empty dto (default values)', async () => {
    const dto = new FilterEquipamentoDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('page validation', () => {
    it('should be invalid with page less than 1', async () => {
      const dto = new FilterEquipamentoDto();
      dto.page = 0;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should be invalid with page as string', async () => {
      const dto = new FilterEquipamentoDto();
      (dto as any).page = 'invalid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
      expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should be valid with page = 1', async () => {
      const dto = new FilterEquipamentoDto();
      dto.page = 1;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be valid with page = 100', async () => {
      const dto = new FilterEquipamentoDto();
      dto.page = 100;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('limit validation', () => {
    it('should be invalid with limit less than 1', async () => {
      const dto = new FilterEquipamentoDto();
      dto.limit = 0;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should be invalid with limit greater than 100', async () => {
      const dto = new FilterEquipamentoDto();
      dto.limit = 101;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
      expect(errors[0].constraints).toHaveProperty('max');
    });

    it('should be invalid with limit as string', async () => {
      const dto = new FilterEquipamentoDto();
      (dto as any).limit = 'invalid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
      expect(errors[0].constraints).toHaveProperty('isInt');
    });

    it('should be valid with limit = 1', async () => {
      const dto = new FilterEquipamentoDto();
      dto.limit = 1;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be valid with limit = 100', async () => {
      const dto = new FilterEquipamentoDto();
      dto.limit = 100;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('statusOperacional validation', () => {
    it('should be valid with valid status', async () => {
      const dto = new FilterEquipamentoDto();
      dto.statusOperacional = StatusOperacional.EM_USO;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be valid with DISPONIVEL status', async () => {
      const dto = new FilterEquipamentoDto();
      dto.statusOperacional = StatusOperacional.DISPONIVEL;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be valid with EM_MANUTENCAO status', async () => {
      const dto = new FilterEquipamentoDto();
      dto.statusOperacional = StatusOperacional.EM_MANUTENCAO;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be valid with INATIVO status', async () => {
      const dto = new FilterEquipamentoDto();
      dto.statusOperacional = StatusOperacional.INATIVO;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be valid with SUCATEADO status', async () => {
      const dto = new FilterEquipamentoDto();
      dto.statusOperacional = StatusOperacional.SUCATEADO;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be invalid with invalid status', async () => {
      const dto = new FilterEquipamentoDto();
      (dto as any).statusOperacional = 'INVALID_STATUS';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('statusOperacional');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });
  });

  describe('string field validation', () => {
    it('should be valid with string fields', async () => {
      const dto = new FilterEquipamentoDto();
      dto.nome = 'Monitor';
      dto.tipo = 'Monitor de Sinais Vitais';
      dto.setorAtual = 'UTI';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be valid with empty string fields', async () => {
      const dto = new FilterEquipamentoDto();
      dto.nome = '';
      dto.tipo = '';
      dto.setorAtual = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be invalid with non-string fields', async () => {
      const dto = new FilterEquipamentoDto();
      (dto as any).nome = 123;
      (dto as any).tipo = 456;
      (dto as any).setorAtual = 789;

      const errors = await validate(dto);
      expect(errors).toHaveLength(3);
      expect(errors[0].property).toBe('nome');
      expect(errors[1].property).toBe('tipo');
      expect(errors[2].property).toBe('setorAtual');
    });
  });
});
