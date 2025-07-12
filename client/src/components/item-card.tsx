import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { ShoppingCart, Check } from "lucide-react";
import { addToCart, isInCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { isAuthenticated } from "@/lib/auth";
import type { Item } from "@shared/schema";

interface ItemCardProps {
  item: Item & { username?: string };
}

const conditionColors = {
  excellent: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
};

export default function ItemCard({ item }: ItemCardProps) {
  const { toast } = useToast();
  const inCart = isInCart(item.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated()) {
      window.location.href = '/login';
      return;
    }

    if (addToCart(item)) {
      toast({
        title: "Added to cart",
        description: `${item.title} has been added to your cart.`,
      });
    } else {
      toast({
        title: "Already in cart",
        description: "This item is already in your cart.",
        variant: "destructive",
      });
    }
  };

  return (
    <Link href={`/item/${item.id}`} className="block">
      <Card className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer h-full flex flex-col">
        <div className="relative">
          {item.imageUrls?.[0] ? (
            <img 
              src={item.imageUrls[0]} 
              alt={item.title}
              className="w-full h-64 object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-64 bg-light-gray flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>
        
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <Badge className={`${conditionColors[item.condition]} text-xs font-medium`}>
              {item.condition}
            </Badge>
            <span className="text-dusty-rose font-semibold">{item.value} pts</span>
          </div>
          
          <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1" title={item.title}>
            {item.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-1" title={item.description}>
            {item.description}
          </p>
          
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-soft-pink text-xs">
                  {item.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-gray-600 truncate" title={item.username || 'User'}>
                {item.username || 'User'}
              </span>
            </div>
            
            <Button 
              onClick={handleAddToCart}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 ml-2 ${
                inCart 
                  ? "bg-green-600 hover:bg-green-700 text-white cursor-not-allowed" 
                  : "bg-dusty-rose hover:bg-dusty-rose/90 text-light-gray"
              }`}
              disabled={inCart}
            >
              {inCart ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  In Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
