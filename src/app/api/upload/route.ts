import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { validateUploadedFile, getSafeFilePath } from '@/lib/file-validation'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    }

    // Validate file type and size
    const validation = await validateUploadedFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Generate safe file path
    const safeFilePath = getSafeFilePath(user.id, file.name)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('outing-photos')
      .upload(safeFilePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('outing-photos')
      .getPublicUrl(safeFilePath)

    return NextResponse.json({ url: publicUrl, path: safeFilePath })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
