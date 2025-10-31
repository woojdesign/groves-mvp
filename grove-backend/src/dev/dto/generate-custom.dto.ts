import {
  IsNumber,
  IsArray,
  IsOptional,
  IsString,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class GenerateCustomDto {
  @IsNumber()
  @Min(1)
  @Max(100)
  count: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  intensityLevels: ('casual' | 'engaged' | 'deep')[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  categories?: string[];

  @IsString()
  @IsOptional()
  customPrompt?: string;
}
