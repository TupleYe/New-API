import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { 
  Bell, Mail, CheckCheck, Trash2, ExternalLink, RefreshCw
} from 'lucide-react'
import { 
  getMyMessages, getUnreadCount, markAsRead, markAllAsRead, deleteMessage,
  type Message
} from './api'

const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  system: { label: '系统', variant: 'default' },
  notice: { label: '通知', variant: 'secondary' },
  warning: { label: '警告', variant: 'outline' },
  success: { label: '成功', variant: 'default' },
}

export default function MessagePage() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [msgsRes, unreadRes] = await Promise.all([
        getMyMessages({ page: 1, page_size: 50 }),
        getUnreadCount()
      ])
      
      if (msgsRes.success) setMessages(msgsRes.data.items)
      if (unreadRes.success) setUnreadCount(unreadRes.data.unread_count)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id)
      loadData()
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      loadData()
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteMessage(id)
      loadData()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const handleClickMessage = async (msg: Message) => {
    setSelectedMessage(msg)
    if (!msg.is_read) {
      await handleMarkAsRead(msg.id)
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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">消息中心</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} 未读</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            全部已读
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* Message List */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>类型</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>内容</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    <div className="py-8">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p>暂无消息</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((msg) => (
                  <TableRow 
                    key={msg.id} 
                    className={!msg.is_read ? 'bg-blue-50/50' : ''}
                    onClick={() => handleClickMessage(msg)}
                  >
                    <TableCell>
                      <Badge variant={typeMap[msg.type]?.variant || 'secondary'}>
                        {typeMap[msg.type]?.label || '通知'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{msg.title}</TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {msg.content}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {msg.is_read ? (
                        <span className="text-sm text-muted-foreground">已读</span>
                      ) : (
                        <Badge variant="secondary">未读</Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {msg.link && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={msg.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(msg.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[500px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  <CardTitle className="text-lg">{selectedMessage.title}</CardTitle>
                </div>
                <Badge variant={typeMap[selectedMessage.type]?.variant || 'secondary'}>
                  {typeMap[selectedMessage.type]?.label || '通知'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg mb-4">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>发送时间: {new Date(selectedMessage.created_at).toLocaleString()}</span>
                {selectedMessage.link && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={selectedMessage.link} target="_blank" rel="noopener noreferrer">
                      查看详情 <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
              </div>
              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  关闭
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
