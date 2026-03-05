import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoleController } from './roles/roles.controller';
import { RolesModule } from './roles/roles.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TodoModule } from './todo/todo.module';

@Module({
  imports: [RolesModule, AuthModule, UserModule, TodoModule],
  controllers: [AppController, RoleController],
  providers: [AppService],
})
export class AppModule {}
