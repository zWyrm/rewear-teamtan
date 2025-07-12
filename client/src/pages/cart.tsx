import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, ShoppingBag } from "lucide-react";
import Navbar from "@/components/navbar";
import { isAuthenticated, getAuthUser } from "@/lib/auth";
import AuthGuard from "@/components/auth-guard";
import { getCartItems, removeFromCart, clearCart } from "@/lib/cart";

export default function Cart() {
  const [cartItems, setCartItems] = useState(getCartItems());

  useEffect(() => {
    setCartItems(getCartItems());
  }, []);

  useEffect(() => {
    const handleCartUpdate = () => {
      setCartItems(getCartItems());
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const handleRemoveFromCart = (itemId: number) => {
    removeFromCart(itemId);
    setCartItems(getCartItems());
  };

  const handleClearCart = () => {
    clearCart();
    setCartItems([]);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-light-gray">
        <Navbar />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bebas text-dusty-rose">MY CART</h1>
            {cartItems.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                Clear Cart
              </Button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="pt-6">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Browse items and add them to your cart to get started</p>
                <Link href="/shop">
                  <Button className="bg-dusty-rose hover:bg-dusty-rose/90 text-light-gray">
                    Browse Items
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item: any) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {item.imageUrls?.[0] ? (
                        <img 
                          src={item.imageUrls[0]} 
                          alt={item.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {item.condition}
                          </Badge>
                          <span className="text-dusty-rose font-semibold">{item.value} pts</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Link href={`/item/${item.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-[#b91c1c]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="bg-white mt-6">
                <CardHeader>
                  <CardTitle className="text-dusty-rose">Cart Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-medium">Total Items:</span>
                    <span>{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-medium">Total Value:</span>
                    <span className="text-dusty-rose font-semibold">
                      {cartItems.reduce((total: number, item: any) => total + item.value, 0)} pts
                    </span>
                  </div>
                  <Button className="w-full bg-dusty-rose hover:bg-dusty-rose/90 text-light-gray">
                    Proceed to Checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}