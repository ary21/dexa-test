import { IsString, Matches, Length } from 'class-validator';

export class UpdatePhoneDto {
  @IsString()
  @Matches(/^[0-9]+$/, { message: 'Phone number must contain only numeric characters' })
  @Length(10, 15, { message: 'Phone number must be between 10 and 15 digits' })
  phone: string;
}
