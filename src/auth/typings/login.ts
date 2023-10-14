import { ApiProperty } from '@nestjs/swagger';

export class Login {
  @ApiProperty()
  access_token: string;
}
