import { createFileRoute } from '@tanstack/react-router'
import Ticket from '@/features/ticket'

export const Route = createFileRoute('/_authenticated/ticket/')({
  component: Ticket,
})
