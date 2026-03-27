import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ active: false })

    const customers = await stripe.customers.list({ email, limit: 1 })
    if (!customers.data.length) return NextResponse.json({ active: false })

    const customerId = customers.data[0].id
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    })

    return NextResponse.json({ active: subscriptions.data.length > 0 })
  } catch (err) {
    console.error('Subscription check error:', err)
    return NextResponse.json({ active: false })
  }
}