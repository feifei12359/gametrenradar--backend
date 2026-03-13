import { Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { KeywordStage, RegionCode } from '@prisma/client';
import { DiscoveryPipelineService } from '../../services/discovery-pipeline.service';
import { DiscoveryQueryDto } from './dto/discovery-query.dto';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly discoveryPipelineService: DiscoveryPipelineService,
  ) {}

  @Get('new')
  getNew(@Query() query: DiscoveryQueryDto) {
    return this.discoveryService.getStageResults(KeywordStage.NEW, query);
  }

  @Get('early')
  getEarly(@Query() query: DiscoveryQueryDto) {
    return this.discoveryService.getStageResults(KeywordStage.EARLY, query);
  }

  @Get('exploding')
  getExploding(@Query() query: DiscoveryQueryDto) {
    return this.discoveryService.getStageResults(KeywordStage.EXPLODING, query);
  }

  @Get('keyword/:id')
  async getKeywordDetail(@Param('id') id: string) {
    const detail = await this.discoveryService.getKeywordDetail(id);
    if (!detail) {
      throw new NotFoundException('Keyword not found');
    }
    return detail;
  }

  @Get('regions/summary')
  getRegionsSummary() {
    return this.discoveryService.getRegionsSummary();
  }

  @Get('debug/generic-keywords')
  getGenericKeywordSamples(@Query('region') region?: RegionCode) {
    return this.discoveryService.getGenericKeywordSamples(region);
  }

  @Post('run')
  runPipeline(@Query('region') region?: RegionCode, @Query('query') query?: string) {
    return this.discoveryPipelineService.runDiscovery({ region, query });
  }
}
