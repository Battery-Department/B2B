import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

export class GoogleAuthService {
  private oauth2Client;
  
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
    );
  }

  // Generate Google OAuth URL
  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: state || '',
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  // Get user info from Google
  async getUserInfo(accessToken: string): Promise<GoogleUser> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    return response.json();
  }

  // Find or create user in database
  async findOrCreateUser(googleUser: GoogleUser) {
    try {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email },
        include: { customer: true }
      });

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            role: 'CUSTOMER',
            isActive: true,
            emailVerified: googleUser.email_verified,
            profileImage: googleUser.picture,
            // Create OAuth account link
            oauthAccounts: {
              create: {
                provider: 'google',
                providerAccountId: googleUser.id,
                access_token: '',
                scope: 'userinfo.email userinfo.profile',
              }
            },
            // Create customer profile
            customer: {
              create: {
                companyName: googleUser.name,
              }
            }
          },
          include: { customer: true }
        });
      } else {
        // Check if OAuth account exists
        const oauthAccount = await prisma.oAuthAccount.findUnique({
          where: {
            provider_providerAccountId: {
              provider: 'google',
              providerAccountId: googleUser.id,
            }
          }
        });

        if (!oauthAccount) {
          // Link OAuth account to existing user
          await prisma.oAuthAccount.create({
            data: {
              userId: user.id,
              provider: 'google',
              providerAccountId: googleUser.id,
              access_token: '',
              scope: 'userinfo.email userinfo.profile',
            }
          });
        }

        // Update user info
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: googleUser.name,
            profileImage: googleUser.picture,
            emailVerified: googleUser.email_verified,
          },
          include: { customer: true }
        });
      }

      return user;
    } catch (error) {
      console.error('Error in findOrCreateUser:', error);
      throw error;
    }
  }

  // Generate JWT session token
  generateSessionToken(user: any): string {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customer?.id,
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '30d',
    });
  }

  // Verify session token
  verifySessionToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return null;
    }
  }
}

export const googleAuth = new GoogleAuthService();