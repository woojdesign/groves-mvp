import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['active', 'paused', 'deleted'])
  status?: string;

  @IsOptional()
  @IsIn(['user', 'org_admin'])
  role?: string;
}
