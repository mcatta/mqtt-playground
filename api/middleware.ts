import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting storage (in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute

export function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers':
          'Authorization, Content-Type, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Apply CORS headers to all responses
  const response = NextResponse.next();
  response.headers.set(
    'Access-Control-Allow-Origin',
    process.env.CORS_ORIGIN || '*'
  );
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Requested-With'
  );

  // Rate limiting for login endpoint
  if (request.nextUrl.pathname === '/api/v1/auth/login') {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };

    // Reset if window has expired
    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + windowMs;
    } else {
      record.count++;
    }

    rateLimitMap.set(ip, record);

    // Check if rate limit exceeded
    if (record.count > maxAttempts) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts. Try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((record.resetAt - now) / 1000).toString(),
            'X-RateLimit-Limit': maxAttempts.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetAt.toString(),
          },
        }
      );
    }
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
