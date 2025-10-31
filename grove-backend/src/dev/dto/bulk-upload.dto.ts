import {
  IsArray,
  IsNotEmpty,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateManualPersonaDto } from './create-manual-persona.dto';

export class BulkUploadDto {
  @IsArray()
  @IsNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateManualPersonaDto)
  personas: CreateManualPersonaDto[];
}
