import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { FilterEquipamentoDto } from './dto/filter-equipamento.dto';
import { StatusOperacional } from '../common/enums/status-operacional.enum';

@Injectable()
export class EquipamentosService {
  constructor(private prisma: PrismaService) {}

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

    // Construir filtros para a query
    const where: any = {};

    if (filters?.nome) {
      where.nome = {
        contains: filters.nome,
      };
    }

    if (filters?.tipo) {
      where.tipo = {
        contains: filters.tipo,
      };
    }

    if (filters?.setorAtual) {
      where.setorAtual = {
        contains: filters.setorAtual,
      };
    }

    if (filters?.statusOperacional) {
      where.statusOperacional = filters.statusOperacional;
    }

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

  async findOne(id: string) {
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
    return {
      ...result,
      userId: equipamento.userId,
    };
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
    return {
      ...result,
      userId: updatedEquipamento.userId,
    };
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
    return {
      ...result,
      userId: updatedEquipamento.userId,
    };
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

    return { message: 'Equipamento removido com sucesso' };
  }
}
