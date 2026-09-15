'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const lookupSchema = z.object({
  invoiceId: z.string().trim().min(1, '인보이스 ID를 입력해 주세요'),
})

type LookupFormData = z.infer<typeof lookupSchema>

export function InvoiceLookupForm() {
  const router = useRouter()
  const form = useForm<LookupFormData>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { invoiceId: '' },
  })

  function onSubmit(data: LookupFormData): void {
    router.push(`/invoice/${encodeURIComponent(data.invoiceId)}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="invoiceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>인보이스 ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="예: 2f1a9c4b-1234-5678-90ab-cdef12345678"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          견적서 조회
        </Button>
      </form>
    </Form>
  )
}
