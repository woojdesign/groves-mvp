import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20, {
    message:
      'Please share a bit more about your niche interest (at least 20 characters)',
  })
  @MaxLength(500)
  nicheInterest: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20, {
    message: 'Please share a bit more about your project (at least 20 characters)',
  })
  @MaxLength(500)
  project: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['collaboration', 'mentorship', 'friendship', 'knowledge_exchange'], {
    message:
      'Connection type must be one of: collaboration, mentorship, friendship, knowledge_exchange',
  })
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
