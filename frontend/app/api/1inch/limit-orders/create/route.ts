import { NextRequest, NextResponse } from 'next/server';
import { getOneInchLimitOrderSDK, type CreateOrderParams, type LimitOrderSDKConfig } from '@/lib/services/1inch-limit-order-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      makerAsset,
      takerAsset,
      makingAmount,
      takingAmount,
      maker,
      chainId,
      expiration = 3600,
      allowPartialFill = true,
      allowPriceImprovement = true,
    } = body;

    console.log('Received order creation request:', {
      makerAsset,
      takerAsset,
      makingAmount,
      takingAmount,
      maker,
      chainId,
      expiration,
      allowPartialFill,
      allowPriceImprovement,
    });

    // Validate required fields
    if (!makerAsset || !takerAsset || !makingAmount || !takingAmount || !maker || !chainId) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_1INCH_API_KEY || process.env.NEXT_PUBLIC_ONEINCH_API_KEY;
    if (!apiKey) {
      console.error('1inch API key not configured');
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
    
    console.log('Initializing SDK with config:', sdkConfig);
    const sdk = getOneInchLimitOrderSDK(sdkConfig);

    // Create order parameters
    const orderParams: CreateOrderParams = {
      makerAsset,
      takerAsset,
      makingAmount: BigInt(makingAmount),
      takingAmount: BigInt(takingAmount),
      maker,
      expiration: parseInt(expiration.toString()),
      allowPartialFill,
      allowPriceImprovement,
    };

    console.log('Creating limit order with params:', orderParams);

    // Validate order parameters
    const validation = sdk.validateOrderParams(orderParams);
    if (!validation.isValid) {
      console.error('Order validation failed:', validation.errors);
      return NextResponse.json(
        { error: `Order validation failed: ${validation.errors.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('Order parameters validated successfully');

    // Create the order
    console.log('Calling SDK createLimitOrder...');
    const order = await sdk.createLimitOrder(orderParams);
    console.log('Order created by SDK:', order);
    
    // Get typed data for signing
    console.log('Getting typed data for signing...');
    const typedData = sdk.getOrderTypedData(order);
    const orderHash = sdk.getOrderHash(order);

    console.log('Order created successfully:', { orderHash });

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        // Convert BigInt values to strings for JSON serialization
        makingAmount: order.makingAmount.toString(),
        takingAmount: order.takingAmount.toString(),
        salt: order.salt?.toString(),
        makerTraits: order.makerTraits?.toString(),
      },
      typedData,
      orderHash,
    });

  } catch (error: any) {
    console.error('Error creating limit order:', error);
    console.error('Error stack:', error.stack);
    
    // Handle specific errors
    let errorMessage = error.message || 'Failed to create limit order';
    
    if (errorMessage.includes('feeParams.whitelist.map')) {
      errorMessage = 'Fee parameter issue detected. This may be due to network configuration or API changes.';
    } else if (errorMessage.includes('CORS')) {
      errorMessage = 'Network connectivity issue. Please try again.';
    } else if (errorMessage.includes('Authorization')) {
      errorMessage = 'API authorization failed. Please check your configuration.';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 