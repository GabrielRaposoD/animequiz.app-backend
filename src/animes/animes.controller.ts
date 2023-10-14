import { Controller, Get } from '@nestjs/common';

import { AnimesService } from './animes.service';

@Controller('animes')
export class AnimesController {
  constructor(private readonly animesService: AnimesService) {}

  @Get()
  async getMany() {
    const animes = await this.animesService.getMany();

    return animes;
  }
}
