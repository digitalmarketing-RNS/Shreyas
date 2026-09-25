import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
export const PASSWORD_MESSAGE = 'Password must be 8–72 characters and include at least one letter and one number.';

export class LoginDto {
  @ApiProperty({ example: 'admin', description: 'Username, email or mobile number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  username: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ description: 'Username, email or mobile number' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  username: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  token: string;

  @ApiProperty()
  @IsString()
  @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
