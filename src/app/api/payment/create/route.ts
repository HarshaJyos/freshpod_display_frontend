import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayInstance, linkCache } from '@/lib/razorpayHelper';

export async function POST(request: NextRequest) {
  try {
    const { machine_id } = await request.json();
    if (!machine_id) {
      return NextResponse.json({ error: 'machine_id parameter is required' }, { status: 400 });
    }

    const { instance, config } = await getRazorpayInstance(machine_id);
    const amountInPaise = Math.round(config.amount * 100);

    // 1. Check Cache first
    const cachedLink = linkCache.get(machine_id);
    if (cachedLink && cachedLink.amount === amountInPaise) {
      console.log(`[PAYMENT] Reusing cached active payment link for machine ${machine_id}`);
      return NextResponse.json({
        upi_intent: cachedLink.short_url,
        qr_id: cachedLink.id
      });
    }

    // 2. Generate a new payment link via Razorpay API
    console.log(`[PAYMENT] Creating new payment link of ${config.amount} INR for machine ${machine_id}`);
    const paymentLink = await instance.paymentLink.create({
      amount: amountInPaise,
      currency: 'INR',
      accept_partial: false,
      description: `Payment for FreshPod Machine ${machine_id}`,
      customer: {
        name: 'FreshPod Customer',
        email: 'customer@freshpod.in',
        contact: '+919999999999'
      },
      notify: {
        sms: false,
        email: false
      },
      reminder_enable: false,
      notes: {
        machine_id: machine_id
      }
    });

    // 3. Store active link config to cache
    linkCache.set(machine_id, {
      id: paymentLink.id,
      short_url: paymentLink.short_url,
      amount: amountInPaise,
      machineId: machine_id
    });

    return NextResponse.json({
      upi_intent: paymentLink.short_url,
      qr_id: paymentLink.id
    });
  } catch (error: any) {
    console.error(`[API] Failed to create payment:`, error.message || error);
    return NextResponse.json({ error: 'Failed to create payment link', details: error.message }, { status: 502 });
  }
}
