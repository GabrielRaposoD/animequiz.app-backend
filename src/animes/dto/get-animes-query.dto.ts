import { IsOptional, IsString } from 'class-validator';

export class GetAnimesQueryDto {
  @IsOptional()
  @IsString()
  title: string;
}
