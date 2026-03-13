'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { revalidatePath } from 'next/cache'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'boylnwza1234')

/**
 * --- Helper: ดึงข้อมูล User จาก Token ---
 */
async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session_token')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { id: string }
  } catch {
    return null
  }
}

/**
 * --- Helper: อัปโหลดไฟล์ไปที่ Supabase Storage ---
 */
async function uploadToSupabase(file: File, userId: string) {
  if (!file || file.size === 0) return null;

  const supabase = await createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  // โครงสร้าง Path: userId/filename เพื่อให้ตรงกับ RLS Policy
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('card_images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Storage Upload Error:', error);
    // ถ้าติด 403 ตรงนี้ ให้ไปเช็ค Policy ใน Supabase อีกครั้ง
    throw new Error(`Upload failed: ${error.message}`);
  }

  // ดึง Public URL มาเก็บในฐานข้อมูล
  const { data: { publicUrl } } = supabase.storage
    .from('card_images')
    .getPublicUrl(filePath);

  return publicUrl;
}

/**
 * --- 1. เพิ่มการ์ดใหม่ ---
 */
export async function addCard(formData: FormData) {
  try {
    const user = await getAuthUser()
    if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

    const file = formData.get('image') as File
    const imagePath = await uploadToSupabase(file, user.id);

    const cardCode = `CRD-${Math.floor(100000 + Math.random() * 900000)}`
    
    const supabase = await createClient()
    const { error } = await supabase
      .from('cards')
      .insert([{
          user_id: user.id,
          card_code: cardCode,
          image_path: imagePath,
          box_case: formData.get('box_case') as string,
          card_no: formData.get('card_no') as string,
          card_type: formData.get('card_type') as string,
          buy_price: Number(formData.get('buy_price')),
          shipping_cost: Number(formData.get('shipping_cost') || 0),
          sell_price: formData.get('sell_price') ? Number(formData.get('sell_price')) : null,
          buy_date: formData.get('buy_date') as string,
          sell_date: formData.get('sell_date') || null,
      }])

    if (error) throw error
    revalidatePath('/card-album')
    return { success: true }
  } catch (err: any) {
    console.error('Add Card Error:', err)
    return { error: err.message || 'เพิ่มข้อมูลไม่สำเร็จ' }
  }
}

/**
 * --- 2. ดึงข้อมูลการ์ดตาม ID ---
 */
export async function getCardById(id: number) {
  try {
    const user = await getAuthUser()
    if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
      
    if (error) throw error
    return { data }
  } catch (err: any) {
    return { error: 'ไม่พบข้อมูลการ์ด' }
  }
}

/**
 * --- 3. อัปเดตข้อมูลการ์ด ---
 */
export async function updateCard(formData: FormData) {
  try {
    const user = await getAuthUser()
    if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

    const id = formData.get('id')
    if (!id) return { error: 'ไม่พบรหัสการ์ด' }

    const supabase = await createClient()

    // เช็คสิทธิ์ก่อนแก้ไข
    const { data: card } = await supabase
      .from('cards')
      .select('user_id, image_path')
      .eq('id', id)
      .single()

    if (!card || String(card.user_id) !== String(user.id)) {
      return { error: 'คุณไม่มีสิทธิ์แก้ไขการ์ดใบนี้' }
    }

    let imagePath = card.image_path
    const file = formData.get('image') as File
    if (file && file.size > 0) {
      imagePath = await uploadToSupabase(file, user.id);
    }

    const { error: updateError } = await supabase
      .from('cards')
      .update({
        image_path: imagePath,
        box_case: formData.get('box_case') as string,
        card_no: formData.get('card_no') as string,
        card_type: formData.get('card_type') as string,
        buy_price: Number(formData.get('buy_price')),
        shipping_cost: Number(formData.get('shipping_cost') || 0),
        sell_price: formData.get('sell_price') ? Number(formData.get('sell_price')) : null,
        buy_date: formData.get('buy_date') as string,
        sell_date: formData.get('sell_date') || null,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (updateError) throw updateError
    
    revalidatePath('/card-album')
    return { success: true }
  } catch (err: any) {
    console.error('Update Error:', err)
    return { error: err.message || 'อัปเดตล้มเหลว' }
  }
}

/**
 * --- 4. ลบการ์ด ---
 */
export async function deleteCard(id: number) {
  try {
    const user = await getAuthUser()
    if (!user) return { error: 'กรุณาเข้าสู่ระบบ' }

    const supabase = await createClient()

    // ดึงข้อมูลเพื่อหา path รูปภาพ
    const { data: card } = await supabase
      .from('cards')
      .select('user_id, image_path')
      .eq('id', id)
      .single()

    if (!card || String(card.user_id) !== String(user.id)) {
      return { error: 'ไม่มีสิทธิ์ลบข้อมูลนี้' }
    }

    // ลบรูปภาพใน Storage (ถ้ามี)
    if (card.image_path) {
      const pathParts = card.image_path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const storagePath = `${user.id}/${fileName}`;
      
      await supabase.storage.from('card_images').remove([storagePath]);
    }

    // ลบข้อมูลจาก Database
    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    revalidatePath('/card-album')
    return { success: true }
  } catch (err: any) {
    console.error('Delete Error:', err)
    return { error: 'ลบข้อมูลไม่สำเร็จ' }
  }
}