import { Controller, Get, Post, Body, Query } from '@nestjs/common';

import { GameService } from './game.service';
import { encryptData } from '@/lib/encryptData';
import { SuccessDto } from './dto/success';
import { GetUnlimitedQueryDto } from './dto/get-unlimited-query';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('/anime')
  async getTodaysAnime() {
    const todaysAnime = await this.gameService.getTodaysAnime();

    const encryptedData = await encryptData(JSON.stringify(todaysAnime));

    return encryptedData;
  }

  @Get('/character')
  async getTodaysCharacter() {
    const todaysCharacter = await this.gameService.getTodaysCharacter();

    const encryptedData = await encryptData(JSON.stringify(todaysCharacter));

    return encryptedData;
  }

  @Get('/character-anime')
  async getTodaysCharacterAnime() {
    const todaysCharacterAnime =
      await this.gameService.getTodaysCharacterAnime();

    const encryptedData = await encryptData(
      JSON.stringify(todaysCharacterAnime),
    );

    return encryptedData;
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

  @Get('/unlimited/anime')
  async getNextUnlimitedAnime(@Query() query: GetUnlimitedQueryDto) {
    const next = await this.gameService.getRandomAnimeOptions(query);

    const encryptedData = await encryptData(JSON.stringify(next));

    return encryptedData;
  }

  @Get('/unlimited/character')
  async getNextUnlimitedCharacter(@Query() query: GetUnlimitedQueryDto) {
    const next = await this.gameService.getRandomCharacterOptions(query);

    const encryptedData = await encryptData(JSON.stringify(next));

    return encryptedData;
  }
}
