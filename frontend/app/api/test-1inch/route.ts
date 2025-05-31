import { NextRequest, NextResponse } from 'next/server';

/**
 * Test 1inch API Configuration
 * GET /api/test-1inch
 * Tests API key and basic connectivity to 1inch API
 */
export async function GET(request: NextRequest) {
  try {
    // Check if API key is available
    const apiKey = process.env.ONEINCH_API_KEY;
    
    const status = {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : 'not set',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    };

    if (!apiKey) {
      return NextResponse.json({
        ...status,
        error: 'No API key configured',
        solution: 'Set ONEINCH_API_KEY in your .env.local file',
        getApiKey: 'https://portal.1inch.dev'
      }, { status: 500 });
    }

    // Test API connectivity with a simple request
    console.log('Testing 1inch API connectivity...');
    
    const testUrl = 'https://api.1inch.dev/swap/v6.0/1/tokens';
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'accept': 'application/json',
        'User-Agent': 'ChainFlash-Pro/1.0',
      },
    });

    // Check response
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data;
    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return NextResponse.json({
        ...status,
        error: 'API key validation failed',
        httpStatus: response.status,
        httpStatusText: response.statusText,
        response: data,
        contentType,
        solution: response.status === 401 ? 'Check your API key validity at https://portal.1inch.dev' : 'Check 1inch API status'
      }, { status: response.status });
    }

    // Success
    const tokenCount = typeof data === 'object' && data.tokens ? Object.keys(data.tokens).length : 'unknown';
    
    return NextResponse.json({
      ...status,
      success: true,
      message: 'API key is valid and working',
      testResult: {
        httpStatus: response.status,
        tokenCount,
        contentType,
      }
    });

  } catch (error) {
    console.error('Test 1inch API Error:', error);
    
    return NextResponse.json({
      error: 'Test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      solution: 'Check network connectivity and API configuration'
    }, { status: 500 });
  }
} 