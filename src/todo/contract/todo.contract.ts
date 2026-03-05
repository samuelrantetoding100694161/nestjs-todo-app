import { User } from "@prisma/client";
import { CreateTodoDto, UpdateTodoDto } from "../dto/create-todo-dto";
import { Todos } from "../entities/todo.entity";
import { Counter } from "../entities/counter.entity";
import { PaginationResult } from "../entities/paginationtodo.entity";

export abstract class TodoContract {
    abstract create(data: CreateTodoDto): Promise<Todos & { roles: string }>;
    abstract getTodos(user: User & { roles: string; users: string }, pageTrue: number, pageFalse: number,
        pageSize: number): Promise<PaginationResult<Todos>>
    abstract getTodoById(id: number): Promise<Todos | null> ;
    abstract updateTodo(id: number, data: UpdateTodoDto): Promise<Todos>;
    abstract deleteTodo(id: number): Promise<Todos | null>;
    abstract getTodoSummary(user: User & { roles: string; users: string }): Promise<{ userSummary: Counter; globalSummary?: Counter }>
    abstract getTodoSummaryByName(users: string): Promise<{ userSummary: Counter; globalSummary?: Counter }>;

}