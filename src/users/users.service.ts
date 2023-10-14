import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(userData: CreateUserDto) {
    const passwordHash = await bcrypt.hash(userData.password, 10);

    const user = await this.prisma.user.create({
      data: { ...userData, password: passwordHash },
    });

    return user;
  }

  async findOne(query: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: query }, { email: query }],
      },
      select: {
        nickname: true,
        id: true,
        email: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: {
        id: id,
      },
      data: updateUserDto,
    });

    return user;
  }
}
