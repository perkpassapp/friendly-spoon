import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const session = await stripe.billingPortal.sessions.create({
      customer: await getCustomerId(email),
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Cancel subscription error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function getCustomerId(email: string): Promise<string> {
  const customers = await stripe.customers.list({ email, limit: 1 })
  if (!customers.data.length) throw new Error('Customer not found')
  return customers.data[0].id
}