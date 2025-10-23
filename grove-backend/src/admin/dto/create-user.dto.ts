import { IsEmail, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsIn(['user', 'org_admin'])
  role?: string;

  @IsOptional()
  @IsIn(['magic_link', 'saml', 'oidc'])
  ssoProvider?: string;
}
