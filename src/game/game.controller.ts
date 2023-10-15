import { Controller, Get, Post, Body } from '@nestjs/common';

import { GameService } from './game.service';
import { encryptData } from '@/lib/encryptData';
import { SuccessDto } from './dto/success';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('/anime')
  async getTodaysAnime() {
    const todaysAnime = await this.gameService.getTodaysAnime();

    return encryptData(JSON.stringify(todaysAnime));
  }

  @Get('/character')
  async getTodaysCharacter() {
    const todaysCharacter = await this.gameService.getTodaysCharacter();

    return encryptData(JSON.stringify(todaysCharacter));
  }

  @Get('/character-anime')
  async getTodaysCharacterAnime() {
    const todaysCharacterAnime =
      await this.gameService.getTodaysCharacterAnime();

    return encryptData(JSON.stringify(todaysCharacterAnime));
  }

  @Get('/time')
  async getTimeUntilNewSeed() {
    const time = await this.gameService.getTimeUntilNewSeed();

    return time;
  }

  @Post('/success')
  async success(@Body() body: SuccessDto) {
    const success = await this.gameService.success(body);

    return success;
  }
}
