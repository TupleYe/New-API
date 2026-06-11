import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { 
  DollarSign, Users, TrendingUp, Gift, Wallet, 
  ArrowUpRight, ArrowDownRight, Plus, RefreshCw
} from 'lucide-react'
import { 
  getAgentInfo, getAgentStats, getAgentCommissions, 
  getAgentWithdrawals, applyForAgent, requestWithdrawal,
  type Agent, type AgentStats, type AgentCommission, type AgentWithdrawal
} from './api'

const statusMap: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  0: { label: '待审核', variant: 'secondary' },
  1: { label: '处理中', variant: 'outline' },
  2: { label: '已完成', variant: 'default' },
  3: { label: '已拒绝', variant: 'destructive' },
}

export default function AgentPage() {
  const { t } = useTranslation()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [commissions, setCommissions] = useState<AgentCommission[]>([])
  const [withdrawals, setWithdrawals] = useState<AgentWithdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'withdrawals'>('overview')
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [infoRes, statsRes, commRes, withRes] = await Promise.all([
        getAgentInfo(),
        getAgentStats(),
        getAgentCommissions({ page: 1, page_size: 10 }),
        getAgentWithdrawals({ page: 1, page_size: 10 })
      ])
      
      if (infoRes.success) setAgent(infoRes.data)
      if (statsRes.success) setStats(statsRes.data)
      if (commRes.success) setCommissions(commRes.data.items)
      if (withRes.success) setWithdrawals(withRes.data.items)
    } catch (error) {
      console.error('Failed to load agent data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApply = async () => {
    try {
      const res = await applyForAgent()
      if (res.success) {
        setAgent(res.data)
      }
    } catch (error) {
      console.error('Failed to apply:', error)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount <= 0) return
    
    try {
      await requestWithdrawal({
        amount,
        method: 'alipay',
        account: 'your-account'
      })
      setShowWithdrawDialog(false)
      setWithdrawAmount('')
      loadData()
    } catch (error) {
      console.error('Failed to withdraw:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>申请成为代理</CardTitle>
            <CardDescription>
              成为代理后，您可以通过邀请用户获得佣金分成
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleApply} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              立即申请
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">代理中心</h1>
        <Badge variant="outline">
          等级: {agent.agent_level} | 佣金比例: {(agent.commission_rate * 100).toFixed(0)}%
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">累计佣金</p>
                <p className="text-2xl font-bold">¥{stats?.total_commission?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Wallet className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">待结算</p>
                <p className="text-2xl font-bold">¥{stats?.pending_commission?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已提现</p>
                <p className="text-2xl font-bold">¥{stats?.withdrawn_amount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">邀请用户</p>
                <p className="text-2xl font-bold">{stats?.invited_users || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => setShowWithdrawDialog(true)}>
          <ArrowUpRight className="mr-2 h-4 w-4" />
          申请提现
        </Button>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button 
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
        >
          概览
        </Button>
        <Button 
          variant={activeTab === 'commissions' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('commissions')}
        >
          佣金记录
        </Button>
        <Button 
          variant={activeTab === 'withdrawals' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('withdrawals')}
        >
          提现记录
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'commissions' && (
        <Card>
          <CardHeader>
            <CardTitle>佣金记录</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>订单金额</TableHead>
                  <TableHead>佣金</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      暂无记录
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((comm) => (
                    <TableRow key={comm.id}>
                      <TableCell>{new Date(comm.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>¥{comm.order_amount.toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">+¥{comm.commission.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={comm.status === 1 ? 'default' : 'secondary'}>
                          {comm.status === 1 ? '已结算' : '待结算'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'withdrawals' && (
        <Card>
          <CardHeader>
            <CardTitle>提现记录</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>时间</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>手续费</TableHead>
                  <TableHead>实际到账</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      暂无记录
                    </TableCell>
                  </TableRow>
                ) : (
                  withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>{new Date(w.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>¥{w.amount.toFixed(2)}</TableCell>
                      <TableCell>¥{w.fee.toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">¥{w.actual_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={statusMap[w.status]?.variant || 'secondary'}>
                          {statusMap[w.status]?.label || '未知'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>邀请链接</CardTitle>
            <CardDescription>分享您的邀请链接，用户通过该链接注册后您将获得佣金</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <code className="text-sm break-all">
                {agent.invite_url || `https://yourdomain.com/register?code=${agent.invite_code}`}
              </code>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Withdraw Dialog */}
      {showWithdrawDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>申请提现</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">提现金额</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="请输入金额"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  可提现余额: ¥{((stats?.total_commission || 0) - (stats?.withdrawn_amount || 0)).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleWithdraw}>确认提现</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
