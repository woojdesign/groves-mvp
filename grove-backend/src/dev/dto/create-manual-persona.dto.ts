import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateManualPersonaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(500)
  nicheInterest: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(500)
  project: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['collaboration', 'mentorship', 'friendship', 'knowledge_exchange'])
  connectionType: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  rabbitHole?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  preferences?: string;
}
