import { IsEmail, IsNotEmpty } from 'class-validator';

export class MagicLinkRequestDto {
  @IsEmail({}, { message: 'email must be a valid email' })
  @IsNotEmpty()
  email: string;
}
