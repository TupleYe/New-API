/*
Copyright (C) 2023-2026 QuantumNous
*/
import { useState, useCallback, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, Zap, Plus, Info, ExternalLink, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PublicLayout } from '@/components/layout'
import { api } from '@/lib/api'
import { SubscriptionPurchaseDialog } from '@/features/subscriptions/components/dialogs/subscription-purchase-dialog'
import type {
  TokenPlanResponse,
  TokenPlanTier,
  TokenPlanTopUp,
} from './types'
import type { PlanRecord } from '@/features/subscriptions/types'

async function getTokenPlan(): Promise<TokenPlanResponse> {
  const res = await api.get('/api/token_plan')
  return res.data?.data || res.data
}

async function getEnabledModels(): Promise<string[]> {
  const res = await api.get('/api/models_enabled')
  return res.data?.data || res.data || []
}

function tierToPlanRecord(tier: TokenPlanTier): PlanRecord {
  return {
    plan: {
      id: tier.plan_id, title: tier.name, subtitle: tier.subtitle,
      price_amount: tier.price_monthly, currency: 'CNY',
      duration_unit: 'month' as const, duration_value: 1, custom_seconds: 0,
      quota_reset_period: 'monthly' as const, quota_reset_custom_seconds: 0,
      enabled: true, sort_order: 0, max_purchase_per_user: 0,
      total_amount: tier.credits, upgrade_group: '',
      stripe_price_id: '', creem_product_id: '', waffo_pancake_product_id: '',
    },
  }
}

/* ═══════════════════════════════════════════════════
   Credits 说明弹窗
   ═══════════════════════════════════════════════════ */
function CreditsInfoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-primary' />
            {t('What are Credits?')}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4 text-sm'>
          <p className='font-semibold text-base'>{t('What are Credits?')}</p>
          <p className='text-muted-foreground leading-relaxed'>
            {t('credits_desc_1')}
          </p>
          <p className='text-muted-foreground leading-relaxed'>
            {t('credits_desc_2')}
          </p>
          <div className='rounded-md bg-muted/50 p-3'>
            <p className='text-muted-foreground'>
              {t('credits_ref')}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════
   模型列表弹窗
   ═══════════════════════════════════════════════════ */
function ModelsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { data: models = [] } = useQuery({ queryKey: ['enabled-models'], queryFn: getEnabledModels, enabled: open })
  const filtered = search ? models.filter(m => m.toLowerCase().includes(search.toLowerCase())) : models
  const grouped = filtered.reduce<Record<string, string[]>>((acc, m) => {
    const prefix = m.split(/[-_/]/)[0] || 'other'
    if (!acc[prefix]) acc[prefix] = []
    acc[prefix].push(m)
    return acc
  }, {})
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[75vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-primary' />
            {t('Supported Models')}
          </DialogTitle>
        </DialogHeader>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input placeholder={t('Search models...')} value={search} onChange={e => setSearch(e.target.value)} className='pl-9' />
        </div>
        <div className='flex-1 overflow-y-auto min-h-0 mt-2 space-y-4'>
          {Object.entries(grouped).map(([prefix, items]) => (
            <div key={prefix}>
              <p className='text-xs font-semibold text-muted-foreground uppercase mb-1.5'>{prefix}</p>
              <div className='flex flex-wrap gap-1.5'>{items.map(model => <Badge key={model} variant='secondary' className='text-xs font-mono'>{model}</Badge>)}</div>
            </div>
          ))}
          {filtered.length === 0 && <p className='text-sm text-muted-foreground text-center py-8'>{t('No models found')}</p>}
        </div>
        <div className='text-xs text-muted-foreground text-center pt-2 border-t'>
          {t('{{count}} models available', { count: models.length })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════
   套餐卡片
   ═══════════════════════════════════════════════════ */
function PlanCard({ tier, cs, onSub, logged, onVM }: {
  tier: TokenPlanTier; cs: string; onSub: (t: TokenPlanTier) => void; logged: boolean; onVM: () => void
}) {
  const { t } = useTranslation()
  return (
    <Card className={`relative flex flex-col ${tier.highlighted ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border'}`}>
      {tier.badge && <Badge className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground'>{tier.badge}</Badge>}
      <CardHeader className='text-center pb-2'>
        <CardTitle className='text-xl font-bold'>{tier.name}</CardTitle>
        <p className='text-sm text-muted-foreground'>{tier.subtitle}</p>
        <div className='mt-4'>
          <span className='text-4xl font-bold'>{cs}{tier.price_monthly}</span>
          <span className='text-muted-foreground ml-1'>{t('yuan/month')}</span>
          {tier.price_original > tier.price_monthly && (
            <>
              <span className='ml-2 text-sm text-muted-foreground line-through'>{cs}{tier.price_original}</span>
              <span className='ml-1 text-xs text-primary font-medium'>{t('Limited-time offer')}</span>
            </>
          )}
        </div>
        <Badge variant='outline' className='mt-2 mx-auto'>{tier.credits_label}</Badge>
        <p className='text-xs text-muted-foreground mt-1'>{tier.calls_estimate}</p>
      </CardHeader>
      <CardContent className='flex-1 flex flex-col'>
        <ul className='space-y-3 flex-1'>
          {tier.features.map((f, i) => <li key={i} className='flex items-start gap-2'><Check className='h-4 w-4 text-primary mt-0.5 shrink-0' /><span className='text-sm'>{f}</span></li>)}
        </ul>
        <button onClick={onVM} className='mt-4 flex items-center justify-center gap-1 text-sm text-primary hover:underline cursor-pointer'>
          <ExternalLink className='h-3.5 w-3.5' />{t('Supported Models')}
        </button>
        <Button className='mt-3 w-full' variant={tier.highlighted ? 'default' : 'outline'} onClick={() => onSub(tier)} disabled={!logged}>
          {tier.button_text || t('Subscribe Now')}
        </Button>
      </CardContent>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════
   加油包卡片
   ═══════════════════════════════════════════════════ */
function TopUpCard({ tu, cs, onBuy, logged, onVM }: {
  tu: TokenPlanTopUp; cs: string; onBuy: (t: TokenPlanTopUp) => void; logged: boolean; onVM: () => void
}) {
  const { t } = useTranslation()
  return (
    <Card className='border-border'>
      <CardHeader className='text-center pb-2'>
        <CardTitle className='text-lg font-bold flex items-center justify-center gap-2'><Plus className='h-5 w-5' />{tu.name}</CardTitle>
        <div className='mt-2'>
          <span className='text-3xl font-bold'>{cs}{tu.price}</span>
          <span className='text-muted-foreground ml-1'>{t('yuan/month')}</span>
        </div>
        <Badge variant='outline' className='mt-2 mx-auto'>{tu.credits_label}</Badge>
        <p className='text-xs text-muted-foreground mt-1'>{tu.calls_estimate}</p>
        {tu.note && <p className='text-xs text-amber-600 dark:text-amber-400 mt-1'><Info className='inline h-3 w-3 mr-1' />{tu.note}</p>}
      </CardHeader>
      <CardContent>
        <button onClick={onVM} className='mb-3 flex items-center justify-center gap-1 text-sm text-primary hover:underline cursor-pointer w-full'>
          <ExternalLink className='h-3.5 w-3.5' />{t('Supported Models')}
        </button>
        <Button className='w-full' variant='outline' onClick={() => onBuy(tu)} disabled={!logged}>
          {tu.button_text || t('Subscribe Now')}
        </Button>
      </CardContent>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════
   骨架屏
   ═══════════════════════════════════════════════════ */
function TokenPlanSkeleton() {
  return (
    <PublicLayout showMainContainer={false}>
      <div className='container mx-auto py-12 px-4 pt-24'>
        <div className='text-center mb-12'>
          <Skeleton className='h-10 w-64 mx-auto mb-4' />
          <Skeleton className='h-6 w-96 mx-auto' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto'>
          {[1, 2, 3].map(i => <div key={i} className='border rounded-lg p-6 space-y-4'><Skeleton className='h-8 w-32' /><Skeleton className='h-12 w-48' /><Skeleton className='h-4 w-full' /><Skeleton className='h-10 w-full' /></div>)}
        </div>
      </div>
    </PublicLayout>
  )
}

/* ═══════════════════════════════════════════════════
   主页面
   ═══════════════════════════════════════════════════ */
export function TokenPlan() {
  const { t } = useTranslation()
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [modelsOpen, setModelsOpen] = useState(false)
  const [creditsInfoOpen, setCreditsInfoOpen] = useState(false)

  useEffect(() => { api.get('/api/user/self', { skipErrorHandler: true } as any).then(() => setIsLoggedIn(true)).catch(() => setIsLoggedIn(false)) }, [])

  const { data, isLoading, error } = useQuery({ queryKey: ['token-plan'], queryFn: getTokenPlan })
  const { data: topupInfo } = useQuery({
    queryKey: ['topup-info'], queryFn: async () => { try { const r = await api.get('/api/user/topup/info', { skipErrorHandler: true } as any); return r.data?.data || r.data } catch { return null } }, enabled: isLoggedIn,
    retry: false,
  })
  const { data: selfData } = useQuery({
    queryKey: ['user-self'], queryFn: async () => { const r = await api.get('/api/user/self', { skipErrorHandler: true } as any); return r.data?.data || r.data }, enabled: isLoggedIn,
    retry: false,
  })

  const handleSub = useCallback((tier: TokenPlanTier) => {
    if (!isLoggedIn) { toast.error(t('Please log in first')); return }
    setSelectedPlan(tierToPlanRecord(tier)); setPurchaseOpen(true)
  }, [isLoggedIn, t])

  const handleBuy = useCallback((tu: TokenPlanTopUp) => {
    if (!isLoggedIn) { toast.error(t('Please log in first')); return }
    setSelectedPlan({
      plan: { id: tu.plan_id, title: tu.name, subtitle: '', price_amount: tu.price, currency: 'CNY', duration_unit: 'month' as const, duration_value: 1, custom_seconds: 0, quota_reset_period: 'never' as const, quota_reset_custom_seconds: 0, enabled: true, sort_order: 0, max_purchase_per_user: 0, total_amount: tu.credits, upgrade_group: '', stripe_price_id: '', creem_product_id: '', waffo_pancake_product_id: '' }
    }); setPurchaseOpen(true)
  }, [isLoggedIn, t])

  const handleOk = useCallback(() => { setPurchaseOpen(false); toast.success(t('Subscription purchased successfully')) }, [t])

  if (isLoading) return <TokenPlanSkeleton />
  if (error || !data) return <PublicLayout showMainContainer={false}><div className='container mx-auto py-12 px-4 pt-24 text-center'><p className='text-destructive'>{t('Failed to load Token Plan data')}</p></div></PublicLayout>

  const resp: TokenPlanResponse = data
  const uq = selfData?.quota || 0
  const eS = !!topupInfo?.enable_stripe_topup
  const eC = !!topupInfo?.enable_creem_topup
  const eW = !!topupInfo?.enable_waffo_pancake_topup
  const eO = !!topupInfo?.enable_online_topup
  const epay = (topupInfo?.pay_methods || []).filter((m: { type: string }) => m.type !== 'stripe' && m.type !== 'creem')

  return (
    <PublicLayout showMainContainer={false}>
      <div className='min-h-screen bg-background pt-16'>
        {/* ── Hero ── */}
        <section className='border-b bg-gradient-to-b from-muted/40 to-background'>
          <div className='container mx-auto py-14 px-4 text-center'>
            <div className='flex items-center justify-center gap-2 mb-3'>
              <Zap className='h-8 w-8 text-primary' />
              <h1 className='text-4xl font-bold tracking-tight'>Token Plan</h1>
            </div>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
              {t('hero_subtitle')}
            </p>
            <button onClick={() => setCreditsInfoOpen(true)} className='mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer'>
              <Info className='h-3.5 w-3.5' />{t('What are Credits?')}
            </button>
          </div>
        </section>

        {/* ── 套餐 3列并列 ── */}
        <section className='container mx-auto py-10 px-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto'>
            {resp.tiers.map((tier) => (
              <PlanCard key={tier.id} tier={tier} cs={resp.currency_symbol} onSub={handleSub} logged={isLoggedIn} onVM={() => setModelsOpen(true)} />
            ))}
            {resp.top_ups?.map((tu) => (
              <TopUpCard key={tu.id} tu={tu} cs={resp.currency_symbol} onBuy={handleBuy} logged={isLoggedIn} onVM={() => setModelsOpen(true)} />
            ))}
          </div>
        </section>

        {/* ── 权益与规则说明 ── */}
        {resp.rules_sections && resp.rules_sections.length > 0 && (
          <section className='border-t bg-muted/20'>
            <div className='container mx-auto py-10 px-4 max-w-3xl space-y-5'>
              <h2 className='text-2xl font-bold text-center'>
                {resp.rules_title || t('Terms & Rules')}
              </h2>
              {resp.rules_sections.map((sec, i) => (
                <div key={i} className='rounded-lg border bg-card p-6'>
                  <h3 className='text-lg font-bold mb-3'>{sec.title}</h3>
                  <ol className='space-y-2 list-decimal list-inside'>
                    {sec.content.map((c, j) => <li key={j} className='text-sm text-muted-foreground'>{c}</li>)}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 弹窗 ── */}
        <CreditsInfoDialog open={creditsInfoOpen} onOpenChange={setCreditsInfoOpen} />
        <ModelsDialog open={modelsOpen} onOpenChange={setModelsOpen} />
        <SubscriptionPurchaseDialog
          open={purchaseOpen} onOpenChange={setPurchaseOpen}
          plan={selectedPlan} enableStripe={eS} enableCreem={eC} enableWaffoPancake={eW}
          enableOnlineTopUp={eO} epayMethods={epay} userQuota={uq} onPurchaseSuccess={handleOk}
        />
      </div>
    </PublicLayout>
  )
}
