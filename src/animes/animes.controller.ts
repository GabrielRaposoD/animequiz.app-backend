import { Controller, Get, Query } from '@nestjs/common';

import { AnimesService } from './animes.service';
import { GetAnimesQueryDto } from './dto/get-animes-query.dto';

@Controller('animes')
export class AnimesController {
  constructor(private readonly animesService: AnimesService) {}

  @Get()
  async getMany(@Query() query: GetAnimesQueryDto) {
    const animes = await this.animesService.getMany(query);

    return animes;
  }
}
