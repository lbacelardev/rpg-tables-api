import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @Transform(({value}: { value: unknown }) => {
        return typeof value === 'string' ? value.trim() : value
    })
    @IsString({message: 'O nome deve ser um texto.'})
    @MinLength(2, {
        message: 'O nome deve ter pelo menos dois caracteres.'
    })
    name!: string;

    @IsEmail({},{message: 'O Email deve ser válido.'})
    email!: string;

    @IsString({message: 'A senha deve ser um texto.'})
    @MinLength(8, {message: 'A senha deve ter pelo menos 8 caracteres.'})
    password!: string;
}