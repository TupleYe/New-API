import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
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
  Ticket, Plus, RefreshCw, MessageSquare, Star, X, Send
} from 'lucide-react'
import { 
  getMyTickets, getTicketDetail, createTicket, replyTicket, 
  rateTicket, closeTicket, getTicketCategories,
  type Ticket as TicketType, type TicketReply, type TicketCategory
} from './api'

export default function TicketPage() {
  const { t } = useTranslation()
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [categories, setCategories] = useState<TicketCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null)
  const [replies, setReplies] = useState<TicketReply[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [showRateDialog, setShowRateDialog] = useState(false)
  const [rateScore, setRateScore] = useState(5)
  const [rateNote, setRateNote] = useState('')
  
  const [newTicket, setNewTicket] = useState({
    category: '',
    title: '',
    content: '',
    priority: 1
  })

  // i18n: status labels
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
  // i18n: priority labels
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

  const loadData = async () => {
    setLoading(true)
    try {
      const [ticketsRes, categoriesRes] = await Promise.all([
        getMyTickets({ page: 1, page_size: 20 }),
        getTicketCategories()
      ])
      
      if (ticketsRes.success) setTickets(ticketsRes.data.items)
      if (categoriesRes.success) setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Failed to load tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateTicket = async () => {
    if (!newTicket.category || !newTicket.title || !newTicket.content) return
    
    try {
      await createTicket(newTicket)
      setShowCreateDialog(false)
      setNewTicket({ category: '', title: '', content: '', priority: 1 })
      loadData()
    } catch (error) {
      console.error('Failed to create ticket:', error)
    }
  }

  const handleViewTicket = async (ticket: TicketType) => {
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
      }
    } catch (error) {
      console.error('Failed to reply:', error)
    }
  }

  const handleClose = async () => {
    if (!selectedTicket) return
    
    try {
      await closeTicket(selectedTicket.id)
      setSelectedTicket(null)
      loadData()
    } catch (error) {
      console.error('Failed to close ticket:', error)
    }
  }

  const handleRate = async () => {
    if (!selectedTicket) return
    
    try {
      await rateTicket(selectedTicket.id, { rating: rateScore, rating_note: rateNote })
      setShowRateDialog(false)
      setSelectedTicket(null)
      loadData()
    } catch (error) {
      console.error('Failed to rate:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('My Tickets')}</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Submit Ticket')}
        </Button>
      </div>

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
                <TableHead>{t('Created At')}</TableHead>
                <TableHead>{t('Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t('No tickets')}
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">{ticket.ticket_no}</TableCell>
                    <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ticket.category}
                      </Badge>
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
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px] max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{t('Submit Ticket')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('Category')} *</label>
                <Select value={newTicket.category} onValueChange={(v) => setNewTicket({...newTicket, category: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('Select category')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name || cat.name_en}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">{t('Priority')}</label>
                <Select value={String(newTicket.priority)} onValueChange={(v) => setNewTicket({...newTicket, priority: parseInt(v)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('Low')}</SelectItem>
                    <SelectItem value="2">{t('Medium')}</SelectItem>
                    <SelectItem value="3">{t('High')}</SelectItem>
                    <SelectItem value="4">{t('Urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">{t('Title')} *</label>
                <Input 
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({...newTicket, title: e.target.value})}
                  placeholder={t('Enter issue title')}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">{t('Description')} *</label>
                <Textarea 
                  value={newTicket.content}
                  onChange={(e) => setNewTicket({...newTicket, content: e.target.value})}
                  placeholder={t('Describe the issue in detail')}
                  rows={5}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{t('Cancel')}</Button>
                <Button onClick={handleCreateTicket}>{t('Submit')}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detail Dialog */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[700px] max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{selectedTicket.title}</CardTitle>
                <CardDescription className="mt-1">
                  {t('Ticket No')}: {selectedTicket.ticket_no} | 
                  {t('Status')}: <Badge variant={statusVariants[selectedTicket.status]}>{statusLabels[selectedTicket.status]}</Badge>
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedTicket(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          {reply.is_staff ? t('Staff') : t('Me')}
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
                  <Button onClick={handleReply}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedTicket.status === 2 && (
                  <Button variant="outline" onClick={() => setShowRateDialog(true)}>
                    <Star className="mr-2 h-4 w-4" />
                    {t('Rate')}
                  </Button>
                )}
                {selectedTicket.status !== 3 && selectedTicket.status !== 2 && (
                  <Button variant="outline" onClick={handleClose}>
                    {t('Close Ticket')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rate Dialog */}
      {showRateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>{t('Rate Ticket')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">{t('Rating')}</label>
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4,5].map((score) => (
                    <button
                      key={score}
                      onClick={() => setRateScore(score)}
                      className="p-1"
                    >
                      <Star 
                        className={`h-6 w-6 ${score <= rateScore ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">{t('Rating Note')}</label>
                <Textarea 
                  value={rateNote}
                  onChange={(e) => setRateNote(e.target.value)}
                  placeholder={t('Enter rating note (optional)')}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRateDialog(false)}>{t('Cancel')}</Button>
                <Button onClick={handleRate}>{t('Submit Rating')}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
