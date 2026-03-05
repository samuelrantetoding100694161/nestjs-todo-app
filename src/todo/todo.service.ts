import { BadRequestException, ForbiddenException, HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto, UpdateTodoDto } from './dto/create-todo-dto';
import { TodoRepository } from './todo.repository';
import { Todos } from './entities/todo.entity';
import { User } from '@prisma/client';
import { TodoContract } from './contract/todo.contract';
import { Counter } from './entities/counter.entity';
import { todo } from 'node:test';
import { PaginationResult } from './entities/paginationtodo.entity';



@Injectable()
export class TodoService extends TodoContract{
    constructor(
        private readonly todoRepository: TodoRepository
    ){
        super();
    }

    // async create(data: CreateTodoDto): Promise<Todos> {
    //     try {
    //         let roleId: number | undefined = undefined;

    //         // Fetch roleId from roleName if roleName is provided
    //         if (data.roles) {
    //             const roleData = await this.todoRepository.findRole(data.roles);
    //             if (!roleData) {
    //                 throw new BadRequestException(`Role '${data.roles}' not found!`);
    //             }
    //             roleId = roleData.id;
    //         }

    //         // Check if the task already exists
    //         const existingTask = await this.todoRepository.findTask(data.task);
    //         if (existingTask) {
    //             throw new BadRequestException('Task with the same name already exists!');
    //         }

    //         // Create the task
    //         console.log('create todo task');
    //         return this.todoRepository.createTodo({
    //             task: data.task,
    //             checklist: data.checklist ?? false,
    //             roleId: roleId ?? undefined,
    //         });
    //     } catch (error) {
    //         if (error instanceof HttpException) {
    //             throw error;
    //         }
    //         throw new BadRequestException("error in inputing task!");      
    //     }
    // }

    async create(data: CreateTodoDto): Promise<Todos & { roles: string }> {
        //const { task, roles, checklist } = data;
        console.log("Checking Role in DB:", data.roles);

        if (!data.roles) {
            throw new BadRequestException("No role provided!");
        }
    
        // Find the role in the database
        const roleData = await this.todoRepository.findRoleByName(data.roles);
        const userData = await this.todoRepository.findUserByName(data.users);
    
        
        console.log("Role Found:", roleData?.roleName);
        console.log("User Found:", userData?.name);
        
    
        // If role does not exist, throw an error
        if (!roleData) {
            throw new BadRequestException("Invalid role provided!");
        }
        if(!userData){
            throw new BadRequestException('Invalid user assigned');
        }
        if(roleData.id != userData.roleId){
            throw new BadRequestException('the role is not matching with the user role');
        }
    
        // Check if a task with the same name already exists
        const existingTask = await this.todoRepository.findTask(data.task);
        if (existingTask) {
            throw new BadRequestException("Task with the same name already exists!");
        }
    
        try {
            // Create the new task
            const newTask = await this.todoRepository.createTodo({
                task: data.task,
                checklist: data.checklist ?? false,
                roleId: roleData.id, // Ensure the correct role ID
                userId: userData?.id
            });
            console.log(newTask);
    
            return { ...newTask, roles: roleData.roleName, users: userData.name };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            //console.error("Error creating task:", error);

            throw new BadRequestException("Cannot create task!");
        }
    }
    
    async getTodos(user: User & { roles: string; users: string }, pageTrue: number, pageFalse: number,
        pageSize: number): Promise<PaginationResult<Todos>>  {
        try {
            console.log('the name', user)
            console.log('the role', user.roles);
            if (!user.roles) {
                throw new ForbiddenException('User does not have an assigned role');
            }
        
            // Role Owner: See all tasks
            const role = await this.todoRepository.findRoleByName(user.roles);
            if(!role){
                throw new NotFoundException('Role is not exist');
            }
            if (role.roleName.toLowerCase() === 'owner') {
                return this.todoRepository.getTodos(pageTrue, pageFalse, pageSize);
            }
        
            // Other User: See only their role's tasks
            //console.log('Get list')
            return this.todoRepository.getTodoByUserId(user.id, pageTrue, pageFalse, pageSize);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new NotFoundException("task is not found");
            
        }
       
    }
    
    async getTodoById(id: number): Promise<Todos | null> {
        try {
            const todo = await this.todoRepository.getTodoById(id);
            if (!todo) throw new NotFoundException(`Todo task with ID ${id} not found`);
            return todo;      
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new NotFoundException("task is not found"); 
        }
        
    }

    async getTodoByName(name: string, pageTrue: number, pageFalse: number,
        pageSize: number): Promise<PaginationResult<Todos>> {
        try {
            const todo = await this.todoRepository.getTodoByName(name, pageTrue, pageFalse, pageSize);
            if (!todo) throw new NotFoundException(`Todo task with name not found`);
            return todo;      
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new NotFoundException("task is not found"); 
        }
    }

    async updateTodo(id: number, data: UpdateTodoDto): Promise<Todos> {
        try {
            const updateTodo = await this.todoRepository.updateTodo(id, data);
            if (!updateTodo){
                throw new NotFoundException("cannot update task!");
            }
            console.log('update task as done');
            return updateTodo;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new NotFoundException("task is already updated as done!");
        }
         
    }

    async deleteTodo(id: number): Promise<Todos | null> {
        try {
            const deleteTodo = await this.todoRepository.deleteTodo(id);
            if(!deleteTodo){
                throw new NotFoundException("the task is not exist to be deleted!");
            }
            console.log('delete task');

            return deleteTodo;
            
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new NotFoundException("Unable to delete task!");
            
        }
    }

    async getTodoSummary(user: User & { roles: string; users: string }): Promise<{ userSummary: Counter; globalSummary?: Counter }>  {
        try {
            console.log('the name', user.name)
            console.log('the role', user.roles);
            if (!user.roles) {
                throw new ForbiddenException('User does not have an assigned role');
            }
            const role = await this.todoRepository.findRoleByName(user.roles);
            if(!role){
                throw new NotFoundException('Role is not exist');
            }
            const userSummary = await this.todoRepository.getTodoSummaryByName(user.name);
            if (!userSummary) {
                throw new NotFoundException("The task summary does not exist");
            }
            if (role.roleName.toLowerCase() != 'owner') {
                return {userSummary};
            }
            const todoSummary = await this.todoRepository.getTodoSummary();
            if (!todoSummary) {
                throw new NotFoundException("The task list does not exist");
            }
    
            // Return both summaries for Owners
            return { userSummary, globalSummary: todoSummary };
            
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            
            throw new NotFoundException("Unable to fetch task summary!");
            
            
        }
       
    }

    async getTodoSummaryByName(users: string): Promise<{ userSummary: Counter; globalSummary?: Counter }> {
        try {
            // Fetch user role
            const user = await this.todoRepository.findUserByName(users);
            console.log(users);
            console.log(user);
            if (!user) {
                throw new NotFoundException(`User role ${users} not found`);
            }
    
            // Fetch user's task summary
            const userSummary = await this.todoRepository.getTodoSummaryByName(users);
            if (!userSummary) {
                throw new NotFoundException("The task summary does not exist");
            }
    
            // If user is not an Owner, return only their summary
            if (user.roleId != 1) {
                return { userSummary };
            }
    
            // Fetch total task summary (for Owners)
            const globalSummary = await this.todoRepository.getTodoSummary();
            if (!globalSummary) {
                throw new NotFoundException("The task list does not exist");
            }
    
            // Return both summaries for Owners
            return { userSummary };
    
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new NotFoundException("Unable to fetch task summary!");
        }
    }
    
}
