import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class SuccessDto {
  @IsNotEmpty()
  @IsString()
  seedId: string;

  @IsNotEmpty()
  @IsString()
  game: string;

  @Min(0)
  @IsNumber()
  tries: number;
}
