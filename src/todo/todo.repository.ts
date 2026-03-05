import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Todo, Role, User } from '@prisma/client';
import { CreateTodoDto, UpdateTodoDto } from './dto/create-todo-dto';
import { Todos } from './entities/todo.entity';
import { TodoRepoContract } from './contract/todo.repocontract';
import { Counter } from './entities/counter.entity';
import { PaginationResult } from './entities/paginationtodo.entity';
import { todo } from 'node:test';


@Injectable()
export class TodoRepository extends TodoRepoContract{

    constructor(private readonly prisma: PrismaService) {
        super();
    }

    //Find a role by name
    async findRole(roleName: string): Promise<Role | null> {
        return this.prisma.role.findUnique({
        where: { roleName },
        });
    }

    async getTodosByRoleId(roleId: number): Promise<Array<Todos>> {
        return this.prisma.todo.findMany({
            where: { roleId },
            select: {
                id: true,
                task: true,
                checklist: true,
                role: {
                    select: { roleName: true },
                }, user: {
                    select: {name: true},
                }
            },
        }).then(todos =>
            todos.map(todo => ({
                id: todo.id,
                task: todo.task,
                checklist: todo.checklist,
                roles: todo.role?.roleName || '',
                users: todo.user?.name || '',
            }))
        );
    }

    async getTodoByUserId(userId: number, pageTrue: number,pageFalse: number, pageSize: number): Promise<PaginationResult<Todos>> {
        // Fetch checklist true & false todos separately and their total counts
        const [checklistTrue, checklistFalse, totalTrue, totalFalse] = await Promise.all([
            this.prisma.todo.findMany({
                where: { userId, checklist: true },
                skip: (pageTrue - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    task: true,
                    checklist: true,
                    role: { select: { roleName: true } },
                    user: { select: { name: true } },
                },
            }),
            this.prisma.todo.findMany({
                where: { userId, checklist: false },
                skip: (pageFalse - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    task: true,
                    checklist: true,
                    role: { select: { roleName: true } },
                    user: { select: { name: true } },
                },
            }),
            this.prisma.todo.count({ where: { userId, checklist: true } }),
            this.prisma.todo.count({ where: { userId, checklist: false } }),
        ]);
    
        const total = totalTrue + totalFalse;
    
        return {
            checklistTrue: checklistTrue.map(todo => ({
                id: todo.id,
                task: todo.task,
                checklist: todo.checklist,
                roles: todo.role?.roleName || '',
                users: todo.user?.name || ''
            })),
            checklistFalse: checklistFalse.map(todo => ({
                id: todo.id,
                task: todo.task,
                checklist: todo.checklist,
                roles: todo.role?.roleName || '',
                users: todo.user?.name || ''
            })),
            total,
            pageTrue,
            pageFalse,
            pageSize,
            totalPagesTrue: Math.ceil(totalTrue / pageSize),
            totalPagesFalse: Math.ceil(totalFalse / pageSize),
        };
    }
    

    async findRoleById(roleId: number): Promise<Role | null> {
        return this.prisma.role.findUnique({
            where: { id: roleId }, 
        });
    }
    
    async findRoleByName(roleName: string): Promise<Role | null> {
        return this.prisma.role.findUnique({
            where: { roleName: roleName }, 
            
        });
    }
    
    //Find a task by name
    async findTask(task: string): Promise<Todo | null> {
        return this.prisma.todo.findUnique({
        where: { task },
        });
    }

    //find user by name
    async findUserByName(name: string): Promise<User | null>{
        return this.prisma.user.findUnique({
            where: {name},
        });
    }

    //Create a new task
    async createTodo(data: { task: string; checklist: boolean; roleId: number ; userId: number}): Promise<Todos> {
        const newTodo = await this.prisma.todo.create({
            data: {
                task: data.task,
                checklist: data.checklist ?? false, 
                roleId: data.roleId, 
                userId: data.userId
            },
            include: {
                role: true, user: true
            },
        });
    
        return {
            id: newTodo.id,
            task: newTodo.task,
            checklist: newTodo.checklist,
            roles: newTodo.role?.roleName || null, // Rename `roleName` to `roles`
            users: newTodo.user?.name|| null
        };
    }

    async countTodos(): Promise<number> {
        return this.prisma.todo.count();
    }
    
