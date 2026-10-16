import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UsersService {
    create(body: CreateUserDto) {
        return {
            "message": "Dados recebidos. O usuário ainda não foi salvo.",
            "data": {
                "name": body.name,
                "email": body.email
            }
        }   
    }
}