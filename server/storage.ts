import { users, items, swaps, type User, type InsertUser, type Item, type InsertItem, type Swap, type InsertSwap } from "@shared/schema";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(userId: number, points: number): Promise<void>;

  // Item methods
  getItem(id: number): Promise<(Item & { owner?: { username: string; createdAt: Date } }) | undefined>;
  getItems(filters?: { category?: string; userId?: number; isApproved?: boolean; isAvailable?: boolean }): Promise<Item[]>;
  createItem(item: InsertItem & { userId: number }): Promise<Item>;
  updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;

  // Swap methods
  getSwap(id: number): Promise<Swap | undefined>;
  getSwaps(filters?: { requesterId?: number; ownerId?: number; status?: string }): Promise<Swap[]>;
  createSwap(swap: InsertSwap): Promise<Swap>;
  updateSwap(id: number, updates: Partial<Swap>): Promise<Swap | undefined>;

  // Admin methods
  getPendingItems(): Promise<Item[]>;
  approveItem(id: number): Promise<boolean>;
  rejectItem(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  suspendUser(userId: number, suspendedUntil: Date): Promise<boolean>;
  cancelSuspension(userId: number): Promise<boolean>;
  banUser(userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private items: Map<number, Item>;
  private swaps: Map<number, Swap>;
  private currentUserId: number;
  private currentItemId: number;
  private currentSwapId: number;

  constructor() {
    this.users = new Map();
    this.items = new Map();
    this.swaps = new Map();
    this.currentUserId = 1;
    this.currentItemId = 1;
    this.currentSwapId = 1;

    // Create admin user
    this.users.set(1, {
      id: 1,
      username: "admin",
      email: "admin@rewear.com",
      firstName: "Admin",
      lastName: "User",
      phoneNumber: null,
      password: "$2b$10$P5/3SS2zzrDAwWsD/wsM4uXoJm5riC68NoW4djZz6miG58CyFZOW6",
      googleId: null,
      role: "admin",
      points: 0,
      suspendedUntil: null,
      isBanned: false,
      createdAt: new Date(),
    });

    // Create sample user
    this.users.set(2, {
      id: 2,
      username: "sarah_fashion",
      email: "sarah@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      phoneNumber: null,
      password: "$2b$10$xMuxRX3QQsVaba4hMpaxDu/rIRY33YnxBwIwdxrmodRkgmknh9EV.",
      googleId: null,
      role: "user",
      points: 150,
      suspendedUntil: null,
      isBanned: false,
      createdAt: new Date(),
    });

    this.currentUserId = 3;

    // Add sample approved items
    this.items.set(1, {
      id: 1,
      title: "Vintage Denim Jacket",
      description: "Classic blue denim jacket in excellent condition. Perfect for layering.",
      category: "outerwear",
      condition: "excellent",
      size: "M",
      imageUrls: [],
      tags: ["vintage", "denim", "classic"],
      value: 1200,
      isApproved: true,
      isAvailable: true,
      userId: 2,
      createdAt: new Date(),
    });

    this.items.set(2, {
      id: 2,
      title: "Floral Summer Dress",
      description: "Beautiful floral print summer dress, worn only twice.",
      category: "dresses",
      condition: "good",
      size: "S",
      imageUrls: [],
      tags: ["floral", "summer", "casual"],
      value: 800,
      isApproved: true,
      isAvailable: true,
      userId: 2,
      createdAt: new Date(),
    });

    this.items.set(3, {
      id: 3,
      title: "Designer Leather Handbag",
      description: "Authentic designer leather handbag with gold hardware.",
      category: "accessories",
      condition: "excellent",
      size: "One Size",
      imageUrls: [],
      tags: ["designer", "leather", "luxury"],
      value: 2500,
      isApproved: true,
      isAvailable: true,
      userId: 2,
      createdAt: new Date(),
    });

    this.items.set(4, {
      id: 4,
      title: "High-Waisted Jeans",
      description: "Trendy high-waisted jeans in dark wash, very comfortable.",
      category: "bottoms",
      condition: "good",
      size: "28",
      imageUrls: [],
      tags: ["jeans", "high-waisted", "trendy"],
      value: 600,
      isApproved: true,
      isAvailable: true,
      userId: 2,
      createdAt: new Date(),
    });

    this.currentItemId = 5;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => 
      user.username === usernameOrEmail || user.email === usernameOrEmail
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      phoneNumber: insertUser.phoneNumber || null,
      password: insertUser.password || null,
      googleId: insertUser.googleId || null,
      role: "user",
      points: 0,
      suspendedUntil: null,
      isBanned: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPoints(userId: number, points: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.points = points;
      this.users.set(userId, user);
    }
  }

  async getItem(id: number): Promise<(Item & { owner?: { username: string; createdAt: Date } }) | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    
    const owner = this.users.get(item.userId);
    return {
      ...item,
      owner: owner ? {
        username: owner.username,
        createdAt: owner.createdAt,
      } : undefined,
    };
  }

  async getItems(filters?: { category?: string; userId?: number; isApproved?: boolean; isAvailable?: boolean }): Promise<Item[]> {
    let allItems = Array.from(this.items.values());
    
    if (filters) {
      if (filters.category) {
        allItems = allItems.filter(item => item.category === filters.category);
      }
      if (filters.userId !== undefined) {
        allItems = allItems.filter(item => item.userId === filters.userId);
      }
      if (filters.isApproved !== undefined) {
        allItems = allItems.filter(item => item.isApproved === filters.isApproved);
      }
      if (filters.isAvailable !== undefined) {
        allItems = allItems.filter(item => item.isAvailable === filters.isAvailable);
      }
    }
    
    return allItems;
  }

  async createItem(item: InsertItem & { userId: number }): Promise<Item> {
    const id = this.currentItemId++;
    const newItem: Item = {
      ...item,
      id,
      imageUrls: item.imageUrls || [],
      tags: item.tags || [],
      isApproved: false,
      isAvailable: true,
      createdAt: new Date(),
    };
    this.items.set(id, newItem);
    return newItem;
  }

  async updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (item) {
      const updatedItem = { ...item, ...updates };
      this.items.set(id, updatedItem);
      return updatedItem;
    }
    return undefined;
  }

  async deleteItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  async getSwap(id: number): Promise<Swap | undefined> {
    return this.swaps.get(id);
  }

  async getSwaps(filters?: { requesterId?: number; ownerId?: number; status?: string }): Promise<Swap[]> {
    let allSwaps = Array.from(this.swaps.values());
    
    if (filters) {
      if (filters.requesterId !== undefined) {
        allSwaps = allSwaps.filter(swap => swap.requesterId === filters.requesterId);
      }
      if (filters.ownerId !== undefined) {
        allSwaps = allSwaps.filter(swap => swap.ownerId === filters.ownerId);
      }
      if (filters.status) {
        allSwaps = allSwaps.filter(swap => swap.status === filters.status);
      }
    }
    
    return allSwaps;
  }

  async createSwap(swap: InsertSwap): Promise<Swap> {
    const id = this.currentSwapId++;
    const newSwap: Swap = {
      id,
      requesterId: swap.requesterId,
      ownerId: swap.ownerId,
      requesterItemId: swap.requesterItemId || null,
      ownerItemId: swap.ownerItemId,
      pointsDifference: swap.pointsDifference || 0,
      status: swap.status || 'pending',
      message: swap.message || null,
      createdAt: new Date(),
    };
    this.swaps.set(id, newSwap);
    return newSwap;
  }

  async updateSwap(id: number, updates: Partial<Swap>): Promise<Swap | undefined> {
    const swap = this.swaps.get(id);
    if (swap) {
      const updatedSwap = { ...swap, ...updates };
      this.swaps.set(id, updatedSwap);
      return updatedSwap;
    }
    return undefined;
  }

  async getPendingItems(): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => !item.isApproved);
  }

  async approveItem(id: number): Promise<boolean> {
    const item = this.items.get(id);
    if (item) {
      item.isApproved = true;
      this.items.set(id, item);
      return true;
    }
    return false;
  }

  async rejectItem(id: number): Promise<boolean> {
    return this.items.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async suspendUser(userId: number, suspendedUntil: Date): Promise<boolean> {
    const user = this.users.get(userId);
    if (user) {
      user.suspendedUntil = suspendedUntil;
      this.users.set(userId, user);
      return true;
    }
    return false;
  }

  async cancelSuspension(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (user) {
      user.suspendedUntil = null;
      this.users.set(userId, user);
      return true;
    }
    return false;
  }

  async banUser(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    if (user) {
      user.isBanned = true;
      this.users.set(userId, user);
      return true;
    }
    return false;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsernameOrEmail(usernameOrEmail: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail))
    );
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserPoints(userId: number, points: number): Promise<void> {
    await db
      .update(users)
      .set({ points })
      .where(eq(users.id, userId));
  }

  async getItem(id: number): Promise<(Item & { owner?: { username: string; createdAt: Date } }) | undefined> {
    const [result] = await db
      .select({
        id: items.id,
        title: items.title,
        description: items.description,
        category: items.category,
        condition: items.condition,
        size: items.size,
        value: items.value,
        imageUrls: items.imageUrls,
        tags: items.tags,
        userId: items.userId,
        isApproved: items.isApproved,
        isAvailable: items.isAvailable,
        createdAt: items.createdAt,
        ownerUsername: users.username,
        ownerCreatedAt: users.createdAt,
      })
      .from(items)
      .leftJoin(users, eq(items.userId, users.id))
      .where(eq(items.id, id));
    
    if (!result) return undefined;
    
    return {
      id: result.id,
      title: result.title,
      description: result.description,
      category: result.category,
      condition: result.condition,
      size: result.size,
      value: result.value,
      imageUrls: result.imageUrls,
      tags: result.tags,
      userId: result.userId,
      isApproved: result.isApproved,
      isAvailable: result.isAvailable,
      createdAt: result.createdAt,
      owner: result.ownerUsername ? {
        username: result.ownerUsername,
        createdAt: result.ownerCreatedAt!,
      } : undefined,
    };
  }

  async getItems(filters?: { category?: string; userId?: number; isApproved?: boolean; isAvailable?: boolean }): Promise<Item[]> {
    let query = db.select().from(items);
    
    if (filters) {
      const conditions = [];
      if (filters.category) {
        conditions.push(eq(items.category, filters.category as any));
      }
      if (filters.userId !== undefined) {
        conditions.push(eq(items.userId, filters.userId));
      }
      if (filters.isApproved !== undefined) {
        conditions.push(eq(items.isApproved, filters.isApproved));
      }
      if (filters.isAvailable !== undefined) {
        conditions.push(eq(items.isAvailable, filters.isAvailable));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query;
  }

  async createItem(item: InsertItem & { userId: number }): Promise<Item> {
    const [newItem] = await db
      .insert(items)
      .values({
        ...item,
        imageUrls: item.imageUrls || [],
        tags: item.tags || [],
        isApproved: false,
        isAvailable: true,
      })
      .returning();
    return newItem;
  }

  async updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined> {
    const [updatedItem] = await db
      .update(items)
      .set(updates)
      .where(eq(items.id, id))
      .returning();
    return updatedItem || undefined;
  }

  async deleteItem(id: number): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getSwap(id: number): Promise<Swap | undefined> {
    const [swap] = await db.select().from(swaps).where(eq(swaps.id, id));
    return swap || undefined;
  }

  async getSwaps(filters?: { requesterId?: number; ownerId?: number; status?: string }): Promise<Swap[]> {
    let query = db.select().from(swaps);
    
    if (filters) {
      const conditions = [];
      if (filters.requesterId !== undefined) {
        conditions.push(eq(swaps.requesterId, filters.requesterId));
      }
      if (filters.ownerId !== undefined) {
        conditions.push(eq(swaps.ownerId, filters.ownerId));
      }
      if (filters.status) {
        conditions.push(eq(swaps.status, filters.status as any));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
    }
    
    return await query;
  }

  async createSwap(swap: InsertSwap): Promise<Swap> {
    const [newSwap] = await db
      .insert(swaps)
      .values(swap)
      .returning();
    return newSwap;
  }

  async updateSwap(id: number, updates: Partial<Swap>): Promise<Swap | undefined> {
    const [updatedSwap] = await db
      .update(swaps)
      .set(updates)
      .where(eq(swaps.id, id))
      .returning();
    return updatedSwap || undefined;
  }

  async getPendingItems(): Promise<Item[]> {
    return await db
      .select()
      .from(items)
      .where(eq(items.isApproved, false));
  }

  async approveItem(id: number): Promise<boolean> {
    const result = await db
      .update(items)
      .set({ isApproved: true })
      .where(eq(items.id, id));
    return (result.rowCount || 0) > 0;
  }

  async rejectItem(id: number): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async suspendUser(userId: number, suspendedUntil: Date): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ suspendedUntil })
      .where(eq(users.id, userId));
    return (result.rowCount || 0) > 0;
  }

  async cancelSuspension(userId: number): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ suspendedUntil: null })
      .where(eq(users.id, userId));
    return (result.rowCount || 0) > 0;
  }

  async banUser(userId: number): Promise<boolean> {
    const result = await db
      .update(users)
      .set({ isBanned: true })
      .where(eq(users.id, userId));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();

// Initialize database with seed data
import { seedDatabase } from './seed';
seedDatabase();
