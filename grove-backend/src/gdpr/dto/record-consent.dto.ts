import { IsString, IsIn } from 'class-validator';

export class RecordConsentDto {
  @IsIn(['privacy_policy', 'terms_of_service'])
  consentType: 'privacy_policy' | 'terms_of_service';

  @IsString()
  version: string;
}
