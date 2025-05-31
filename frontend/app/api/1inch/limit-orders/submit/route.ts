import { NextRequest, NextResponse } from 'next/server';
import { getOneInchLimitOrderSDK, type LimitOrderSDKConfig } from '@/lib/services/1inch-limit-order-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      orderData,
      signature,
      chainId,
    } = body;

    // Validate required fields
    if (!orderData || !signature || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderData, signature, and chainId are required' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY || process.env.NEXT_PUBLIC_ONEINCH_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '1inch API key not configured' },
        { status: 500 }
      );
    }

    // Initialize SDK
    const sdkConfig: LimitOrderSDKConfig = {
      authKey: apiKey,
      networkId: chainId
    };
    
    const sdk = getOneInchLimitOrderSDK(sdkConfig);

    console.log('Submitting order to 1inch via API...');

    // Submit the order using the raw HTTP API since we can't easily reconstruct the LimitOrder object
    const submitUrl = `https://api.1inch.dev/orderbook/v4.0/${chainId}/order`;
    
    const submitPayload = {
      orderHash: orderData.orderHash,
      signature,
      data: orderData,
    };

    const response = await fetch(submitUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submitPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('1inch API error:', response.status, errorText);
      throw new Error(`1inch API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Order submitted successfully:', result);

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error: any) {
    console.error('Error submitting limit order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit limit order' },
      { status: 500 }
    );
  }
} 