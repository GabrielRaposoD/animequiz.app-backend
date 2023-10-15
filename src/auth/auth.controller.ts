import {
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { Public } from './public';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  /* Login user */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() body: LoginDto) {
    const token = await this.authService.login(req.user);

    return token;
  }

  /* Register user */
  @Public()
  @Post('register')
  async register(@Body() userData: CreateUserDto) {
    const user = await this.userService.create(userData);

    const token = await this.authService.login(user);

    return token;
  }

  /* Get user profile */

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = await this.userService.findOne(
      req.user.email,
    );
    return user;
  }
}
