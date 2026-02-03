import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { NoMaliciousContent } from '../../common/decorators/no-malicious-content.decorator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  @MaxLength(1000, { message: 'Message must not exceed 1000 characters' })
  @NoMaliciousContent({ message: 'Message contains malicious content' })
  message: string;

  @IsString()
  @IsNotEmpty({ message: 'Session ID is required' })
  session_id: string;

  @IsOptional()
  @IsString()
  run_id?: string;

  @IsOptional()
  @IsBoolean()
  first_message?: boolean;
}
