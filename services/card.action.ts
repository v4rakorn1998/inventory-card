'use server'

import { createClient } from '@/lib/supabase/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { revalidatePath } from 'next/cache'
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'boylnwza1234')

export async function addCard(formData: FormData) {
  try {
    // 1. เช็ค User จาก Token
    const cookieStore = await cookies()
    const token = cookieStore.get('session_token')?.value
    
    if (!token) return { error: 'กรุณาเข้าสู่ระบบ' }
    
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const userId = payload.id

    // 2. จัดการไฟล์รูปภาพ
    const file = formData.get('image') as File
    let imagePath = null

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // ตั้งชื่อไฟล์ใหม่กันซ้ำ
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`
      
      // สร้างโฟลเดอร์ uploads ถ้ายังไม่มี
      const uploadDir = path.join(process.cwd(), 'public/uploads')
      await mkdir(uploadDir, { recursive: true })
      
      // กำหนด Path ที่จะเซฟ
      const savePath = path.join(uploadDir, fileName)
      
      // บันทึกไฟล์ลงโปรเจค
      await writeFile(savePath, buffer)
      
      // Path สำหรับเก็บลง DB (เพื่อให้เรียกดูผ่านเว็บได้)
      imagePath = `/uploads/${fileName}`
    }

    // 3. Gen Card Code แบบสุ่ม (CRD-ตามด้วยเลข 6 หลัก)
    const cardCode = `CRD-${Math.floor(100000 + Math.random() * 900000)}`

    // 4. ดึงข้อมูลตัวเลขและวันที่
    const buyPrice = Number(formData.get('buy_price'))
    
    // ✅ ดึงค่าขนส่ง ถ้าไม่ได้กรอกมาให้มีค่าเป็น 0
    const shippingCostRaw = formData.get('shipping_cost')
    const shippingCost = shippingCostRaw ? Number(shippingCostRaw) : 0

    const sellPriceRaw = formData.get('sell_price')
    const sellPrice = sellPriceRaw ? Number(sellPriceRaw) : null
    
    const buyDate = formData.get('buy_date') as string
    const sellDateRaw = formData.get('sell_date') as string
    const sellDate = sellDateRaw ? sellDateRaw : null

    // 5. บันทึกข้อมูลลง Supabase
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
          shipping_cost: shippingCost, // ✅ บันทึกค่าขนส่งลง Database
          sell_price: sellPrice,
          buy_date: buyDate,
          sell_date: sellDate,
        }
      ])

    if (error) {
      console.error('Supabase Insert Error:', error)
      return { error: 'ไม่สามารถบันทึกข้อมูลได้: ' + error.message }
    }
    
    revalidatePath('/card-album')
    return { success: true }
  } catch (err: any) {
    console.error('Add Card Error:', err)
    return { error: 'เกิดข้อผิดพลาดของระบบ: ' + err.message }
  }
}