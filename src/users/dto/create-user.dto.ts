import { IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @MinLength(3)
  nickname: string;

  @IsEmail()
  email: string;

  @MinLength(3)
  name: string;

  @MinLength(8)
  password: string;
}
