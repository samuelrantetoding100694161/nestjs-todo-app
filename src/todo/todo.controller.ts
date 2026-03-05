import { Controller, Get, Post, Put, Delete, Param, Body, BadRequestException, NotFoundException, Req, UseGuards, Query } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto, UpdateTodoDto } from './dto/create-todo-dto';
import { AuthGuard } from 'src/auth/auth-guards';
import { Counter } from './entities/counter.entity';
import { Todos } from './entities/todo.entity';
import { PaginationResult } from './entities/paginationtodo.entity';


@Controller('todos') // Base route: /todos
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  // Create a new Todo
  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() data: CreateTodoDto) {
    try {
      return await this.todoService.create(data);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  //get all todo list
  @Get()
  @UseGuards(AuthGuard)
  async getTodos(
      @Req() req,
      @Query('pageTrue') pageTrue: string,
      @Query('pageFalse') pageFalse: string,
      @Query('pageSize') pageSize: string
  ) {//set default to 5 per page
      const user = req.user; // Extract user from request (from JWT or session)
      const pageNumberTrue = parseInt(pageTrue, 10) || 1;
      const pageNumberFalse = parseInt(pageFalse, 10) || 1;
      const pageSizeNumber = parseInt(pageSize, 10) || 5;
  
      return this.todoService.getTodos(user, pageNumberTrue, pageNumberFalse, pageSizeNumber);
  }
  

  @Get('summary')
  @UseGuards(AuthGuard)
  async getTodoSummary(@Req() req){
    const user = req.user;
    console.log(user);
    return this.todoService.getTodoSummary(user);

  }

  @Get('summary/:users')
  async getTodoSummaryByName(@Param('users') users: string): Promise<{ userSummary: Counter; globalSummary?: Counter }>  {
    const todoSummary = await this.todoService.getTodoSummaryByName(users);
    
    
    if (!todoSummary || (Array.isArray(todoSummary) && todoSummary.length === 0)) {
      throw new NotFoundException(`No task summary found for user: ${users}`);
    }

    return todoSummary;
  }

  //get todos by name
  @Get('name/:users')
  async getTodoByName(@Param('users') users: string, @Req() req,
  @Query('pageTrue') pageTrue: string , 
  @Query('pageFalse') pageFalse: string , 
  @Query('pageSize') pageSize: string ): Promise<PaginationResult<Todos>>{
    const pageNumberTrue = parseInt(pageTrue, 10) || 1;
    const pageNumberFalse = parseInt(pageFalse, 10) || 1;
    const pageSizeNumber = parseInt(pageSize, 10) || 5;

    const todoName = await this.todoService.getTodoByName(users, pageNumberTrue, pageNumberFalse, pageSizeNumber);

    return todoName;
  }


  

  // Get a Todo by ID
  @Get(':id')
  @UseGuards(AuthGuard)
  async getTodoById(@Param('id') id: string) {
    const todo = await this.todoService.getTodoById(Number(id));
    if (!todo) throw new NotFoundException(`Todo with ID ${id} not found`);
    return todo;
  }

  // Update a Todo by ID
  @Put(':id')
  @UseGuards(AuthGuard)
  async updateTodo(@Param('id') id: string, @Body() data: UpdateTodoDto) {
    return await this.todoService.updateTodo(Number(id), data);
  }

  // Delete a Todo by ID
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteTodo(@Param('id') id: string) {
    return await this.todoService.deleteTodo(Number(id));
  }
  
}
