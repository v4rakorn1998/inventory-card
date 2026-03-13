'use server'

import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'boylnwza1234')

export async function login(username: string, password: string) {
  const supabase = await createClient()

  // 1. ดึงข้อมูล
  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, password_hash, display_name')
    .eq('username', username)
    .single()

  if (error || !user) {
    return { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
  }

  // 2. เช็ค Password
  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    return { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
  }

  // 3. สร้าง Token
  const token = await new SignJWT({ 
    id: user.id, 
    username: user.username,
    display_name: user.display_name 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(JWT_SECRET)

  // 4. ฝัง Cookie
  const cookieStore = await cookies()
  cookieStore.set('session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 // 1 วัน
  })

  return { success: true }
}

export async function register(username: string, password: string, displayName: string) {
  const supabase = await createClient()

  // 1. ตรวจสอบก่อนว่า Username นี้ถูกใช้ไปหรือยัง
  const { data: existingUser } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single()

  if (existingUser) {
    return { error: 'ชื่อผู้ใช้นี้มีคนใช้ไปแล้วครับ' }
  }

  // 2. Hash รหัสผ่าน (ห้ามเก็บตัวเลขตรงๆ เด็ดขาด!)
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(password, salt)

  // 3. Insert ลงตาราง users
  const { error } = await supabase
    .from('users')
    .insert([
      { 
        username: username, 
        password_hash: passwordHash, 
        display_name: displayName 
      }
    ])

  if (error) {
    return { error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก: ' + error.message }
  }

  return { success: true }
}