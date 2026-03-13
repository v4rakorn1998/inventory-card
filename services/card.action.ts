'use server'

import { createClient } from '@/lib/supabase/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { revalidatePath } from 'next/cache'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'boylnwza1234')

// --- 1. เพิ่มการ์ดใหม่ ---
export async function addCard(formData: FormData) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    
    if (!token) return { error: 'กรุณาเข้าสู่ระบบ' }
    
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.id

    // จัดการไฟล์รูปภาพ
    const file = formData.get('image') as File
    let imagePath = null

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`
      const uploadDir = path.join(process.cwd(), 'public/uploads')
      await mkdir(uploadDir, { recursive: true })
      const savePath = path.join(uploadDir, fileName)
      await writeFile(savePath, buffer)
      imagePath = `/uploads/${fileName}`
    }

    const cardCode = `CRD-${Math.floor(100000 + Math.random() * 900000)}`
    const buyPrice = Number(formData.get('buy_price'))
    const shippingCost = Number(formData.get('shipping_cost') || 0)
    const sellPriceRaw = formData.get('sell_price')
    const sellPrice = sellPriceRaw ? Number(sellPriceRaw) : null
    const buyDate = formData.get('buy_date') as string
    const sellDate = formData.get('sell_date') || null

    const supabase = await createClient()
    const { error } = await supabase
      .from('cards')
      .insert([
        {
          user_id: userId,
          card_code: cardCode,
          image_path: imagePath,
          box_case: formData.get('box_case') as string,
          card_no: formData.get('card_no') as string,
          card_type: formData.get('card_type') as string,
          buy_price: buyPrice,
          shipping_cost: shippingCost,
          sell_price: sellPrice,
          buy_date: buyDate,
          sell_date: sellDate,
        }
      ])

    if (error) throw error

    revalidatePath('/card-album')
    return { success: true }
  } catch (err: any) {
    console.error('Add Card Error:', err)
    return { error: 'เกิดข้อผิดพลาดของระบบ: ' + err.message }
  }
}

// --- 2. ดึงข้อมูลการ์ดตาม ID (ปรับให้เช็คสิทธิ์ userId ด้วย) ---
export async function getCardById(id: number) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    if (!token) return { error: 'กรุณาเข้าสู่ระบบ' }
    
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.id

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // ต้องเป็นเจ้าของเท่านั้นถึงจะดูได้
      .single()
      
    if (error) throw error
    return { data }
  } catch (err: any) {
    return { error: 'ไม่พบข้อมูลการ์ด' }
  }
}

// --- 3. อัปเดตข้อมูลการ์ด (ปรับให้รับแค่ formData เพื่อให้ตรงกับหน้า UI) ---
export async function updateCard(formData: FormData) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    if (!token) return { error: 'กรุณาเข้าสู่ระบบ' }
    
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.id

    const id = formData.get('id') // ดึง ID จาก formData ที่ส่งมาจากหน้า Edit
    if (!id) return { error: 'ไม่พบรหัสการ์ด' }

    const supabase = await createClient()

    // 1. ตรวจสอบสิทธิ์และดึงข้อมูลเดิม
    const { data: card } = await supabase
      .from('cards')
      .select('user_id, image_path')
      .eq('id', id)
      .single()

    if (!card || card.user_id !== userId) {
      return { error: 'คุณไม่มีสิทธิ์แก้ไขการ์ดใบนี้' }
    }

    // 2. จัดการไฟล์รูปภาพ (ถ้ามีใหม่ให้บันทึกใหม่ ถ้าไม่มีใช้ของเดิม)
    let imagePath = card.image_path
    const file = formData.get('image') as File
    
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`
      const uploadDir = path.join(process.cwd(), 'public/uploads')
      await mkdir(uploadDir, { recursive: true })
      const savePath = path.join(uploadDir, fileName)
      await writeFile(savePath, buffer)
      imagePath = `/uploads/${fileName}`
    }

    // 3. เตรียมข้อมูล
    const sellPriceRaw = formData.get('sell_price')
    const sellDateRaw = formData.get('sell_date')

    const updateValues = {
      image_path: imagePath,
      box_case: formData.get('box_case') as string,
      card_no: formData.get('card_no') as string,
      card_type: formData.get('card_type') as string,
      buy_price: Number(formData.get('buy_price')),
      shipping_cost: Number(formData.get('shipping_cost') || 0),
      sell_price: sellPriceRaw ? Number(sellPriceRaw) : null,
      buy_date: formData.get('buy_date') as string,
      sell_date: sellDateRaw || null,
    }

    // 4. บันทึกการอัปเดต
    const { error } = await supabase
      .from('cards')
      .update(updateValues)
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    
    revalidatePath('/card-album')
    return { success: true }
  } catch (err: any) {
    console.error('Update Card Error:', err)
    return { error: 'อัปเดตล้มเหลว: ' + err.message }
  }
}

// --- 4. ลบการ์ด ---
export async function deleteCard(id: number) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    if (!token) return { error: 'กรุณาเข้าสู่ระบบ' }
    
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.id

    const supabase = await createClient()

    // เช็คสิทธิ์ก่อนลบ
    const { data: card } = await supabase.from('cards').select('user_id').eq('id', id).single()
    if (!card || card.user_id !== userId) {
      return { error: 'คุณไม่มีสิทธิ์ลบการ์ดใบนี้' }
    }

    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/card-album')
    return { success: true }
  } catch (err: any) {
    console.error('Delete Card Error:', err)
    return { error: 'ไม่สามารถลบข้อมูลได้' }
  }
}