import { User } from './domain'
export interface LoginInput { username:string; password:string }
/** `sellerCode`: código del vendedor que trajo al comprador. Opcional (venta directa). */
export interface RegisterInput { firstName:string; lastName:string; username:string; phone:string; password:string; sellerCode?:string; invitationToken?:string }
export interface UpdateProfileInput { firstName:string; lastName:string; phone:string }
export interface ResetPasswordInput { token:string; password:string }
export interface AuthSession { user:User; accessToken:string; expiresAt:string; isMock?:boolean }