    async countTodosByUserId(userId: number): Promise<number> {
        return this.prisma.todo.count({ where: { userId } });
    }
    
    
    async getTodos(
        pageTrue: number ,
        pageFalse: number,
        pageSize: number
    ): Promise<PaginationResult<Todos>> {
        // Fetch checklist true & false todos separately
        const [checklistTrue, checklistFalse, totalTrue, totalFalse] = await Promise.all([
            this.prisma.todo.findMany({
                where: { checklist: true },
                skip: (pageTrue - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    task: true,
                    checklist: true,
                    role: { select: { roleName: true } },
                    user: { select: { name: true } },
                },
            }),
            this.prisma.todo.findMany({
                where: { checklist: false },
                skip: (pageFalse - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    task: true,
                    checklist: true,
                    role: { select: { roleName: true } },
                    user: { select: { name: true } },
                },
            }),
            this.prisma.todo.count({ where: { checklist: true } }),
            this.prisma.todo.count({ where: { checklist: false } }),
        ]);
    
        const total = totalTrue + totalFalse;
    
        return {
            checklistTrue: checklistTrue.map(todo => ({
                id: todo.id,
                task: todo.task,
                checklist: todo.checklist,
                roles: todo.role?.roleName || '',
                users: todo.user?.name || '',
            })),
            checklistFalse: checklistFalse.map(todo => ({
                id: todo.id,
                task: todo.task,
                checklist: todo.checklist,
                roles: todo.role?.roleName || '',
                users: todo.user?.name || '',
            })),
            total,
            pageTrue,
            pageFalse,
            pageSize,
            totalPagesTrue: Math.ceil(totalTrue / pageSize),
            totalPagesFalse: Math.ceil(totalFalse / pageSize),
        };
    }
    
    
    async getTodoById(id: number): Promise<Todos | null> {
        return this.prisma.todo.findUnique({
          where: { id },
          select: {
            id: true,
            task: true,
            checklist: true,
            role: {
                select: { roleName: true },
            }, 
            user:{
                select: { name: true},
            }
        },
        }).then(todo => 
            todo ? {
                id: todo.id,
                task: todo.task,
                checklist: todo.checklist,
                roles: todo.role?.roleName || '', 
                users: todo.user?.name || ''
            } : null
        );
    }

    async getTodoByName(
        name: string,
        pageTrue: number,pageFalse: number,
        pageSize: number
    ): Promise<PaginationResult<Todos>> {
        // Fetch the user ID first
        const user = await this.prisma.user.findUnique({
            where: { name },
            select: { id: true },
        });
    
        // If the user doesn't exist, return empty response
        if (!user) {
            console.log("User not found");
            return new PaginationResult([], [], 0, 0, 0, 0,0,0);
        }
    
        // Fetch tasks separately for checklist: true and checklist: false
        const [checklistTrue, checklistFalse, totalTrue, totalFalse] = await Promise.all([
            this.prisma.todo.findMany({
                where: { userId: user.id, checklist: true },
                skip: (pageTrue - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    task: true,
                    checklist: true,
                    role: { select: { roleName: true } },
                    user: { select: { name: true } },
                },
            }),
            this.prisma.todo.findMany({
                where: { userId: user.id, checklist: false },
                skip: (pageFalse - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    task: true,
                    checklist: true,
                    role: { select: { roleName: true } },
                    user: { select: { name: true } },
                },
            }),
            this.prisma.todo.count({ where: { userId: user.id, checklist: true } }),
            this.prisma.todo.count({ where: { userId: user.id, checklist: false } }),
        ]);
        const total = totalTrue+totalFalse;
    
        return {
            checklistTrue: checklistTrue.map(todo => ({
                id: todo.id,
                task: todo.task,
                checklist: todo.checklist,
                roles: todo.role?.roleName || '',
                users: todo.user?.name || ''
            })),
            checklistFalse: checklistFalse.map(todo => ({
                id: todo.id,
                task: todo.task,
                checklist: todo.checklist,
                roles: todo.role?.roleName || '',
                users: todo.user?.name || ''
            })),
            total,
            pageTrue,
            pageFalse,
            pageSize,
            totalPagesTrue: Math.ceil(totalTrue / pageSize),
            totalPagesFalse: Math.ceil(totalFalse / pageSize),
        };
    }
    
    
    async updateTodo(id: number, data: UpdateTodoDto): Promise<Todos> {
        const todo = await this.prisma.todo.findUnique({
            where: { id },
            select: { checklist: true }, // Only fetch the checklist status
        });
    
        if (!todo) {
            throw new NotFoundException(`Todo with ID ${id} not found.`);
        }
    
        if (todo.checklist === true) {
            throw new BadRequestException('Checklist is already marked as done.');
        }
    
        // Update checklist to true
        const updatedTodo = await this.prisma.todo.update({
            where: { id },
            data: { checklist: true },
            select: {
                id: true,
                task: true,
                checklist: true,
                role: {
                    select: { roleName: true },
                },
                user:{
                    select: {name : true},
                }
            },
        });
    
        return {
            id: updatedTodo.id,
            task: updatedTodo.task,
            checklist: updatedTodo.checklist,
            roles: updatedTodo.role?.roleName || '', // Rename `roleName` to `roles`
            users: updatedTodo.user?.name || ''
        };
    }
    
    
    async deleteTodo(id: number): Promise<Todos |null > {
        
        return this.prisma.todo.delete({ 
            where: { id },
            select: {
                id: true,
                task: true,
                checklist: true,
                role: {
                    select: { roleName: true },
                }, user: {
                    select: { name: true},
                }
            },
            }).then(todo => 
                todo ? {
                    id: todo.id,
                    task: todo.task,
                    checklist: todo.checklist,
                    roles: todo.role?.roleName || '',
                    users: todo.user?.name || '' 
                } : null
            );
    }

