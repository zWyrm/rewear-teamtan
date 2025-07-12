import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { User, Plus, Search, Menu, ChevronDown, ShoppingBag } from "lucide-react";
import { getAuthUser, isAuthenticated, removeAuthToken, isAdmin } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [location, setLocation] = useLocation();
  const user = getAuthUser();
  const authenticated = isAuthenticated();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (authenticated) {
      setCartCount(getCartCount());
    } else {
      setCartCount(0);
    }
  }, [authenticated, location]);

  useEffect(() => {
    const handleCartUpdate = () => {
      if (authenticated) {
        setCartCount(getCartCount());
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [authenticated]);

  const handleLogout = () => {
    removeAuthToken();
    setLocation("/");
    // Force page reload to clear any cached user state
    window.location.reload();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bebas text-dusty-rose tracking-wide cursor-pointer">
                  ReWear
                </h1>
              </Link>
            </div>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-8">
                <Link href="/" className="text-gray-700 hover:text-dusty-rose px-3 py-2 text-sm font-medium transition-colors">
                  Home
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="text-gray-700 hover:text-dusty-rose px-3 py-2 text-sm font-medium transition-colors flex items-center">
                    Categories
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/shop?category=tops" className="w-full">
                        Tops
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/shop?category=dresses" className="w-full">
                        Dresses
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/shop?category=bottoms" className="w-full">
                        Bottoms
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/shop?category=outerwear" className="w-full">
                        Outerwear
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/shop?category=shoes" className="w-full">
                        Shoes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/shop?category=accessories" className="w-full">
                        Accessories
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/shop" className="w-full">
                        View All Categories
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-700 hover:text-dusty-rose"
              onClick={() => {
                setLocation("/shop");
                // Focus on search input after navigation
                setTimeout(() => {
                  const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }, 100);
              }}
            >
              <Search className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-700 hover:text-dusty-rose relative group"
              onClick={() => {
                if (authenticated) {
                  setLocation("/cart");
                } else {
                  setLocation("/login");
                }
              }}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#fbd76a] text-gray-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium group-hover:opacity-0 transition-opacity">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Button>
            
            {authenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-700 hover:text-dusty-rose">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {user?.username}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-gray-500">
                    {user?.points} points
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="w-full">
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  
                  {isAdmin() && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="w-full">
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-gray-700 hover:text-dusty-rose">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium text-gray-700">
                    Guest User
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="w-full">
                      Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/register" className="w-full">
                      Register
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button variant="ghost" size="icon" className="md:hidden text-gray-700">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
