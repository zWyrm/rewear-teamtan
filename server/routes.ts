import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertItemSchema, insertSwapSchema, loginSchema, registerSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";

const JWT_SECRET = process.env.JWT_SECRET || "rewear-secret-key";

interface AuthRequest extends Request {
  user?: { id: number; username: string; role: string };
}

const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session and passport setup
  app.use(session({
    secret: process.env.SESSION_SECRET || "rewear-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport Google Strategy (only if credentials are provided)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists by Google ID
      let user = await storage.getUserByEmail(profile.emails?.[0]?.value || "");
      
      if (user) {
        // Update Google ID if not set
        if (!user.googleId) {
          // We'd need an update method in storage for this
          user.googleId = profile.id;
        }
        return done(null, user);
      } else {
        // Create new user
        const newUser = await storage.createUser({
          username: profile.displayName?.replace(/\s+/g, '_').toLowerCase() || `user_${profile.id}`,
          email: profile.emails?.[0]?.value || "",
          firstName: profile.name?.givenName || "",
          lastName: profile.name?.familyName || "",
          googleId: profile.id,
          // No password for Google users - will be handled by schema defaults
        });
        return done(null, newUser);
      }
    } catch (error) {
      return done(error, null);
    }
    }));

    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id: number, done) => {
      try {
        const user = await storage.getUser(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });

    // Google OAuth routes
    app.get("/api/auth/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );

    app.get("/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/login" }),
      (req, res) => {
        // Generate JWT token for the authenticated user
        const user = req.user as any;
        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        // Set token in a cookie or redirect with token
        res.cookie('auth_token', token, { 
          httpOnly: true, 
          secure: false, // Set to true in production with HTTPS
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        // Redirect to dashboard or home
        res.redirect(user.role === 'admin' ? '/admin' : '/dashboard');
      }
    );
  } else {
    // Fallback routes when Google OAuth is not configured
    app.get("/api/auth/google", (req, res) => {
      res.status(400).json({ 
        message: "Google OAuth not configured. Please use email/password login." 
      });
    });

    app.get("/api/auth/google/callback", (req, res) => {
      res.redirect("/login?error=oauth_not_configured");
    });
  }

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        user: { id: user.id, username: user.username, email: user.email, role: user.role, points: user.points },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { usernameOrEmail, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsernameOrEmail(usernameOrEmail);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is suspended or banned
      if (user.isBanned) {
        return res.status(403).json({ message: "Account is banned" });
      }

      if (user.suspendedUntil && new Date() < user.suspendedUntil) {
        return res.status(403).json({ message: "Account is suspended" });
      }

      if (!user.password) {
        return res.status(401).json({ message: "Please use Google login for this account" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        user: { id: user.id, username: user.username, email: user.email, role: user.role, points: user.points },
        token
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        points: user.points
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Item routes
  app.get("/api/items", async (req, res) => {
    try {
      const { category, userId, approved } = req.query;
      const filters: any = {};
      
      if (category) filters.category = category as string;
      if (userId) filters.userId = parseInt(userId as string);
      if (approved !== undefined) filters.isApproved = approved === 'true';
      filters.isAvailable = true;

      const items = await storage.getItems(filters);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/items", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      
      const item = await storage.createItem({
        ...itemData,
        userId: req.user!.id,
      });

      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid item data" });
    }
  });

  app.get("/api/my-items", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const items = await storage.getItems({ userId: req.user!.id });
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/items/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Verify the user owns the item or is admin
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      if (item.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Not authorized to update this item" });
      }
      
      const updatedItem = await storage.updateItem(id, updates);
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Swap routes
  app.post("/api/swaps", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log("Received swap data:", req.body); // Debug log
      const swapData = insertSwapSchema.parse(req.body);
      
      // Verify the requester owns the requester item (if provided)
      if (swapData.requesterItemId) {
        const requesterItem = await storage.getItem(swapData.requesterItemId);
        if (!requesterItem || requesterItem.userId !== req.user!.id) {
          return res.status(403).json({ message: "You don't own this item" });
        }
      }

      // Verify the owner item exists and is available
      const ownerItem = await storage.getItem(swapData.ownerItemId);
      if (!ownerItem || !ownerItem.isAvailable) {
        return res.status(404).json({ message: "Item not available" });
      }

      const swap = await storage.createSwap({
        ...swapData,
        requesterId: req.user!.id,
        ownerId: ownerItem.userId,
      });

      res.status(201).json(swap);
    } catch (error) {
      console.error("Swap creation error:", error); // Debug log
      res.status(400).json({ message: "Invalid swap data", error: error.message });
    }
  });

  app.get("/api/my-swaps", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const requestedSwaps = await storage.getSwaps({ requesterId: req.user!.id });
      const receivedSwaps = await storage.getSwaps({ ownerId: req.user!.id });
      
      // For all swaps, include item details and contact details for accepted ones
      const enrichedRequested = await Promise.all(requestedSwaps.map(async (swap) => {
        const ownerItem = await storage.getItem(swap.ownerItemId);
        const requesterItem = swap.requesterItemId ? await storage.getItem(swap.requesterItemId) : null;
        
        let otherUserContact = null;
        if (swap.status === 'accepted') {
          const owner = await storage.getUser(swap.ownerId);
          otherUserContact = owner ? {
            name: `${owner.firstName} ${owner.lastName}`,
            email: owner.email,
            phoneNumber: owner.phoneNumber,
            username: owner.username
          } : null;
        }
        
        return {
          ...swap,
          ownerItem: ownerItem ? { id: ownerItem.id, title: ownerItem.title } : null,
          requesterItem: requesterItem ? { id: requesterItem.id, title: requesterItem.title } : null,
          otherUserContact
        };
      }));

      const enrichedReceived = await Promise.all(receivedSwaps.map(async (swap) => {
        const ownerItem = await storage.getItem(swap.ownerItemId);
        const requesterItem = swap.requesterItemId ? await storage.getItem(swap.requesterItemId) : null;
        
        let otherUserContact = null;
        if (swap.status === 'accepted') {
          const requester = await storage.getUser(swap.requesterId);
          otherUserContact = requester ? {
            name: `${requester.firstName} ${requester.lastName}`,
            email: requester.email,
            phoneNumber: requester.phoneNumber,
            username: requester.username
          } : null;
        }
        
        return {
          ...swap,
          ownerItem: ownerItem ? { id: ownerItem.id, title: ownerItem.title } : null,
          requesterItem: requesterItem ? { id: requesterItem.id, title: requesterItem.title } : null,
          otherUserContact
        };
      }));
      
      res.json({
        requested: enrichedRequested,
        received: enrichedReceived,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/swaps/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const swap = await storage.getSwap(id);
      if (!swap) {
        return res.status(404).json({ message: "Swap not found" });
      }

      // Only owner can accept/decline, only requester can cancel
      if (status === 'accepted' || status === 'declined') {
        if (swap.ownerId !== req.user!.id) {
          return res.status(403).json({ message: "Not authorized" });
        }
      }

      const updatedSwap = await storage.updateSwap(id, { status });
      
      // Handle points transfer and contact sharing on acceptance
      if (status === 'accepted') {
        const requester = await storage.getUser(swap.requesterId);
        const owner = await storage.getUser(swap.ownerId);
        
        if (requester && owner) {
          // Handle points transfer only if no items are being swapped (pure points transaction)
          if (swap.pointsDifference !== 0 && !swap.requesterItemId) {
            // Pure points transaction - update both users' balances
            if (swap.pointsDifference > 0) {
              // Requester pays owner points for the item
              await storage.updateUserPoints(swap.requesterId, requester.points - swap.pointsDifference);
              await storage.updateUserPoints(swap.ownerId, owner.points + swap.pointsDifference);
            } else {
              // Owner pays requester points (shouldn't happen in normal flow but keeping for completeness)
              await storage.updateUserPoints(swap.ownerId, owner.points + Math.abs(swap.pointsDifference));
              await storage.updateUserPoints(swap.requesterId, requester.points - Math.abs(swap.pointsDifference));
            }
          }
          // If swap.requesterItemId exists, it's an item-for-item swap, so no point transfer needed

          // Return contact details for both users when swap is accepted
          res.json({
            ...updatedSwap,
            contactDetails: {
              requester: {
                name: `${requester.firstName} ${requester.lastName}`,
                email: requester.email,
                phoneNumber: requester.phoneNumber,
                username: requester.username
              },
              owner: {
                name: `${owner.firstName} ${owner.lastName}`,
                email: owner.email,
                phoneNumber: owner.phoneNumber,
                username: owner.username
              }
            }
          });
          return;
        }
      }

      res.json(updatedSwap);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Admin routes
  app.get("/api/admin/pending-items", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const pendingItems = await storage.getPendingItems();
      res.json(pendingItems);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.patch("/api/admin/items/:id/approve", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.approveItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ message: "Item approved" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/admin/items/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.rejectItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json({ message: "Item rejected" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/users/:id/suspend", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { months, days, hours } = req.body;
      
      // Calculate suspension end date
      const now = new Date();
      const suspendedUntil = new Date(now.getTime() + 
        (months * 30 * 24 * 60 * 60 * 1000) + 
        (days * 24 * 60 * 60 * 1000) + 
        (hours * 60 * 60 * 1000)
      );
      
      const success = await storage.suspendUser(userId, suspendedUntil);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User suspended successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/users/:id/cancel-suspension", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.cancelSuspension(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Suspension cancelled successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/admin/users/:id/ban", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.banUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User banned successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
