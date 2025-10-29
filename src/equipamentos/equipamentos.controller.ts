import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EquipamentosService } from './equipamentos.service';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';
import { UpdateEquipamentoDto } from './dto/update-equipamento.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { FilterEquipamentoDto } from './dto/filter-equipamento.dto';
import { EquipamentoResponseDto } from './dto/equipamento-response.dto';
import { StatusOperacional } from '../common/enums/status-operacional.enum';

@ApiTags('equipamentos')
@Controller('equipamentos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class EquipamentosController {
  constructor(private readonly equipamentosService: EquipamentosService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo equipamento' })
  @ApiResponse({
    status: 201,
    description: 'Equipamento criado com sucesso',
    type: EquipamentoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou usuário responsável não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  async create(@Body() createEquipamentoDto: CreateEquipamentoDto) {
    return this.equipamentosService.create(createEquipamentoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos os equipamentos com filtros opcionais',
  })
  @ApiQuery({
    name: 'nome',
    required: false,
    description: 'Filtrar por nome do equipamento',
    example: 'Monitor',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    description: 'Filtrar por tipo do equipamento',
    example: 'Monitor de Sinais Vitais',
  })
  @ApiQuery({
    name: 'setorAtual',
    required: false,
    description: 'Filtrar por setor atual',
    example: 'UTI',
  })
  @ApiQuery({
    name: 'statusOperacional',
    required: false,
    enum: StatusOperacional,
    description: 'Filtrar por status operacional',
    example: StatusOperacional.EM_USO,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número da página',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Quantidade de itens por página',
    example: 10,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de equipamentos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/EquipamentoResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  async findAll(@Query() filters?: FilterEquipamentoDto) {
    return this.equipamentosService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar equipamento por ID (UUID)' })
  @ApiParam({
    name: 'id',
    description: 'ID do equipamento (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Equipamento encontrado',
    type: EquipamentoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  async findOne(@Param('id') id: string) {
    return this.equipamentosService.findOne(id);
  }

  // Rotas específicas DEVEM vir antes das rotas com parâmetros genéricos
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar apenas o status operacional' })
  @ApiParam({
    name: 'id',
    description: 'ID do equipamento (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do equipamento atualizado com sucesso',
    type: EquipamentoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Status inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.equipamentosService.updateStatus(
      id,
      updateStatusDto.statusOperacional,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar equipamento completo' })
  @ApiParam({
    name: 'id',
    description: 'ID do equipamento (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Equipamento atualizado com sucesso',
    type: EquipamentoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou usuário responsável não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateEquipamentoDto: UpdateEquipamentoDto,
  ) {
    return this.equipamentosService.update(id, updateEquipamentoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Excluir equipamento' })
  @ApiParam({
    name: 'id',
    description: 'ID do equipamento (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Equipamento excluído com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Equipamento removido com sucesso',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Equipamento não encontrado',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou expirado',
  })
  async remove(@Param('id') id: string) {
    return this.equipamentosService.remove(id);
  }
}
