import { User } from './domain'
export interface LoginInput { email:string; password:string }
/**
 * Datos que pide el backoffice para abrir la cuenta: el correo la identifica y el
 * teléfono es el que usa el reparto.
 * `sellerCode`: código del vendedor que trajo al comprador. Opcional (venta directa).
 */
export interface RegisterInput { fullName:string; email:string; phone:string; password:string; sellerCode?:string }
export interface UpdateProfileInput { firstName:string; lastName:string; phone:string }
export interface ResetPasswordInput { token:string; password:string }
export interface AuthSession { user:User; accessToken:string; expiresAt:string; isMock?:boolean }
