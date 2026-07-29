import { z } from 'zod';

const SocialDto = z.object({
    twitter: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
});

export const UserDto = z.object({
    id: z.number().int().positive(),
    fullName: z.string(),
    bio: z.string(),
    token: z.string().optional(),
    social: SocialDto.optional(),
});

export const SignUpDto = z.object({
    email: z.email(),
    fullName: z.string().min(1),
    password: z.string().min(6),
    bio: z.string().optional(),
    social: SocialDto.optional(),
});

export const SignInDto = z.object({
    email: z.email(),
    password: z.string().min(1),
});

export const UpdateProfileDto = z.object({
    fullName: z.string().min(1).optional(),
    bio: z.string().optional(),
    social: SocialDto.optional(),
});

export const LoginResponseDto = z.object({ token: z.string() });
export const ErrorResponseDto = z.object({ error: z.string() });
export const ProfileResponseDto = z.object({ id: z.number(), email: z.string() });

export type SignUpInput = z.infer<typeof SignUpDto>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;
