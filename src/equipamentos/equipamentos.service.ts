import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Equipamento, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { FilterEquipamentoDto } from './dto/filter-equipamento.dto';
import { ExportEquipamentoCsvQueryDto } from './dto/export-equipamento-csv-query.dto';
import { ExportCsvResponseDto } from './dto/export-csv-response.dto';
import { StatusOperacional } from '../common/enums/status-operacional.enum';
import { BlobCsvService } from '../storage/blob-csv.service';
import { randomUUID } from 'crypto';
import { RedisCacheService } from '../cache/redis-cache.service';

const EQUIPAMENTO_CACHE_TTL_SECONDS = 60 * 60 * 12; // 12 horas

type EquipamentoFilterFields = {
  nome?: string;
  tipo?: string;
  setorAtual?: string;
  statusOperacional?: StatusOperacional;
};

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formatDateOnlyUtc(value: Date | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.toISOString().slice(0, 10);
}

function formatDateTimeUtc(value: Date | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

@Injectable()
export class EquipamentosService {
  constructor(
    private prisma: PrismaService,
    private readonly blobCsvService: BlobCsvService,
    private readonly cache: RedisCacheService,
  ) {}

  private cacheKeyForEquipamento(id: string) {
    return `equipamentos:${id}`;
  }

  private buildWhereFromFilters(
    filters?: EquipamentoFilterFields,
  ): Prisma.EquipamentoWhereInput {
    const where: Prisma.EquipamentoWhereInput = {};

    if (filters?.nome) {
      where.nome = { contains: filters.nome };
    }

    if (filters?.tipo) {
      where.tipo = { contains: filters.tipo };
    }

    if (filters?.setorAtual) {
      where.setorAtual = { contains: filters.setorAtual };
    }

    if (filters?.statusOperacional) {
      where.statusOperacional = filters.statusOperacional;
    }

    return where;
  }

  async create(createEquipamentoDto: CreateEquipamentoDto) {
    // Verificar se userId existe (se fornecido)
    if (createEquipamentoDto.userId) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: createEquipamentoDto.userId },
      });
      if (!userExists) {
        throw new BadRequestException('Usuário responsável não encontrado');
      }
    }

    // Preparar dados para criação
    const data: any = {
      nome: createEquipamentoDto.nome,
      tipo: createEquipamentoDto.tipo,
      fabricante: createEquipamentoDto.fabricante,
      modelo: createEquipamentoDto.modelo,
      statusOperacional: createEquipamentoDto.statusOperacional,
      numeroSerie: createEquipamentoDto.numeroSerie,
      codigoPatrimonial: createEquipamentoDto.codigoPatrimonial,
      setorAtual: createEquipamentoDto.setorAtual,
      dataAquisicao: createEquipamentoDto.dataAquisicao
        ? new Date(createEquipamentoDto.dataAquisicao)
        : null,
      valorAquisicao: createEquipamentoDto.valorAquisicao,
      dataFimGarantia: createEquipamentoDto.dataFimGarantia
        ? new Date(createEquipamentoDto.dataFimGarantia)
        : null,
      vidaUtilEstimativa: createEquipamentoDto.vidaUtilEstimativa,
      registroAnvisa: createEquipamentoDto.registroAnvisa,
      classeRisco: createEquipamentoDto.classeRisco,
      dataUltimaManutencao: createEquipamentoDto.dataUltimaManutencao
        ? new Date(createEquipamentoDto.dataUltimaManutencao)
        : null,
      dataProximaManutencao: createEquipamentoDto.dataProximaManutencao
        ? new Date(createEquipamentoDto.dataProximaManutencao)
        : null,
      responsavelTecnico: createEquipamentoDto.responsavelTecnico,
      criticidade: createEquipamentoDto.criticidade,
      observacoes: createEquipamentoDto.observacoes,
      userId: createEquipamentoDto.userId || null,
    };

    const equipamento = await this.prisma.equipamento.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, ...result } = equipamento;
    return {
      ...result,
      userId: equipamento.userId,
    };
  }

  async findAll(filters?: FilterEquipamentoDto) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where = this.buildWhereFromFilters(filters);

    // Buscar equipamentos com paginação
    const [equipamentos, total] = await Promise.all([
      this.prisma.equipamento.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.equipamento.count({ where }),
    ]);

    // Remover dados do usuário do resultado (manter apenas userId)
    const equipamentosFormatados = equipamentos.map((equipamento) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user, ...result } = equipamento;
      return {
        ...result,
        userId: equipamento.userId,
      };
    });

    return {
      data: equipamentosFormatados,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private buildEquipamentosCsvBuffer(equipamentos: Equipamento[]): Buffer {
    const headers = [
      'ID',
      'Nome',
      'Tipo',
      'Fabricante',
      'Modelo',
      'Número de série',
      'Código patrimonial',
      'Setor atual',
      'Status operacional',
      'Data de aquisição',
      'Valor de aquisição',
      'Data fim da garantia',
      'Vida útil estimada (anos)',
      'Registro ANVISA',
      'Classe de risco',
      'Data última manutenção',
      'Data próxima manutenção',
      'Responsável técnico',
      'Criticidade',
      'Observações',
      'ID usuário responsável',
      'Criado em (UTC)',
      'Atualizado em (UTC)',
    ];

    const lines: string[] = [
      headers.map((h) => escapeCsvField(h)).join(','),
      ...equipamentos.map((e) =>
        [
          escapeCsvField(e.id),
          escapeCsvField(e.nome),
          escapeCsvField(e.tipo),
          escapeCsvField(e.fabricante),
          escapeCsvField(e.modelo),
          escapeCsvField(e.numeroSerie),
          escapeCsvField(e.codigoPatrimonial),
          escapeCsvField(e.setorAtual),
          escapeCsvField(e.statusOperacional),
          escapeCsvField(formatDateOnlyUtc(e.dataAquisicao)),
          escapeCsvField(
            e.valorAquisicao === null || e.valorAquisicao === undefined
              ? ''
              : e.valorAquisicao,
          ),
          escapeCsvField(formatDateOnlyUtc(e.dataFimGarantia)),
          escapeCsvField(
            e.vidaUtilEstimativa === null ||
              e.vidaUtilEstimativa === undefined
              ? ''
              : e.vidaUtilEstimativa,
          ),
          escapeCsvField(e.registroAnvisa),
          escapeCsvField(e.classeRisco),
          escapeCsvField(formatDateOnlyUtc(e.dataUltimaManutencao)),
          escapeCsvField(formatDateOnlyUtc(e.dataProximaManutencao)),
          escapeCsvField(e.responsavelTecnico),
          escapeCsvField(e.criticidade),
          escapeCsvField(e.observacoes),
          escapeCsvField(e.userId),
          escapeCsvField(formatDateTimeUtc(e.createdAt)),
          escapeCsvField(formatDateTimeUtc(e.updatedAt)),
        ].join(','),
      ),
    ];

    const body = lines.join('\r\n');
    return Buffer.from(`\uFEFF${body}`, 'utf-8');
  }

  async exportCsvToBlob(
    filters?: ExportEquipamentoCsvQueryDto,
  ): Promise<ExportCsvResponseDto> {
    const where = this.buildWhereFromFilters(filters);

    const equipamentos = await this.prisma.equipamento.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const buffer = this.buildEquipamentosCsvBuffer(equipamentos);
    const blobName = `equipamentos/${randomUUID()}.csv`;
    const { downloadUrl, expiresOn, blobName: storedName } =
      await this.blobCsvService.uploadCsvAndGetReadSas(buffer, blobName);

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `equipamentos-${dateStr}.csv`;

    return {
      downloadUrl,
      expiresOn: expiresOn.toISOString(),
      blobName: storedName,
      fileName,
    };
  }

  async exportCsvFileAndUpload(
    filters?: ExportEquipamentoCsvQueryDto,
  ): Promise<{ fileName: string; buffer: Buffer }> {
    const where = this.buildWhereFromFilters(filters);

    const equipamentos = await this.prisma.equipamento.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const buffer = this.buildEquipamentosCsvBuffer(equipamentos);
    const blobName = `equipamentos/${randomUUID()}.csv`;

    // Mantém o comportamento atual: salva no Blob (para compartilhamento/auditoria),
    // mas retorna o arquivo direto no response para download imediato.
    await this.blobCsvService.uploadCsvAndGetReadSas(buffer, blobName);

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `equipamentos-${dateStr}.csv`;

    return { fileName, buffer };
  }

  async findOne(id: string) {
    const cacheKey = this.cacheKeyForEquipamento(id);
    const cached = await this.cache.getJson<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const equipamento = await this.prisma.equipamento.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (!equipamento) {
      throw new NotFoundException('Equipamento não encontrado');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, ...result } = equipamento;
    const payload = {
      ...result,
      userId: equipamento.userId,
    };

    await this.cache.setJson(cacheKey, payload, EQUIPAMENTO_CACHE_TTL_SECONDS);
    return payload;
  }

  async update(id: string, updateEquipamentoDto: UpdateEquipamentoDto) {
    // Verificar se equipamento existe
    const existingEquipamento = await this.prisma.equipamento.findUnique({
      where: { id },
    });

    if (!existingEquipamento) {
      throw new NotFoundException('Equipamento não encontrado');
    }

    // Verificar se userId existe (se fornecido e sendo alterado)
    if (updateEquipamentoDto.userId) {
      const userExists = await this.prisma.user.findUnique({
        where: { id: updateEquipamentoDto.userId },
      });
      if (!userExists) {
        throw new BadRequestException('Usuário responsável não encontrado');
      }
    }

    // Preparar dados para atualização
    const data: any = {};

    if (updateEquipamentoDto.nome !== undefined) {
      data.nome = updateEquipamentoDto.nome;
    }
    if (updateEquipamentoDto.tipo !== undefined) {
      data.tipo = updateEquipamentoDto.tipo;
    }
    if (updateEquipamentoDto.fabricante !== undefined) {
      data.fabricante = updateEquipamentoDto.fabricante;
    }
    if (updateEquipamentoDto.modelo !== undefined) {
      data.modelo = updateEquipamentoDto.modelo;
    }
    if (updateEquipamentoDto.statusOperacional !== undefined) {
      data.statusOperacional = updateEquipamentoDto.statusOperacional;
    }
    if (updateEquipamentoDto.numeroSerie !== undefined) {
      data.numeroSerie = updateEquipamentoDto.numeroSerie;
    }
    if (updateEquipamentoDto.codigoPatrimonial !== undefined) {
      data.codigoPatrimonial = updateEquipamentoDto.codigoPatrimonial;
    }
    if (updateEquipamentoDto.setorAtual !== undefined) {
      data.setorAtual = updateEquipamentoDto.setorAtual;
    }
    if (updateEquipamentoDto.dataAquisicao !== undefined) {
      data.dataAquisicao = updateEquipamentoDto.dataAquisicao
        ? new Date(updateEquipamentoDto.dataAquisicao)
        : null;
    }
    if (updateEquipamentoDto.valorAquisicao !== undefined) {
      data.valorAquisicao = updateEquipamentoDto.valorAquisicao;
    }
    if (updateEquipamentoDto.dataFimGarantia !== undefined) {
      data.dataFimGarantia = updateEquipamentoDto.dataFimGarantia
        ? new Date(updateEquipamentoDto.dataFimGarantia)
        : null;
    }
    if (updateEquipamentoDto.vidaUtilEstimativa !== undefined) {
      data.vidaUtilEstimativa = updateEquipamentoDto.vidaUtilEstimativa;
    }
    if (updateEquipamentoDto.registroAnvisa !== undefined) {
      data.registroAnvisa = updateEquipamentoDto.registroAnvisa;
    }
    if (updateEquipamentoDto.classeRisco !== undefined) {
      data.classeRisco = updateEquipamentoDto.classeRisco;
    }
    if (updateEquipamentoDto.dataUltimaManutencao !== undefined) {
      data.dataUltimaManutencao = updateEquipamentoDto.dataUltimaManutencao
        ? new Date(updateEquipamentoDto.dataUltimaManutencao)
        : null;
    }
    if (updateEquipamentoDto.dataProximaManutencao !== undefined) {
      data.dataProximaManutencao = updateEquipamentoDto.dataProximaManutencao
        ? new Date(updateEquipamentoDto.dataProximaManutencao)
        : null;
    }
    if (updateEquipamentoDto.responsavelTecnico !== undefined) {
      data.responsavelTecnico = updateEquipamentoDto.responsavelTecnico;
    }
    if (updateEquipamentoDto.criticidade !== undefined) {
      data.criticidade = updateEquipamentoDto.criticidade;
    }
    if (updateEquipamentoDto.observacoes !== undefined) {
      data.observacoes = updateEquipamentoDto.observacoes;
    }
    if (updateEquipamentoDto.userId !== undefined) {
      data.userId = updateEquipamentoDto.userId || null;
    }

    const updatedEquipamento = await this.prisma.equipamento.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, ...result } = updatedEquipamento;
    const payload = {
      ...result,
      userId: updatedEquipamento.userId,
    };

    await this.cache.del(this.cacheKeyForEquipamento(id));
    return payload;
  }

  async updateStatus(id: string, status: StatusOperacional) {
    // Verificar se equipamento existe
    const existingEquipamento = await this.prisma.equipamento.findUnique({
      where: { id },
    });

    if (!existingEquipamento) {
      throw new NotFoundException('Equipamento não encontrado');
    }

    const updatedEquipamento = await this.prisma.equipamento.update({
      where: { id },
      data: { statusOperacional: status },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            username: true,
            email: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, ...result } = updatedEquipamento;
    const payload = {
      ...result,
      userId: updatedEquipamento.userId,
    };

    await this.cache.del(this.cacheKeyForEquipamento(id));
    return payload;
  }

  async remove(id: string) {
    // Verificar se equipamento existe
    const existingEquipamento = await this.prisma.equipamento.findUnique({
      where: { id },
    });

    if (!existingEquipamento) {
      throw new NotFoundException('Equipamento não encontrado');
    }

    await this.prisma.equipamento.delete({
      where: { id },
    });

    await this.cache.del(this.cacheKeyForEquipamento(id));
    return { message: 'Equipamento removido com sucesso' };
  }
}
