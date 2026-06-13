import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { 
  RefreshCw, MessageSquare, UserPlus, CheckCircle, XCircle, Search
} from 'lucide-react'
import { toast } from 'sonner'
import { 
  getAdminTickets, getTicketDetail, assignTicket, completeTicket, adminCloseTicket,
  replyTicket,
  type Ticket, type TicketReply
} from './api-admin'

export default function AdminTicketPage() {
  const { t } = useTranslation()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [replies, setReplies] = useState<TicketReply[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [assignUserId, setAssignUserId] = useState(0)
  const [closeRemark, setCloseRemark] = useState('')

  const statusLabels: Record<number, string> = {
    0: t('Pending'),
    1: t('In Progress'),
    2: t('Completed'),
    3: t('Closed'),
    4: t('Rejected'),
  }
  const statusVariants: Record<number, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    0: 'secondary',
    1: 'outline',
    2: 'default',
    3: 'destructive',
    4: 'destructive',
  }
  const priorityLabels: Record<number, string> = {
    1: t('Low'),
    2: t('Medium'),
    3: t('High'),
    4: t('Urgent'),
  }
  const priorityVariants: Record<number, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    1: 'outline',
    2: 'secondary',
    3: 'default',
    4: 'destructive',
  }

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, page_size: 20 }
      if (statusFilter) params.status = statusFilter
      if (priorityFilter) params.priority = priorityFilter
      if (keyword) params.keyword = keyword

      const res = await getAdminTickets(params)
      if (res.success) {
        setTickets(res.data.items)
        setTotal(res.data.total)
      }
    } catch (error) {
      toast.error(t('Failed to load tickets'))
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, priorityFilter, keyword, t])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleViewTicket = async (ticket: Ticket) => {
    try {
      const res = await getTicketDetail(ticket.id)
      if (res.success) {
        setSelectedTicket(res.data.ticket)
        setReplies(res.data.replies)
      }
    } catch (error) {
      console.error('Failed to load ticket detail:', error)
    }
  }

  const handleReply = async () => {
    if (!selectedTicket || !replyContent) return
    try {
      await replyTicket(selectedTicket.id, { content: replyContent })
      setReplyContent('')
      const res = await getTicketDetail(selectedTicket.id)
      if (res.success) {
        setReplies(res.data.replies)
        setSelectedTicket(res.data.ticket)
      }
    } catch (error) {
      console.error('Failed to reply:', error)
    }
  }

  const handleAssign = async () => {
    if (!selectedTicket || !assignUserId) return
    try {
      await assignTicket(selectedTicket.id, assignUserId)
      toast.success(t('Ticket assigned successfully'))
      setSelectedTicket(null)
      loadTickets()
    } catch (error) {
      toast.error(t('Failed to assign ticket'))
    }
  }

  const handleComplete = async () => {
    if (!selectedTicket) return
    try {
      await completeTicket(selectedTicket.id)
      toast.success(t('Ticket completed successfully'))
      setSelectedTicket(null)
      loadTickets()
    } catch (error) {
      toast.error(t('Failed to complete ticket'))
    }
  }

  const handleAdminClose = async () => {
    if (!selectedTicket) return
    try {
      await adminCloseTicket(selectedTicket.id, closeRemark)
      toast.success(t('Ticket closed successfully'))
      setSelectedTicket(null)
      setCloseRemark('')
      loadTickets()
    } catch (error) {
      toast.error(t('Failed to close ticket'))
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('Ticket Management')}</h1>
        <Button variant="outline" onClick={loadTickets}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('Refresh')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('Filter by status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Status')}</SelectItem>
                <SelectItem value="0">{t('Pending')}</SelectItem>
                <SelectItem value="1">{t('In Progress')}</SelectItem>
                <SelectItem value="2">{t('Completed')}</SelectItem>
                <SelectItem value="3">{t('Closed')}</SelectItem>
                <SelectItem value="4">{t('Rejected')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t('Filter by priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All')}</SelectItem>
                <SelectItem value="1">{t('Low')}</SelectItem>
                <SelectItem value="2">{t('Medium')}</SelectItem>
                <SelectItem value="3">{t('High')}</SelectItem>
                <SelectItem value="4">{t('Urgent')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search tickets...')}
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (setPage(1), loadTickets())}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket List */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Ticket No')}</TableHead>
                <TableHead>{t('Title')}</TableHead>
                <TableHead>{t('Category')}</TableHead>
                <TableHead>{t('Priority')}</TableHead>
                <TableHead>{t('Status')}</TableHead>
                <TableHead>{t('Assigned To')}</TableHead>
                <TableHead>{t('Created At')}</TableHead>
                <TableHead>{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    {t('No tickets')}
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">{ticket.ticket_no}</TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityVariants[ticket.priority] || 'secondary'}>
                        {priorityLabels[ticket.priority] || t('Low')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[ticket.status] || 'secondary'}>
                        {statusLabels[ticket.status] || t('Unknown')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ticket.assigned_to > 0 ? `#${ticket.assigned_to}` : '-'}
                    </TableCell>
                    <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewTicket(ticket)}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                {t('Total')}: {total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  {t('Previous')}
                </Button>
                <span className="flex items-center text-sm">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  {t('Next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[800px] max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t('Ticket Details')}</CardTitle>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div>{t('Ticket No')}: {selectedTicket.ticket_no}</div>
                  <div>{t('Status')}: <Badge variant={statusVariants[selectedTicket.status]}>{statusLabels[selectedTicket.status]}</Badge></div>
                  <div>{t('Priority')}: <Badge variant={priorityVariants[selectedTicket.priority]}>{priorityLabels[selectedTicket.priority]}</Badge></div>
                  <div>{t('Assigned To')}: {selectedTicket.assigned_to > 0 ? `#${selectedTicket.assigned_to}` : '-'}</div>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedTicket(null)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">{selectedTicket.title}</h3>
              
              {/* Original Content */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{selectedTicket.content}</p>
              </div>
              
              {/* Replies */}
              {replies.length > 0 && (
                <div className="space-y-3">
                  {replies.map((reply) => (
                    <div 
                      key={reply.id} 
                      className={`p-3 rounded-lg ${reply.is_staff ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={reply.is_staff ? 'default' : 'secondary'}>
                          {reply.is_staff ? t('Staff') : `#${reply.user_id}`}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Reply Input */}
              {selectedTicket.status !== 3 && selectedTicket.status !== 2 && (
                <div className="flex gap-2">
                  <Textarea 
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={t('Enter reply content...')}
                    rows={2}
                  />
                  <Button onClick={handleReply}>{t('Send')}</Button>
                </div>
              )}
              
              {/* Admin Actions */}
              {selectedTicket.status !== 3 && selectedTicket.status !== 2 && (
                <div className="flex gap-2 pt-4 border-t flex-wrap">
                  {/* Assign */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder={t('User ID')}
                      className="w-24"
                      value={assignUserId || ''}
                      onChange={(e) => setAssignUserId(parseInt(e.target.value) || 0)}
                    />
                    <Button variant="outline" size="sm" onClick={handleAssign}>
                      <UserPlus className="mr-1 h-4 w-4" />
                      {t('Assign')}
                    </Button>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={handleComplete}>
                    <CheckCircle className="mr-1 h-4 w-4" />
                    {t('Complete')}
                  </Button>
                  
                  {/* Close */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={t('Remark')}
                      className="w-32"
                      value={closeRemark}
                      onChange={(e) => setCloseRemark(e.target.value)}
                    />
                    <Button variant="outline" size="sm" onClick={handleAdminClose}>
                      <XCircle className="mr-1 h-4 w-4" />
                      {t('Admin Close')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