    // async getTodoSummary(): Promise<Counter[]> {
    //     // Fetch all users
    //     const users = await this.prisma.user.findMany({
    //       select: {
    //         id: true,
    //         name: true,
    //       },
    //     });
      
    //     // Fetch total tasks per user
    //     const taskCounts = await this.prisma.todo.groupBy({
    //       by: ['userId'],
    //       _count: {
    //         _all: true, // Total tasks
    //       },
    //     });
      
    //     // Fetch completed (done) tasks per user (where checklist = true)
    //     const doneTasksCounts = await this.prisma.todo.groupBy({
    //       by: ['userId'],
    //       _count: {
    //         _all: true, // Count where checklist = true
    //       },
    //       where: {
    //         checklist: true,
    //       },
    //     });
      
    //     // Convert to maps for easy lookup
    //     const taskMap = new Map<number, number>();
    //     const doneMap = new Map<number, number>();
      
    //     for (const entry of taskCounts) {
    //       if (entry.userId !== null) {
    //         taskMap.set(entry.userId, entry._count._all || 0);
    //       }
    //     }
      
    //     for (const entry of doneTasksCounts) {
    //       if (entry.userId !== null) {
    //         doneMap.set(entry.userId, entry._count._all || 0);
    //       }
    //     }
      
    //     // Ensure all users appear in the final result
    //     return users.map((user) => {
    //       const totalTasks = taskMap.get(user.id) || 0;
    //       const doneTasks = doneMap.get(user.id) || 0;
    //       const todoTasks = totalTasks - doneTasks; // Remaining tasks
      
    //       return {
    //         userId: user.id,
    //         name: user.name,
    //         doneTasks,
    //         todoTasks,
    //       };
    //     });
    //   }

    async getTodoSummary(): Promise<Counter> {
        // Count all tasks
        const totalTasks = await this.prisma.todo.count();
    
        // Count completed tasks (where checklist = true)
        const doneTasks = await this.prisma.todo.count({
            where: { checklist: true },
        });
    
        // Calculate remaining tasks
        const todoTasks = totalTasks - doneTasks;
    
        return {
            userId: 0, // Global count, not linked to a specific user
            name: 'All',
            doneTasks,
            todoTasks,
        };
    }

      async getTodoSummaryByName(users: string): Promise<Counter | null> {
        // Fetch the user details
        const user = await this.prisma.user.findUnique({
          where: { name: users },
          select: {
            id: true,
            name: true,
          },
        });
      
        if (!user) {
          return null; // Return null if user not found
        }
      
        // Fetch total tasks for the user
        const taskCount = await this.prisma.todo.count({
          where: { userId: user.id },
        });
      
        // Fetch done tasks for the user (where checklist = true)
        const doneCount = await this.prisma.todo.count({
          where: { userId: user.id, checklist: true },
        });
      
        return {
          userId: user.id,
          name: user.name,
          doneTasks: doneCount,
          todoTasks: taskCount - doneCount, // Remaining tasks
        };
      }

      async findRoleByUsers(users: string): Promise<User|null>{
        return this.prisma.user.findUnique({
            where: {name: users},
            include: {role: true},          
        })
      }
      
}
