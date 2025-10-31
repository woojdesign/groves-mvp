import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class GeneratePresetDto {
  @IsString()
  @IsNotEmpty()
  @IsIn([
    'casual_10',
    'engaged_10',
    'deep_10',
    'mixed_10',
    'diverse_50',
  ])
  template: string;
}
