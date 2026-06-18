import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import logger from '../config/logger';

export class AuthService {
  /**
   * Registers a new user in the database.
   * Hashes the password securely with bcrypt before storing it.
   */
  static async register(fullName: string, email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const error: any = new Error('Email address is already registered');
      error.statusCode = 400;
      throw error;
    }

    // Hash the password with 10 salt rounds
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        fullName,
        email: normalizedEmail,
        passwordHash,
      },
    });

    logger.info(`User successfully registered: ${user.email} (ID: ${user.id})`);

    // Return user without password hash
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Validates user credentials.
   * Compares the plain password with the stored bcrypt hash.
   */
  static async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    // Compare password with bcrypt hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const error: any = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    logger.info(`User successfully logged in: ${user.email} (ID: ${user.id})`);

    // Return user details (omit password hash)
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
