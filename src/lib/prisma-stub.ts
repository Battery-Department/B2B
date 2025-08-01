// Stub Prisma client for deployment without database
export const prisma = new Proxy({} as any, {
  get: (target, prop) => {
    if (prop === '$connect') {
      return async () => console.log('Prisma stub: connect called');
    }
    if (prop === '$disconnect') {
      return async () => console.log('Prisma stub: disconnect called');
    }
    // Return a proxy that handles any method calls
    return new Proxy(() => {}, {
      get: (_, nestedProp) => {
        if (nestedProp === 'findMany') {
          return async () => [];
        }
        if (nestedProp === 'findFirst' || nestedProp === 'findUnique') {
          return async () => null;
        }
        if (nestedProp === 'create' || nestedProp === 'update' || nestedProp === 'delete') {
          return async () => ({});
        }
        if (nestedProp === 'count') {
          return async () => 0;
        }
        return async () => null;
      },
      apply: async () => null,
    });
  },
});

export const rhyPrisma = prisma;
export const modularPrisma = prisma;