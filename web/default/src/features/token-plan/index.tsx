/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, Zap, TrendingUp, Plus, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { PublicLayout } from '@/components/layout'
import { api } from '@/lib/api'
import type { TokenPlanResponse, TokenPlanTier, TokenPlanTopUp, RuleSection } from './types'

// API 获取 Token Plan 数据
async function getTokenPlan(): Promise<TokenPlanResponse> {
  const res = await api.get('/api/token_plan')
  return res.data?.data || res.data
}

// 套餐卡片组件
function PlanCard({
  tier,
  currencySymbol,
  t,
}: {
  tier: TokenPlanTier
  currencySymbol: string
  t: (key: string) => string
}) {
  return (
    <Card
      className={`relative flex flex-col ${
        tier.highlighted
          ? 'border-primary shadow-lg scale-[1.02]'
          : 'border-border'
      }`}
    >
      {tier.badge && (
        <Badge className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground'>
          {t(tier.badge)}
        </Badge>
      )}
      <CardHeader className='text-center pb-2'>
        <CardTitle className='text-xl font-bold'>{tier.name}</CardTitle>
        <p className='text-sm text-muted-foreground'>{t(tier.subtitle)}</p>
        <div className='mt-4'>
          <span className='text-4xl font-bold'>
            {currencySymbol}
            {tier.price_monthly}
          </span>
          <span className='text-muted-foreground ml-1'>/ {t('month')}</span>
          {tier.price_original > tier.price_monthly && (
            <span className='ml-2 text-sm text-muted-foreground line-through'>
              {currencySymbol}
              {tier.price_original}
            </span>
          )}
        </div>
        <Badge variant='outline' className='mt-2 mx-auto'>
          {tier.credits_label}
        </Badge>
        <p className='text-xs text-muted-foreground mt-1'>
          {tier.calls_estimate}
        </p>
      </CardHeader>
      <CardContent className='flex-1 flex flex-col'>
        <ul className='space-y-3 flex-1'>
          {tier.features.map((feature, i) => (
            <li key={i} className='flex items-start gap-2'>
              <Check className='h-4 w-4 text-primary mt-0.5 shrink-0' />
              <span className='text-sm'>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          className='mt-6 w-full'
          variant={tier.highlighted ? 'default' : 'outline'}
        >
          {t(tier.button_text)}
        </Button>
      </CardContent>
    </Card>
  )
}

// 加油包卡片组件
function TopUpCard({
  topUp,
  currencySymbol,
  t,
}: {
  topUp: TokenPlanTopUp
  currencySymbol: string
  t: (key: string) => string
}) {
  return (
    <Card className='border-border'>
      <CardHeader className='text-center pb-2'>
        <CardTitle className='text-lg font-bold flex items-center justify-center gap-2'>
          <Plus className='h-5 w-5' />
          {topUp.name}
        </CardTitle>
        <div className='mt-2'>
          <span className='text-3xl font-bold'>
            {currencySymbol}
            {topUp.price}
          </span>
          <span className='text-muted-foreground ml-1'>/ {t('month')}</span>
        </div>
        <Badge variant='outline' className='mt-2 mx-auto'>
          {topUp.credits_label}
        </Badge>
        <p className='text-xs text-muted-foreground mt-1'>
          {topUp.calls_estimate}
        </p>
        {topUp.note && (
          <p className='text-xs text-amber-600 dark:text-amber-400 mt-1'>
            <Info className='inline h-3 w-3 mr-1' />
            {topUp.note}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Button className='w-full' variant='outline'>
          {t(topUp.button_text)}
        </Button>
      </CardContent>
    </Card>
  )
}

// 规则说明组件
function RulesSection({
  section,
  t,
}: {
  section: RuleSection
  t: (key: string) => string
}) {
  return (
    <div>
      <h3 className='text-lg font-semibold mb-3'>{section.title}</h3>
      <ul className='space-y-2'>
        {section.content.map((item, i) => (
          <li key={i} className='flex items-start gap-2'>
            <div className='h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2 shrink-0' />
            <span className='text-sm text-muted-foreground'>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// 加载骨架屏
function TokenPlanSkeleton() {
  return (
    <PublicLayout>
      <div className='container mx-auto py-12 px-4'>
        <div className='text-center mb-12'>
          <Skeleton className='h-10 w-64 mx-auto mb-4' />
          <Skeleton className='h-6 w-96 mx-auto' />
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
          {[1, 2].map((i) => (
            <div key={i} className='border rounded-lg p-6 space-y-4'>
              <Skeleton className='h-8 w-32' />
              <Skeleton className='h-12 w-48' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-10 w-full' />
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  )
}

export function TokenPlan() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useQuery({
    queryKey: ['token-plan'],
    queryFn: getTokenPlan,
  })

  if (isLoading) {
    return <TokenPlanSkeleton />
  }

  if (error || !data) {
    return (
      <PublicLayout>
        <div className='container mx-auto py-12 px-4 text-center'>
          <p className='text-destructive'>
            {t('Failed to load Token Plan data')}
          </p>
        </div>
      </PublicLayout>
    )
  }

  const response: TokenPlanResponse = data

  return (
    <PublicLayout>
      <div className='min-h-screen bg-background'>
        {/* Hero 区域 */}
        <section className='border-b'>
          <div className='container mx-auto py-16 px-4 text-center'>
            <div className='flex items-center justify-center gap-2 mb-4'>
              <Zap className='h-8 w-8 text-primary' />
              <h1 className='text-4xl font-bold tracking-tight'>
                {t('Token Plan')}
              </h1>
            </div>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              {t(
                'Support global top models, seamless switching. Your conversations are never used for training.'
              )}
            </p>
          </div>
        </section>

        {/* 套餐区域 */}
        <section className='container mx-auto py-12 px-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
            {response.tiers.map((tier) => (
              <PlanCard
                key={tier.id}
                tier={tier}
                currencySymbol={response.currency_symbol}
                t={t}
              />
            ))}
          </div>

          {/* 加油包区域 */}
          {response.top_ups && response.top_ups.length > 0 && (
            <div className='mt-12 max-w-2xl mx-auto'>
              <div className='text-center mb-6'>
                <h2 className='text-2xl font-bold flex items-center justify-center gap-2'>
                  <TrendingUp className='h-6 w-6' />
                  {t('Top Up')}
                </h2>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {response.top_ups.map((topUp) => (
                  <TopUpCard
                    key={topUp.id}
                    topUp={topUp}
                    currencySymbol={response.currency_symbol}
                    t={t}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 规则说明区域 */}
        {response.rules_sections && response.rules_sections.length > 0 && (
          <section className='border-t bg-muted/30'>
            <div className='container mx-auto py-12 px-4 max-w-3xl'>
              <h2 className='text-2xl font-bold mb-8 text-center'>
                {response.rules_title || t('Terms & Rules')}
              </h2>
              <div className='space-y-8'>
                {response.rules_sections.map((section, i) => (
                  <div key={i}>
                    <RulesSection section={section} t={t} />
                    {i < response.rules_sections.length - 1 && (
                      <Separator className='mt-8' />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  )
}
