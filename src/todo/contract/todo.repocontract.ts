import { Role, Todo, User } from "@prisma/client";
import { Todos } from "../entities/todo.entity";
import { UpdateTodoDto } from "../dto/create-todo-dto";
import { Counter } from "../entities/counter.entity";
import { PaginationResult } from "../entities/paginationtodo.entity";

export abstract class TodoRepoContract {
    abstract findRole(roleName: string): Promise<Role | null>;
    abstract getTodosByRoleId(roleId: number): Promise<Array<Todos>>;
    abstract getTodoByUserId(userId: number, pageTrue: number,pageFalse: number, pageSize: number): Promise<PaginationResult<Todos>> ;
    abstract findRoleById(roleId: number): Promise<Role | null>;
    abstract findRoleByName(roleName: string): Promise<Role | null>;
    abstract findUserByName(name: string): Promise<User | null>;
    abstract findTask(task: string): Promise<Todo | null>;
    abstract createTodo(data: { task: string; checklist: boolean; roleId: number ; userId: number}): Promise<Todos>;
    abstract getTodos(
        pageTrue: number ,
        pageFalse: number,
        pageSize: number
    ): Promise<PaginationResult<Todos>>
    abstract getTodoById(id: number): Promise<Todos | null> 
    abstract updateTodo(id: number, data: UpdateTodoDto): Promise<Todos>;
    abstract deleteTodo(id: number): Promise<Todos | null>;
    abstract getTodoSummary(): Promise<Partial<Counter>> ;
    abstract getTodoSummaryByName(users: string): Promise<Counter | null>;
    abstract findRoleByUsers(users: string): Promise<User|null>;
    abstract getTodoByName(
        name: string,
        pageTrue: number,pageFalse: number,
        pageSize: number
    ): Promise<PaginationResult<Todos>> 
}