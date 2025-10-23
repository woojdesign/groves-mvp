import { IsOptional, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for optional filtering criteria when generating matches.
 * Controls which candidates should be excluded.
 */
export class MatchFiltersDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  excludePriorMatches?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  excludeSameOrg?: boolean = true;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  minScore?: number = 0.7;
}
