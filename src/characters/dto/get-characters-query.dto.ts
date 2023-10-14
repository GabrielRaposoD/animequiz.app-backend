import { IsOptional, IsString } from 'class-validator';

export class GetCharactersQueryDto {
  @IsOptional()
  @IsString()
  name: string;
}
