import { Controller, Get, Query } from '@nestjs/common';

import { CharactersService } from './characters.service';
import { GetCharactersQueryDto } from './dto/get-characters-query.dto';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  async getMany(@Query() query: GetCharactersQueryDto) {
    const characters = await this.charactersService.getMany(query);

    return characters;
  }
}
