import { Module } from '@nestjs/common';
import { TodoService } from './todo.service';
import { TodoController } from './todo.controller';
import { TodoRepository } from './todo.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [], // Add imports if needed
  controllers: [TodoController],
  providers: [TodoService, TodoRepository, PrismaService], // Register Prisma & Repository
  exports: [TodoService] // Export service if other modules need it
})
export class TodoModule {}

