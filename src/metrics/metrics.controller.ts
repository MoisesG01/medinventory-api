import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';
import { metricsRegistry } from './metrics';

@Controller()
export class MetricsController {
  @Get('metrics')
  @ApiExcludeEndpoint()
  async getMetrics(@Res() res: Response) {
    res.setHeader('Content-Type', metricsRegistry.contentType);
    res.send(await metricsRegistry.metrics());
  }
}

