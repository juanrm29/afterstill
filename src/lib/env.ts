/**
 * Environment Variables Validation
 * 
 * Validates all environment variables at build/runtime
 * to prevent crashes from missing configuration
 */

import { z } from 'zod';

// Schema for environment variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DIRECT_URL: z.string().url().optional(),
  
  // Authentication
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  AUTH_URL: z.string().url().optional(),
  
  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
  
  // Application
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().default('Afterstill'),
  
  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// Type for validated env
export type Env = z.infer<typeof envSchema>;

// Validation function
function validateEnv(): Env {
  try {
    return envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
      AUTH_SECRET: process.env.AUTH_SECRET,
      AUTH_URL: process.env.AUTH_URL,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NODE_ENV: process.env.NODE_ENV,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<Env>;
      const missing = zodError.issues
        .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
        .join('\n');
      
      console.error('❌ Environment validation failed:\n' + missing);
      
      // In development, warn but don't crash
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Running in development mode with incomplete env');
        return {
          DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost/afterstill',
          AUTH_SECRET: process.env.AUTH_SECRET || 'development-secret-at-least-32-chars-long',
          NODE_ENV: 'development',
          NEXT_PUBLIC_APP_NAME: 'Afterstill',
        } as Env;
      }
      
      throw new Error('Environment validation failed');
    }
    throw error;
  }
}

// Export validated env
export const env = validateEnv();

// Type-safe env access
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  return env[key];
}

// Check if feature is available
export function hasFeature(feature: 'ai' | 'email'): boolean {
  switch (feature) {
    case 'ai':
      return Boolean(env.OPENAI_API_KEY);
    case 'email':
      return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
    default:
      return false;
  }
}
