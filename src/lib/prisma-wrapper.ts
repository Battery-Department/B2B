// Wrapper to handle Prisma in Vercel deployment
const stub = require('./prisma-stub');

// Check if we're in Vercel or should skip Prisma
const useStub = process.env.VERCEL || process.env.SKIP_PRISMA === 'true';

export const PrismaClient = useStub ? 
  function() { return stub.prisma; } : 
  require('@prisma/client').PrismaClient;

export const prisma = useStub ? stub.prisma : new (require('@prisma/client').PrismaClient)();