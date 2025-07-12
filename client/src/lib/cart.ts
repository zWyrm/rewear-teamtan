import { getAuthUser, isAuthenticated } from "./auth";
import type { Item } from "@shared/schema";

export function getCartItems(): Item[] {
  if (!isAuthenticated()) return [];
  const user = getAuthUser();
  if (!user) return [];
  
  try {
    const cartData = localStorage.getItem(`cart_${user.id}`);
    return cartData ? JSON.parse(cartData) : [];
  } catch {
    return [];
  }
}

export function addToCart(item: Item): boolean {
  if (!isAuthenticated()) return false;
  const user = getAuthUser();
  if (!user) return false;

  const cartItems = getCartItems();
  
  // Check if item is already in cart
  if (cartItems.find(cartItem => cartItem.id === item.id)) {
    return false; // Already in cart
  }

  const updatedCart = [...cartItems, item];
  localStorage.setItem(`cart_${user.id}`, JSON.stringify(updatedCart));
  
  // Dispatch custom event for cart update
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return true;
}

export function removeFromCart(itemId: number): void {
  if (!isAuthenticated()) return;
  const user = getAuthUser();
  if (!user) return;

  const cartItems = getCartItems();
  const updatedCart = cartItems.filter(item => item.id !== itemId);
  localStorage.setItem(`cart_${user.id}`, JSON.stringify(updatedCart));
  
  // Dispatch custom event for cart update
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

export function isInCart(itemId: number): boolean {
  const cartItems = getCartItems();
  return cartItems.some(item => item.id === itemId);
}

export function clearCart(): void {
  if (!isAuthenticated()) return;
  const user = getAuthUser();
  if (!user) return;
  
  localStorage.removeItem(`cart_${user.id}`);
  
  // Dispatch custom event for cart update
  window.dispatchEvent(new CustomEvent('cartUpdated'));
}

export function getCartCount(): number {
  return getCartItems().length;
}