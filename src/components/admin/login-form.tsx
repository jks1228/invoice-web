'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
import { loginAction } from '@/lib/auth/actions'
import { loginSchema, type LoginFormData } from '@/lib/auth/schema'

export function LoginForm() {
  const router = useRouter()
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: '' },
  })

  async function onSubmit(data: LoginFormData): Promise<void> {
    const result = await loginAction(data)

    if (result.ok) {
      router.push('/admin')
      router.refresh()
      return
    }

    const message =
      result.reason === 'rate_limited'
        ? `너무 많이 시도했습니다. ${result.retryAfterSeconds}초 후 다시 시도해 주세요.`
        : '비밀번호가 올바르지 않습니다.'
    form.setError('password', { message })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input type="password" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          로그인
        </Button>
      </form>
    </Form>
  )
}
