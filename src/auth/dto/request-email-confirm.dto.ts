import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestEmailConfirmDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
