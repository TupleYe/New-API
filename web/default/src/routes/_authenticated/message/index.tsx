import { createFileRoute } from '@tanstack/react-router'
import Message from '@/features/message'

export const Route = createFileRoute('/_authenticated/message/')({
  component: Message,
})
