import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '../lib/supabase'
import { getCurrentUser } from './auth'
import z from 'zod'

const createBookSchema = z.object({
    name: z.string().min(1, 'Name is required'),
})

export const createBookFn = createServerFn({ method: 'POST' })
    .inputValidator(createBookSchema)
    .handler(async ({ data }) => {
        const { name } = data
        const user = await getCurrentUser()
        if (!user) {
            throw new Error('Not authenticated')
        }

        const supabase = createSupabaseServerClient()

        const { data: folder, error } = await supabase
            .from('folders')
            .insert({
                name,
                user_id: user.id
            })
            .select()
            .single()

        if (error) {
            throw {
                message: error.message,
                status: parseInt(error.code) || 500
            }
        }

        return folder
    })

export const getFoldersFn = createServerFn({ method: 'GET' })
    .handler(async () => {
        const user = await getCurrentUser()
        if (!user) {
            return []
        }

        const supabase = createSupabaseServerClient()
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching folders:', error)
            return []
        }

        return data
    })
