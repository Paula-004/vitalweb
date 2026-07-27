import { User } from './domain'
export interface LoginInput { email:string; password:string }
export interface RegisterInput { firstName:string; lastName:string; email:string; phone:string; password:string }
export interface UpdateProfileInput { firstName:string; lastName:string; phone:string }
export interface ResetPasswordInput { token:string; password:string }
export interface AuthSession { user:User; accessToken:string; expiresAt:string; isMock?:boolean }
