import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PersonaInputDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  interests: string;

  @ApiProperty()
  @IsString()
  project: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  deepDive?: string;
}

export class AnalyzePersonasDto {
  @ApiProperty({ type: [PersonaInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PersonaInputDto)
  personas: PersonaInputDto[];

  @ApiProperty({ required: false, description: 'Optional batch ID for tracking' })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiProperty({ required: false, description: 'Store results for later comparison' })
  @IsOptional()
  saveResults?: boolean;
}
