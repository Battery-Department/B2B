/**
 * Comprehensive Unit Tests for AuthService
 * RHY_076 - Testing Quality Implementation
 * 
 * Enterprise-grade test suite for FlexVolt battery supplier authentication
 * Tests all authentication flows across 4 global warehouses
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AuthService } from '@/services/auth/AuthService';
import { rhyPrisma } from '@/lib/rhy-database';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyAccessToken, 
  verifyRefreshToken 
} from '@/lib/jwt';
import { logAuthEvent, checkRateLimit, lockAccount, isAccountLocked } from '@/lib/security';
import { generateMFASecret, verifyMFACode, generateBackupCodes } from '@/lib/mfa';
import { createSessionManager } from '@/lib/session';
import bcrypt from 'bcryptjs';
import type { 
  LoginRequest, 
  RegisterRequest, 
  SecurityContext,
  SupplierAuthData,
  RateLimitInfo,
  AuthAuditEvent 
} from '@/types/auth';

// Mock dependencies
jest.mock('@/lib/rhy-database');
jest.mock('@/lib/jwt');
jest.mock('@/lib/security');
jest.mock('@/lib/mfa');
jest.mock('@/lib/session');
jest.mock('bcryptjs');

// Mock console to prevent test output noise
const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('AuthService - Enterprise Authentication System', () => {
  let authService: AuthService;
  let mockPrisma: jest.Mocked<typeof rhyPrisma>;
  let mockSecurityContext: SecurityContext;
  let mockSupplierData: any;
  let mockSessionManager: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Initialize AuthService
    authService = new AuthService();
    
    // Setup mock Prisma
    mockPrisma = rhyPrisma as jest.Mocked<typeof rhyPrisma>;
    
    // Setup mock security context
    mockSecurityContext = {
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Test Browser)',
      deviceFingerprint: 'test-device-fingerprint',
      timestamp: new Date()
    };

    // Setup mock supplier data
    mockSupplierData = {
      id: 'supplier-123',
      email: 'test@supplier.com',
      passwordHash: '$2a$12$test.hash.value',
      companyName: 'Test Supplier Co',
      contactName: 'John Test',
      phoneNumber: '+1-555-0123',
      status: 'ACTIVE',
      tier: 'PREMIUM',
      mfaEnabled: false,
      lastLoginAt: new Date('2024-01-01'),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2024-01-01'),
      warehouseAccess: [
        {
          warehouse: 'US',
          role: 'OPERATOR',
          permissions: ['VIEW_PRODUCTS', 'PLACE_ORDERS'],
          grantedAt: new Date('2023-01-01'),
          expiresAt: null
        }
      ],
      sessions: [],
      failedLoginAttempts: 0,
      lastFailedLoginAt: null
    };

    // Setup mock session manager
    mockSessionManager = {
      createSession: jest.fn().mockResolvedValue(true)
    };
    (createSessionManager as jest.Mock).mockReturnValue(mockSessionManager);

    // Setup default mock responses
    (checkRateLimit as jest.Mock).mockReturnValue({
      remaining: 5,
      resetTime: new Date(Date.now() + 900000),
      limit: 5,
      windowMs: 900000
    } as RateLimitInfo);
    (isAccountLocked as jest.Mock).mockReturnValue(false);
    (logAuthEvent as jest.Mock).mockResolvedValue(undefined);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (generateAccessToken as jest.Mock).mockReturnValue('mock-access-token');
    (generateRefreshToken as jest.Mock).mockReturnValue('mock-refresh-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
  });

  describe('login()', () => {
    describe('Successful Authentication Flows', () => {
      it('should successfully authenticate valid supplier without MFA', async () => {
        // Arrange
        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'validPassword',
          warehouse: 'US'
        };

        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(mockSupplierData);
        mockPrisma.rHYSession.create.mockResolvedValue({
          id: 'session-123',
          supplierId: 'supplier-123',
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
          lastUsedAt: new Date()
        } as any);
        mockPrisma.rHYRefreshToken.create.mockResolvedValue({} as any);
        mockPrisma.rHYSupplier.update.mockResolvedValue(mockSupplierData);

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.token).toBe('mock-access-token');
        expect(result.refreshToken).toBe('mock-refresh-token');
        expect(result.supplier).toBeDefined();
        expect(result.expiresIn).toBe(15 * 60);
        expect(result.warehouse).toBe('US');

        // Verify Prisma calls
        expect(mockPrisma.rHYSupplier.findUnique).toHaveBeenCalledWith({
          where: { email: 'test@supplier.com' },
          include: expect.objectContaining({
            warehouseAccess: true,
            sessions: expect.any(Object)
          })
        });

        expect(mockPrisma.rHYSession.create).toHaveBeenCalled();
        expect(mockPrisma.rHYRefreshToken.create).toHaveBeenCalled();
        expect(mockPrisma.rHYSupplier.update).toHaveBeenCalledWith({
          where: { id: 'supplier-123' },
          data: expect.objectContaining({
            lastLoginAt: expect.any(Date),
            failedLoginAttempts: 0
          })
        });

        // Verify security logging
        expect(logAuthEvent).toHaveBeenCalledWith(
          'LOGIN_SUCCESS',
          true,
          mockSecurityContext,
          'supplier-123',
          expect.any(Object)
        );
      });

      it('should successfully authenticate supplier with valid MFA code', async () => {
        // Arrange
        const supplierWithMFA = {
          ...mockSupplierData,
          mfaEnabled: true
        };

        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'validPassword',
          warehouse: 'US',
          mfaCode: '123456'
        };

        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(supplierWithMFA);
        mockPrisma.rHYMFA.findUnique.mockResolvedValue({
          secret: 'mfa-secret'
        } as any);
        (verifyMFACode as jest.Mock).mockReturnValue(true);
        mockPrisma.rHYSession.create.mockResolvedValue({
          id: 'session-123'
        } as any);
        mockPrisma.rHYRefreshToken.create.mockResolvedValue({} as any);
        mockPrisma.rHYSupplier.update.mockResolvedValue(supplierWithMFA);

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.token).toBe('mock-access-token');
        expect(verifyMFACode).toHaveBeenCalledWith('mfa-secret', '123456');
      });

      it('should handle different warehouse regions correctly', async () => {
        // Test all warehouse regions
        const regions = ['US', 'JP', 'EU', 'AU'] as const;
        
        for (const region of regions) {
          // Arrange
          const supplierWithAccess = {
            ...mockSupplierData,
            warehouseAccess: [
              {
                warehouse: region,
                role: 'OPERATOR',
                permissions: ['VIEW_PRODUCTS'],
                grantedAt: new Date(),
                expiresAt: null
              }
            ]
          };

          const loginRequest: LoginRequest = {
            email: 'test@supplier.com',
            password: 'validPassword',
            warehouse: region
          };

          mockPrisma.rHYSupplier.findUnique.mockResolvedValue(supplierWithAccess);
          mockPrisma.rHYSession.create.mockResolvedValue({ id: 'session-123' } as any);
          mockPrisma.rHYRefreshToken.create.mockResolvedValue({} as any);
          mockPrisma.rHYSupplier.update.mockResolvedValue(supplierWithAccess);

          // Act
          const result = await authService.login(loginRequest, mockSecurityContext);

          // Assert
          expect(result.success).toBe(true);
          expect(result.warehouse).toBe(region);
        }
      });
    });

    describe('Authentication Failures', () => {
      it('should fail when rate limit is exceeded', async () => {
        // Arrange
        (checkRateLimit as jest.Mock).mockReturnValue({
          remaining: 0,
          resetTime: new Date(Date.now() + 900000),
          limit: 5,
          windowMs: 900000
        } as RateLimitInfo);

        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'validPassword'
        };

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Too many login attempts');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'LOGIN_RATE_LIMITED',
          false,
          mockSecurityContext,
          undefined,
          expect.any(Object)
        );
      });

      it('should fail when account is locked', async () => {
        // Arrange
        (isAccountLocked as jest.Mock).mockReturnValue(true);

        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'validPassword'
        };

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Account is temporarily locked');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'LOGIN_ACCOUNT_LOCKED',
          false,
          mockSecurityContext,
          undefined,
          expect.any(Object)
        );
      });

      it('should fail when supplier does not exist', async () => {
        // Arrange
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(null);

        const loginRequest: LoginRequest = {
          email: 'nonexistent@supplier.com',
          password: 'validPassword'
        };

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid email or password.');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'LOGIN_USER_NOT_FOUND',
          false,
          mockSecurityContext,
          undefined,
          expect.any(Object)
        );
      });

      it('should fail when password is invalid', async () => {
        // Arrange
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(mockSupplierData);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        mockPrisma.rHYSupplier.update.mockResolvedValue(mockSupplierData);

        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'invalidPassword'
        };

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid email or password.');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'LOGIN_INVALID_PASSWORD',
          false,
          mockSecurityContext,
          'supplier-123',
          expect.any(Object)
        );
      });

      it('should fail when supplier status is not ACTIVE', async () => {
        // Arrange
        const inactiveSupplier = {
          ...mockSupplierData,
          status: 'SUSPENDED'
        };
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(inactiveSupplier);

        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'validPassword'
        };

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Account is suspended');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'LOGIN_INACTIVE_ACCOUNT',
          false,
          mockSecurityContext,
          'supplier-123',
          expect.any(Object)
        );
      });

      it('should fail when warehouse access is denied', async () => {
        // Arrange
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(mockSupplierData);

        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'validPassword',
          warehouse: 'JP' // Supplier only has US access
        };

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Access denied to JP warehouse');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'LOGIN_WAREHOUSE_ACCESS_DENIED',
          false,
          mockSecurityContext,
          'supplier-123',
          expect.any(Object)
        );
      });

      it('should require MFA when enabled but code not provided', async () => {
        // Arrange
        const supplierWithMFA = {
          ...mockSupplierData,
          mfaEnabled: true
        };
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(supplierWithMFA);

        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'validPassword'
        };

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.requiresMFA).toBe(true);
        expect(result.error).toBe('Multi-factor authentication required.');
      });

      it('should fail when MFA code is invalid', async () => {
        // Arrange
        const supplierWithMFA = {
          ...mockSupplierData,
          mfaEnabled: true
        };
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(supplierWithMFA);
        mockPrisma.rHYMFA.findUnique.mockResolvedValue({
          secret: 'mfa-secret'
        } as any);
        (verifyMFACode as jest.Mock).mockReturnValue(false);

        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'validPassword',
          mfaCode: 'invalid'
        };

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.requiresMFA).toBe(true);
        expect(result.error).toBe('Invalid MFA code.');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'LOGIN_INVALID_MFA',
          false,
          mockSecurityContext,
          'supplier-123',
          expect.any(Object)
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        // Arrange
        const dbError = new Error('Database connection failed');
        mockPrisma.rHYSupplier.findUnique.mockRejectedValue(dbError);

        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'validPassword'
        };

        // Act
        const result = await authService.login(loginRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('An error occurred during login. Please try again.');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'LOGIN_ERROR',
          false,
          mockSecurityContext,
          undefined,
          expect.objectContaining({
            error: 'Database connection failed'
          })
        );
        expect(consoleSpy).toHaveBeenCalledWith('Login error:', dbError);
      });
    });

    describe('Performance Requirements', () => {
      it('should complete login within performance threshold', async () => {
        // Arrange
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(mockSupplierData);
        mockPrisma.rHYSession.create.mockResolvedValue({ id: 'session-123' } as any);
        mockPrisma.rHYRefreshToken.create.mockResolvedValue({} as any);
        mockPrisma.rHYSupplier.update.mockResolvedValue(mockSupplierData);

        const loginRequest: LoginRequest = {
          email: 'test@supplier.com',
          password: 'validPassword'
        };

        // Act
        const startTime = Date.now();
        const result = await authService.login(loginRequest, mockSecurityContext);
        const duration = Date.now() - startTime;

        // Assert
        expect(result.success).toBe(true);
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
      });
    });
  });

  describe('register()', () => {
    describe('Successful Registration', () => {
      it('should successfully register new supplier', async () => {
        // Arrange
        const registerRequest: RegisterRequest = {
          email: 'newuser@supplier.com',
          password: 'securePassword123!',
          companyName: 'New Supplier Co',
          contactName: 'Jane Doe',
          phoneNumber: '+1-555-0199',
          warehouseRegion: 'US',
          businessType: 'DISTRIBUTOR',
          agreesToTerms: true
        };

        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(null); // Email doesn't exist
        mockPrisma.rHYSupplier.create.mockResolvedValue({
          id: 'supplier-new',
          email: 'newuser@supplier.com',
          companyName: 'New Supplier Co',
          status: 'PENDING',
          warehouseAccess: [
            {
              warehouse: 'US',
              role: 'OPERATOR',
              permissions: ['VIEW_PRODUCTS', 'PLACE_ORDERS', 'VIEW_ORDERS']
            }
          ]
        } as any);

        // Act
        const result = await authService.register(registerRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.supplier).toBeDefined();
        expect(result.supplier?.email).toBe('newuser@supplier.com');
        expect(result.requiresVerification).toBe(true);
        expect(result.message).toContain('Registration successful');

        // Verify password hashing
        expect(bcrypt.hash).toHaveBeenCalledWith('securePassword123!', 12);

        // Verify supplier creation
        expect(mockPrisma.rHYSupplier.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            email: 'newuser@supplier.com',
            companyName: 'New Supplier Co',
            status: 'PENDING',
            tier: 'STANDARD'
          }),
          include: { warehouseAccess: true }
        });

        expect(logAuthEvent).toHaveBeenCalledWith(
          'REGISTER_SUCCESS',
          true,
          mockSecurityContext,
          'supplier-new',
          expect.any(Object)
        );
      });

      it('should create warehouse access for all regions', async () => {
        const regions = ['US', 'JP', 'EU', 'AU'] as const;

        for (const region of regions) {
          // Arrange
          const registerRequest: RegisterRequest = {
            email: `user-${region}@supplier.com`,
            password: 'securePassword123!',
            companyName: 'Test Company',
            contactName: 'Test User',
            warehouseRegion: region,
            businessType: 'DISTRIBUTOR',
            agreesToTerms: true
          };

          mockPrisma.rHYSupplier.findUnique.mockResolvedValue(null);
          mockPrisma.rHYSupplier.create.mockResolvedValue({
            id: `supplier-${region}`,
            email: registerRequest.email,
            status: 'PENDING'
          } as any);

          // Act
          const result = await authService.register(registerRequest, mockSecurityContext);

          // Assert
          expect(result.success).toBe(true);
          expect(mockPrisma.rHYSupplier.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
              warehouseAccess: {
                create: expect.objectContaining({
                  warehouse: region
                })
              }
            }),
            include: { warehouseAccess: true }
          });
        }
      });
    });

    describe('Registration Failures', () => {
      it('should fail when rate limit is exceeded', async () => {
        // Arrange
        (checkRateLimit as jest.Mock).mockReturnValue({
          remaining: 0,
          resetTime: new Date(Date.now() + 3600000),
          limit: 3,
          windowMs: 3600000
        } as RateLimitInfo);

        const registerRequest: RegisterRequest = {
          email: 'test@supplier.com',
          password: 'password',
          companyName: 'Test Company',
          contactName: 'Test User',
          warehouseRegion: 'US',
          businessType: 'DISTRIBUTOR',
          agreesToTerms: true
        };

        // Act
        const result = await authService.register(registerRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toContain('Too many registration attempts');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'REGISTER_RATE_LIMITED',
          false,
          mockSecurityContext,
          undefined,
          expect.any(Object)
        );
      });

      it('should fail when email already exists', async () => {
        // Arrange
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(mockSupplierData);

        const registerRequest: RegisterRequest = {
          email: 'test@supplier.com', // Existing email
          password: 'password',
          companyName: 'Test Company',
          contactName: 'Test User',
          warehouseRegion: 'US',
          businessType: 'DISTRIBUTOR',
          agreesToTerms: true
        };

        // Act
        const result = await authService.register(registerRequest, mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('An account with this email already exists.');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'REGISTER_EMAIL_EXISTS',
          false,
          mockSecurityContext,
          undefined,
          expect.any(Object)
        );
      });
    });
  });

  describe('refreshToken()', () => {
    describe('Successful Token Refresh', () => {
      it('should successfully refresh valid token', async () => {
        // Arrange
        const refreshToken = 'valid-refresh-token';
        const mockPayload = { sub: 'supplier-123' };
        
        (verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
        mockPrisma.rHYRefreshToken.findFirst.mockResolvedValue({
          id: 'token-123',
          token: refreshToken,
          supplierId: 'supplier-123',
          supplier: mockSupplierData
        } as any);
        mockPrisma.$transaction.mockImplementation(async (callback) => {
          return await callback(mockPrisma);
        });
        mockPrisma.rHYRefreshToken.update.mockResolvedValue({} as any);
        mockPrisma.rHYRefreshToken.create.mockResolvedValue({} as any);

        // Act
        const result = await authService.refreshToken(refreshToken, mockSecurityContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.token).toBe('mock-access-token');
        expect(result.refreshToken).toBe('mock-refresh-token');
        expect(result.expiresIn).toBe(15 * 60);

        expect(verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
        expect(generateAccessToken).toHaveBeenCalled();
        expect(generateRefreshToken).toHaveBeenCalledWith('supplier-123');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'REFRESH_TOKEN_SUCCESS',
          true,
          mockSecurityContext,
          'supplier-123'
        );
      });
    });

    describe('Token Refresh Failures', () => {
      it('should fail when refresh token is invalid', async () => {
        // Arrange
        (verifyRefreshToken as jest.Mock).mockReturnValue(null);

        // Act
        const result = await authService.refreshToken('invalid-token', mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid refresh token');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'REFRESH_TOKEN_INVALID',
          false,
          mockSecurityContext
        );
      });

      it('should fail when refresh token is not found in database', async () => {
        // Arrange
        const mockPayload = { sub: 'supplier-123' };
        (verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
        mockPrisma.rHYRefreshToken.findFirst.mockResolvedValue(null);

        // Act
        const result = await authService.refreshToken('missing-token', mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Refresh token not found or expired');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'REFRESH_TOKEN_NOT_FOUND',
          false,
          mockSecurityContext,
          'supplier-123'
        );
      });

      it('should fail when supplier is inactive', async () => {
        // Arrange
        const mockPayload = { sub: 'supplier-123' };
        const inactiveSupplier = { ...mockSupplierData, status: 'SUSPENDED' };
        
        (verifyRefreshToken as jest.Mock).mockReturnValue(mockPayload);
        mockPrisma.rHYRefreshToken.findFirst.mockResolvedValue({
          id: 'token-123',
          supplier: inactiveSupplier
        } as any);

        // Act
        const result = await authService.refreshToken('valid-token', mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Account is not active');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'REFRESH_TOKEN_INACTIVE_SUPPLIER',
          false,
          mockSecurityContext,
          'supplier-123',
          expect.objectContaining({ status: 'SUSPENDED' })
        );
      });
    });
  });

  describe('validateSession()', () => {
    describe('Successful Session Validation', () => {
      it('should successfully validate active session', async () => {
        // Arrange
        const token = 'valid-access-token';
        const mockPayload = { sub: 'supplier-123' };
        
        (verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue({
          ...mockSupplierData,
          sessions: [
            {
              id: 'session-123',
              expiresAt: new Date(Date.now() + 3600000),
              lastUsedAt: new Date()
            }
          ]
        });
        mockPrisma.rHYSession.update.mockResolvedValue({} as any);

        // Act
        const result = await authService.validateSession(token, mockSecurityContext);

        // Assert
        expect(result.valid).toBe(true);
        expect(result.supplier).toBeDefined();
        expect(result.session).toBeDefined();
        expect(result.supplier?.id).toBe('supplier-123');

        expect(verifyAccessToken).toHaveBeenCalledWith(token);
        expect(mockPrisma.rHYSession.update).toHaveBeenCalledWith({
          where: { id: 'session-123' },
          data: { lastUsedAt: expect.any(Date) }
        });
        expect(logAuthEvent).toHaveBeenCalledWith(
          'SESSION_VALID',
          true,
          mockSecurityContext,
          'supplier-123'
        );
      });
    });

    describe('Session Validation Failures', () => {
      it('should fail when token is invalid', async () => {
        // Arrange
        (verifyAccessToken as jest.Mock).mockReturnValue(null);

        // Act
        const result = await authService.validateSession('invalid-token', mockSecurityContext);

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid token');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'SESSION_INVALID_TOKEN',
          false,
          mockSecurityContext
        );
      });

      it('should fail when supplier is not found', async () => {
        // Arrange
        const mockPayload = { sub: 'nonexistent-supplier' };
        (verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(null);

        // Act
        const result = await authService.validateSession('valid-token', mockSecurityContext);

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Supplier not found');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'SESSION_SUPPLIER_NOT_FOUND',
          false,
          mockSecurityContext,
          'nonexistent-supplier'
        );
      });

      it('should fail when supplier is inactive', async () => {
        // Arrange
        const mockPayload = { sub: 'supplier-123' };
        const inactiveSupplier = { ...mockSupplierData, status: 'SUSPENDED' };
        
        (verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(inactiveSupplier);

        // Act
        const result = await authService.validateSession('valid-token', mockSecurityContext);

        // Assert
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Account is not active');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'SESSION_INACTIVE_SUPPLIER',
          false,
          mockSecurityContext,
          'supplier-123',
          expect.objectContaining({ status: 'SUSPENDED' })
        );
      });
    });
  });

  describe('setupMFA() and verifyMFASetup()', () => {
    describe('MFA Setup Flow', () => {
      it('should successfully setup MFA with valid password', async () => {
        // Arrange
        const supplierId = 'supplier-123';
        const password = 'validPassword';
        
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(mockSupplierData);
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        (generateMFASecret as jest.Mock).mockReturnValue('generated-secret');
        (generateBackupCodes as jest.Mock).mockReturnValue(['code1', 'code2']);
        mockPrisma.rHYMFA.upsert.mockResolvedValue({} as any);

        // Act
        const result = await authService.setupMFA(supplierId, password, mockSecurityContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.secret).toBe('generated-secret');
        expect(result.backupCodes).toEqual(['code1', 'code2']);
        expect(result.qrCode).toContain('otpauth://totp/RHY%20Supplier%20Portal');

        expect(generateMFASecret).toHaveBeenCalled();
        expect(generateBackupCodes).toHaveBeenCalled();
        expect(mockPrisma.rHYMFA.upsert).toHaveBeenCalledWith({
          where: { supplierId },
          create: expect.objectContaining({
            supplierId,
            secret: 'generated-secret',
            isEnabled: false
          }),
          update: expect.objectContaining({
            secret: 'generated-secret',
            isEnabled: false
          })
        });
        expect(logAuthEvent).toHaveBeenCalledWith(
          'MFA_SETUP_INITIATED',
          true,
          mockSecurityContext,
          supplierId
        );
      });

      it('should successfully verify MFA setup with valid code', async () => {
        // Arrange
        const supplierId = 'supplier-123';
        const code = '123456';
        
        mockPrisma.rHYMFA.findUnique.mockResolvedValue({
          supplierId,
          secret: 'mfa-secret',
          isEnabled: false
        } as any);
        (verifyMFACode as jest.Mock).mockReturnValue(true);
        mockPrisma.rHYMFA.update.mockResolvedValue({} as any);
        mockPrisma.rHYSupplier.update.mockResolvedValue({} as any);

        // Act
        const result = await authService.verifyMFASetup(supplierId, code, mockSecurityContext);

        // Assert
        expect(result.success).toBe(true);
        expect(result.message).toBe('MFA has been successfully enabled');

        expect(verifyMFACode).toHaveBeenCalledWith('mfa-secret', code);
        expect(mockPrisma.rHYMFA.update).toHaveBeenCalledWith({
          where: { supplierId },
          data: expect.objectContaining({
            isEnabled: true,
            verifiedAt: expect.any(Date)
          })
        });
        expect(mockPrisma.rHYSupplier.update).toHaveBeenCalledWith({
          where: { id: supplierId },
          data: { mfaEnabled: true }
        });
        expect(logAuthEvent).toHaveBeenCalledWith(
          'MFA_SETUP_COMPLETED',
          true,
          mockSecurityContext,
          supplierId
        );
      });
    });

    describe('MFA Setup Failures', () => {
      it('should fail MFA setup when supplier not found', async () => {
        // Arrange
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(null);

        // Act
        const result = await authService.setupMFA('nonexistent', 'password', mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Supplier not found');
      });

      it('should fail MFA setup with invalid password', async () => {
        // Arrange
        mockPrisma.rHYSupplier.findUnique.mockResolvedValue(mockSupplierData);
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        // Act
        const result = await authService.setupMFA('supplier-123', 'wrong', mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid password');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'MFA_SETUP_INVALID_PASSWORD',
          false,
          mockSecurityContext,
          'supplier-123'
        );
      });

      it('should fail MFA verification when not setup', async () => {
        // Arrange
        mockPrisma.rHYMFA.findUnique.mockResolvedValue(null);

        // Act
        const result = await authService.verifyMFASetup('supplier-123', '123456', mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('MFA not setup');
      });

      it('should fail MFA verification with invalid code', async () => {
        // Arrange
        mockPrisma.rHYMFA.findUnique.mockResolvedValue({
          supplierId: 'supplier-123',
          secret: 'mfa-secret'
        } as any);
        (verifyMFACode as jest.Mock).mockReturnValue(false);

        // Act
        const result = await authService.verifyMFASetup('supplier-123', 'invalid', mockSecurityContext);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid MFA code');
        expect(logAuthEvent).toHaveBeenCalledWith(
          'MFA_VERIFY_INVALID_CODE',
          false,
          mockSecurityContext,
          'supplier-123'
        );
      });
    });
  });

  describe('logout()', () => {
    it('should successfully logout and revoke sessions', async () => {
      // Arrange
      const token = 'valid-token';
      const sessionId = 'session-123';
      const mockPayload = { sub: 'supplier-123' };
      
      (verifyAccessToken as jest.Mock).mockReturnValue(mockPayload);
      mockPrisma.rHYSession.updateMany.mockResolvedValue({ count: 1 } as any);
      mockPrisma.rHYRefreshToken.updateMany.mockResolvedValue({ count: 1 } as any);

      // Act
      const result = await authService.logout(token, sessionId, mockSecurityContext);

      // Assert
      expect(result.success).toBe(true);
      expect(mockPrisma.rHYSession.updateMany).toHaveBeenCalledWith({
        where: { id: sessionId, supplierId: 'supplier-123' },
        data: { revoked: true }
      });
      expect(mockPrisma.rHYRefreshToken.updateMany).toHaveBeenCalledWith({
        where: { supplierId: 'supplier-123' },
        data: { revoked: true }
      });
      expect(logAuthEvent).toHaveBeenCalledWith(
        'LOGOUT_SUCCESS',
        true,
        mockSecurityContext,
        'supplier-123',
        expect.objectContaining({ sessionId })
      );
    });

    it('should logout gracefully even with invalid token', async () => {
      // Arrange
      (verifyAccessToken as jest.Mock).mockReturnValue(null);

      // Act
      const result = await authService.logout('invalid-token');

      // Assert
      expect(result.success).toBe(true);
      // Should not attempt database operations with invalid token
      expect(mockPrisma.rHYSession.updateMany).not.toHaveBeenCalled();
      expect(mockPrisma.rHYRefreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});