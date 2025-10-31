export class ProfileResponseDto {
  id: string;
  userId: string;
  interests: string;
  project: string;
  connectionType: string;
  deepDive?: string;
  preferences?: string;
  createdAt: Date;
  updatedAt: Date;
}
