import { IsString, IsUrl } from 'class-validator';

export class UpdatePhotoDto {
  @IsString()
  @IsUrl({}, { message: 'photoUrl must be a valid URL' })
  photoUrl: string;
}
