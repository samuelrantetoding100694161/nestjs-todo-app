import { Status } from "@prisma/client";

export class User {
    id: number;
    name: string;
    email: string;
    password: string;
    role?: string;
    status: Status;
    // boxColor?: string;
    // roleColor?: string;
  }