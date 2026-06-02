import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { PublicUser } from './user.types';

interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(input: CreateUserInput): Promise<User> {
    const email = this.normalizeEmail(input.email);
    const username = input.username.trim();

    const existingUser = await this.usersRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser?.email === email) {
      throw new ConflictException('Email is already registered');
    }

    if (existingUser?.username === username) {
      throw new ConflictException('Username is already taken');
    }

    const user = this.usersRepository.create({
      email,
      username,
      passwordHash: input.passwordHash,
    });

    return this.usersRepository.save(user);
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: this.normalizeEmail(email) },
    });
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}