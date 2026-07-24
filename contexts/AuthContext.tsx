'use client'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { authService, userService } from '@/services'
import { AuthSession, LoginInput, RegisterInput, UpdateProfileInput } from '@/types/auth'
import { configureApiClient } from '@/lib/apiClient'

type Value={session:AuthSession|null;login:(input:LoginInput)=>Promise<void>;register:(input:RegisterInput)=>Promise<void>;logout:()=>Promise<void>;recover:(email:string)=>Promise<void>;updateProfile:(input:UpdateProfileInput)=>Promise<void>;setSession:React.Dispatch<React.SetStateAction<AuthSession|null>>}
const Context=createContext<Value|null>(null)

export function AuthProvider({children}:{children:ReactNode}){
 const[session,setSession]=useState<AuthSession|null>(null),[ready,setReady]=useState(false)
 useEffect(()=>{setSession(authService.loadSession());setReady(true)},[])
 useEffect(()=>configureApiClient({getAccessToken:()=>session?.accessToken??null,onUnauthorized:()=>setSession(null)}),[session])
 useEffect(()=>{if(!ready)return;if(session)authService.saveSession(session);else authService.clearSession()},[session,ready])
 const login=async(input:LoginInput)=>setSession((await authService.login(input)).data)
 const register=async(input:RegisterInput)=>setSession((await authService.register(input)).data)
 const logout=async()=>{await authService.logout();setSession(null)}
 const recover=async(email:string)=>{await authService.recoverPassword(email)}
 const updateProfile=async(input:UpdateProfileInput)=>{if(!session)throw new Error('No hay una sesión iniciada.');const user=(await userService.update(session.user.id,input)).data;setSession({...session,user})}
 return <Context.Provider value={{session,login,register,logout,recover,updateProfile,setSession}}>{children}</Context.Provider>
}
export function useAuth(){const value=useContext(Context);if(!value)throw new Error('useAuth debe usarse dentro de AuthProvider.');return value}
