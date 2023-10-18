import { IsArray, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GetUnlimitedQueryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blacklist: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whitelist: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minScore: number;
}
