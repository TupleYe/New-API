import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PricingPlan {
  name: string
  price: string
  pricePeriod: string
  description: string
  popular?: boolean
  features: string[]
  cta: string
  ctaLink: string
}

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '¥0',
    pricePeriod: 'free',
    description: 'Get started with basic API access',
    features: [
      '50,000 tokens per month',
      'Basic models (GPT-4o mini, etc.)',
      '1 API Key',
      'Community support',
    ],
    cta: 'Get Started',
    ctaLink: '/sign-up',
  },
  {
    name: 'Pro',
    price: '¥99',
    pricePeriod: '/month',
    description: 'For individual developers and small teams',
    popular: true,
    features: [
      '1,000,000 tokens per month',
      'All available models',
      '10 API Keys',
      'Priority support',
      'Usage analytics',
      'Rate limit: 100 req/min',
    ],
    cta: 'Subscribe',
    ctaLink: '/sign-up',
  },
  {
    name: 'Team',
    price: '¥299',
    pricePeriod: '/month',
    description: 'For growing teams with higher demands',
    features: [
      '5,000,000 tokens per month',
      'All available models',
      '50 API Keys',
      'Dedicated support',
      'Advanced analytics',
      'Rate limit: 500 req/min',
      'Team management',
    ],
    cta: 'Subscribe',
    ctaLink: '/sign-up',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    pricePeriod: '',
    description: 'For large organizations with custom needs',
    features: [
      'Custom token allocation',
      'All models + private deployment',
      'Unlimited API Keys',
      '24/7 dedicated support',
      'Custom rate limits',
      'SLA guarantee',
      'On-premise option',
      'Invoice billing',
    ],
    cta: 'Contact Us',
    ctaLink: '/sign-up',
  },
]

export function PricingPlans() {
  const { t } = useTranslation()

  return (
    <section className='relative overflow-hidden px-6 py-20 md:py-28'>
      <div className='mx-auto max-w-6xl'>
        {/* Section header */}
        <div className='mx-auto mb-14 max-w-2xl text-center'>
          <Badge variant='secondary' className='mb-4 px-3 py-1 text-xs'>
            {t('Pricing')}
          </Badge>
          <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
            {t('Simple, Transparent Pricing')}
          </h2>
          <p className='text-muted-foreground mt-3 text-sm leading-relaxed'>
            {t(
              'Choose the plan that fits your needs. No hidden fees. Upgrade or downgrade anytime.'
            )}
          </p>
        </div>

        {/* Pricing cards */}
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 shadow-xs transition-all duration-200 hover:shadow-md',
                plan.popular
                  ? 'border-blue-500/40 bg-gradient-to-b from-blue-500/5 to-transparent dark:from-blue-400/5'
                  : 'border-border/60 bg-card'
              )}
            >
              {plan.popular && (
                <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                  <Badge className='bg-blue-500 text-white hover:bg-blue-500 dark:bg-blue-400 dark:text-white'>
                    {t('Most Popular')}
                  </Badge>
                </div>
              )}

              <div className='mb-6'>
                <h3 className='text-lg font-semibold'>{plan.name}</h3>
                <div className='mt-3 flex items-baseline gap-0.5'>
                  <span className='text-3xl font-bold'>{plan.price}</span>
                  {plan.pricePeriod && (
                    <span className='text-muted-foreground text-sm'>
                      {plan.pricePeriod}
                    </span>
                  )}
                </div>
                <p className='text-muted-foreground mt-1.5 text-xs leading-relaxed'>
                  {plan.description}
                </p>
              </div>

              <ul className='mb-8 flex-1 space-y-3'>
                {plan.features.map((feature) => (
                  <li key={feature} className='flex items-start gap-2.5 text-sm'>
                    <Check className='mt-0.5 h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400' />
                    <span className='text-muted-foreground'>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  'w-full rounded-xl',
                  plan.popular
                    ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500'
                    : ''
                )}
                variant={plan.popular ? 'default' : 'outline'}
                render={<Link to={plan.ctaLink} />}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className='mt-12 text-center'>
          <p className='text-muted-foreground text-xs'>
            {t(
              'All plans include free model testing. No credit card required to start.'
            )}
          </p>
        </div>
      </div>
    </section>
  )
}
