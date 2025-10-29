import { validate } from 'class-validator';
import { CreateEquipamentoDto } from './create-equipamento.dto';
import { UpdateStatusDto } from './update-status.dto';
import { FilterEquipamentoDto } from './filter-equipamento.dto';
import { StatusOperacional } from '../../common/enums/status-operacional.enum';

describe('CreateEquipamentoDto', () => {
  it('should be valid with required fields', async () => {
    const dto = new CreateEquipamentoDto();
    dto.nome = 'Monitor Multiparamétrico';
    dto.tipo = 'Monitor de Sinais Vitais';
    dto.fabricante = 'Philips';
    dto.modelo = 'MX450';
    dto.statusOperacional = StatusOperacional.EM_USO;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be invalid without required fields', async () => {
    const dto = new CreateEquipamentoDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(5); // nome, tipo, fabricante, modelo, statusOperacional
  });

  it('should be invalid with empty nome', async () => {
    const dto = new CreateEquipamentoDto();
    dto.nome = '';
    dto.tipo = 'Monitor de Sinais Vitais';
    dto.fabricante = 'Philips';
    dto.modelo = 'MX450';
    dto.statusOperacional = StatusOperacional.EM_USO;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('nome');
  });

  it('should be invalid with nome too short', async () => {
    const dto = new CreateEquipamentoDto();
    dto.nome = 'A';
    dto.tipo = 'Monitor de Sinais Vitais';
    dto.fabricante = 'Philips';
    dto.modelo = 'MX450';
    dto.statusOperacional = StatusOperacional.EM_USO;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('nome');
  });

  it('should be invalid with nome too long', async () => {
    const dto = new CreateEquipamentoDto();
    dto.nome = 'A'.repeat(201);
    dto.tipo = 'Monitor de Sinais Vitais';
    dto.fabricante = 'Philips';
    dto.modelo = 'MX450';
    dto.statusOperacional = StatusOperacional.EM_USO;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('nome');
  });

  it('should be invalid with invalid statusOperacional', async () => {
    const dto = new CreateEquipamentoDto();
    dto.nome = 'Monitor Multiparamétrico';
    dto.tipo = 'Monitor de Sinais Vitais';
    dto.fabricante = 'Philips';
    dto.modelo = 'MX450';
    dto.statusOperacional = 'INVALID_STATUS' as StatusOperacional;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('statusOperacional');
  });

  it('should be invalid with negative valorAquisicao', async () => {
    const dto = new CreateEquipamentoDto();
    dto.nome = 'Monitor Multiparamétrico';
    dto.tipo = 'Monitor de Sinais Vitais';
    dto.fabricante = 'Philips';
    dto.modelo = 'MX450';
    dto.statusOperacional = StatusOperacional.EM_USO;
    dto.valorAquisicao = -100;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('valorAquisicao');
  });

  it('should be invalid with negative vidaUtilEstimativa', async () => {
    const dto = new CreateEquipamentoDto();
    dto.nome = 'Monitor Multiparamétrico';
    dto.tipo = 'Monitor de Sinais Vitais';
    dto.fabricante = 'Philips';
    dto.modelo = 'MX450';
    dto.statusOperacional = StatusOperacional.EM_USO;
    dto.vidaUtilEstimativa = -5;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('vidaUtilEstimativa');
  });

  it('should be invalid with invalid UUID userId', async () => {
    const dto = new CreateEquipamentoDto();
    dto.nome = 'Monitor Multiparamétrico';
    dto.tipo = 'Monitor de Sinais Vitais';
    dto.fabricante = 'Philips';
    dto.modelo = 'MX450';
    dto.statusOperacional = StatusOperacional.EM_USO;
    dto.userId = 'invalid-uuid';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('userId');
  });

  it('should be valid with valid UUID userId', async () => {
    const dto = new CreateEquipamentoDto();
    dto.nome = 'Monitor Multiparamétrico';
    dto.tipo = 'Monitor de Sinais Vitais';
    dto.fabricante = 'Philips';
    dto.modelo = 'MX450';
    dto.statusOperacional = StatusOperacional.EM_USO;
    dto.userId = '550e8400-e29b-41d4-a716-446655440000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('fabricante validation', () => {
    it('should be valid with valid fabricante', async () => {
      const dto = new CreateEquipamentoDto();
      dto.nome = 'Monitor';
      dto.tipo = 'Monitor de Sinais Vitais';
      dto.fabricante = 'Philips';
      dto.modelo = 'MX450';
      dto.statusOperacional = StatusOperacional.EM_USO;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should be invalid with empty fabricante', async () => {
      const dto = new CreateEquipamentoDto();
      dto.nome = 'Monitor';
      dto.tipo = 'Monitor de Sinais Vitais';
      dto.fabricante = '';
      dto.modelo = 'MX450';
      dto.statusOperacional = StatusOperacional.EM_USO;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('fabricante');
    });

    it('should be invalid with fabricante too short', async () => {
      const dto = new CreateEquipamentoDto();
      dto.nome = 'Monitor';
      dto.tipo = 'Monitor de Sinais Vitais';
      dto.fabricante = 'A';
      dto.modelo = 'MX450';
      dto.statusOperacional = StatusOperacional.EM_USO;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('fabricante');
    });

    it('should be invalid with fabricante too long', async () => {
      const dto = new CreateEquipamentoDto();
      dto.nome = 'Monitor';
      dto.tipo = 'Monitor de Sinais Vitais';
      dto.fabricante = 'A'.repeat(101);
      dto.modelo = 'MX450';
      dto.statusOperacional = StatusOperacional.EM_USO;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('fabricante');
    });
  });
});

describe('UpdateStatusDto', () => {
  it('should be valid with valid statusOperacional', async () => {
    const dto = new UpdateStatusDto();
    dto.statusOperacional = StatusOperacional.EM_MANUTENCAO;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be invalid without statusOperacional', async () => {
    const dto = new UpdateStatusDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('statusOperacional');
  });

  it('should be invalid with invalid statusOperacional', async () => {
    const dto = new UpdateStatusDto();
    dto.statusOperacional = 'INVALID_STATUS' as StatusOperacional;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('statusOperacional');
  });

  it('should be valid with all status values', async () => {
    const statusValues = [
      StatusOperacional.DISPONIVEL,
      StatusOperacional.EM_USO,
      StatusOperacional.EM_MANUTENCAO,
      StatusOperacional.INATIVO,
      StatusOperacional.SUCATEADO,
    ];

    for (const status of statusValues) {
      const dto = new UpdateStatusDto();
      dto.statusOperacional = status;

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });
});

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

  it('should be valid with empty dto', async () => {
    const dto = new FilterEquipamentoDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should be invalid with negative page', async () => {
    const dto = new FilterEquipamentoDto();
    dto.page = -1;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('page');
  });

  it('should be invalid with zero page', async () => {
    const dto = new FilterEquipamentoDto();
    dto.page = 0;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('page');
  });

  it('should be invalid with negative limit', async () => {
    const dto = new FilterEquipamentoDto();
    dto.limit = -1;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('limit');
  });

  it('should be invalid with zero limit', async () => {
    const dto = new FilterEquipamentoDto();
    dto.limit = 0;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('limit');
  });

  it('should be invalid with invalid statusOperacional', async () => {
    const dto = new FilterEquipamentoDto();
    dto.statusOperacional = 'INVALID_STATUS' as StatusOperacional;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('statusOperacional');
  });
});
