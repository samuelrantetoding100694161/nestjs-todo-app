import { Injectable, NotFoundException, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDTO } from "./dto/create-user-dto";
import { PrismaService } from "src/prisma/prisma.service";
import { Prisma, Role, Status } from "@prisma/client";
import { UserRepoContract } from "./contract/user.repocontract";
import { User } from "./entities/user.entity";
import { PaginationResult } from "./entities/pagination.entity";

@Injectable()
export class UserRepository extends UserRepoContract{

  constructor(private readonly prisma: PrismaService){    
    super();
  };
  private readonly user =[];

  async create(
    email: string,
    name: string,
    password: string,
    roles: string, // Accepts "roles" instead of "role"
    status: Status
): Promise<Omit<User, 'role'> & { roles: string }> { //Exclude "role" and replace with "roles"
    console.log("create() method started");

    email = email.toLowerCase();

    const roleData = await this.prisma.role.findUnique({
        where: { roleName: roles }, // Match "roles"
    });
    console.log("🔹 Checking Role in DB:", roles);
    console.log("🔹 Role Found:", roleData);

    if (!roleData) {
        throw new NotFoundException('Role not found');
    }

    const newUser = await this.prisma.user.create({
        data: {
            email,
            name,
            password,
            status,
            roleId: roleData.id, // Store roleId
        },
        include: { role: true },
    });

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      password: newUser.password, // Ensure hashed password is included
      status: newUser.status,
      roles: newUser.role?.roleName || "", 
    };
}


  async findbyEmail(email: string): Promise<{ id: number; name: string; email: string; status: string; role: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
          id: true,
          name: true,
          email: true,
          status: true,
          role: { select: { roleName: true } }, // Ensure role is a relation
      },
    });
    console.log('Checking for existing email:', email); 
    console.log(user);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role?.roleName || "", // Handle null case
      status: user.status,
    };
}


    async findbyId(id: number): Promise<any> {
      return this.prisma.user.findUnique({
          where: { id },
          select: {
              email: true,
              name: true,
              role: { select: { roleName: true } }, 
              status: true,
          },
      });
  }
  
      async findStatus(id: number): Promise<any> {//find status
        return this.prisma.user.findUnique({
          where: { id },
          select: {
            status: true
          },
        });
      }

      async findbyUsername(name: string): Promise<any> {
        const user = await this.prisma.user.findUnique({
          where: { name },
          select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: { select: { roleName: true } }, // Fetch roleName correctly
              status: true,
          },
      });
      if (!user) {
        return null;
    }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        password: user.password,
        role: user.role?.roleName || "", // Only return roleName as a string
        status: user.status,
    };
    }
    
    async update(id: number, body: Prisma.UserUpdateInput): Promise<{ 
      id: number; 
      name: string; 
      email: string; 
      status: Status; 
      roleName: string; 
  }> {
      const updateUser = await this.prisma.user.update({
          where: { id },
          data: body,
          select: {
              id: true,
              name: true,
              email: true,
              status: true,
              role: {  
                  select: { roleName: true }
              }
          },
      });
  
      return {
        id: updateUser.id,
        name: updateUser.name,
        email: updateUser.email,
        status: updateUser.status,
        roleName: updateUser.role?.roleName || ""  
      };
  }
  

    async updateData(email: string, body: Prisma.UserUpdateInput): Promise<{ id: number; email: string; name: string; roleName: string ; status?: Status }> {
      
      const updateUser = await this.prisma.user.update({
        where: { email },
        data: body,
        select: {
            id: true,
            email: true,
            name: true,
            status: true,
            role: { select: { roleName: true } } 
        }
      });
    
      return {
        id: updateUser.id,
        name: updateUser.name,
        email: updateUser.email,
        status: updateUser.status,
        roleName: updateUser.role?.roleName || "",
      };
    }
    

    async delete(id: number): Promise<any>{//delete user based on id
        return this.prisma.user.delete({where: {id}});

    }
    async getAllUser(): Promise<Partial<User>[]> {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          role: { select: { roleName: true, boxColor: true,
            roleColor: true, } }, 
      }, orderBy: {
        id: 'asc', // Change 'name' to the field you want to order by
    },
    });
    return users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status, // Spread user properties
      roles: user.role?.roleName || "Unknown", 
      boxColor: user.role?.boxColor,
      roleColor: user.role?.roleColor
    }));
  }

  //get all user using pagination
  async findAllPaginated(page: number, pageSize: number, filters?: any): Promise<PaginationResult<any>> {
    const skip = (page - 1) * pageSize;

    // Build dynamic filter conditions
    const whereClause: any = {};

    if (filters?.email) whereClause.email = { contains: filters.email, mode: 'insensitive' };
    if (filters?.role) whereClause.role =  { roleName: filters.role } ;
    if (filters?.status) whereClause.status = filters.status;

    const users = await this.prisma.user.findMany({
        where: whereClause, // Apply filters
        select: {
            id: true,
            name: true,
            email: true,
            status: true,
            role: { select: { roleName: true, boxColor: true, roleColor: true } }, 
        },
        orderBy: { id: 'asc' },
        skip,
        take: pageSize,
    });

    const totalUsers = await this.prisma.user.count({ where: whereClause }); // Count with filters

    const returnUser = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        roles: user.role?.roleName || "Unknown",
        boxColor: user.role?.boxColor,
        roleColor: user.role?.roleColor
    }));

    return new PaginationResult(returnUser, totalUsers, page, pageSize);
}

  
  async getUserbyId(userId: number): Promise<Partial<User> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        role: {
          select: { roleName: true },  // Selecting roleName from the related role
        },
      },
    });
  
    if (!user) return null;
  
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role?.roleName, // Safely handle roleName
    };
  }
  
  }