import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Heart, Share2, ShoppingCart, Check, X } from "lucide-react";
import Navbar from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { getAuthUser, isAuthenticated } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { addToCart, isInCart, removeFromCart } from "@/lib/cart";
import type { Item } from "@shared/schema";

const conditionColors = {
  excellent: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
};

export default function ItemDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getAuthUser();
  const [selectedImage, setSelectedImage] = useState(0);
  const [swapType, setSwapType] = useState<"item" | "points">("item");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [message, setMessage] = useState("");

  const { data: item, isLoading } = useQuery({
    queryKey: ["/api/items", id],
    enabled: !!id,
  });

  const { data: myItems = [] } = useQuery({
    queryKey: ["/api/my-items"],
    enabled: isAuthenticated(),
  });

  const swapMutation = useMutation({
    mutationFn: async (swapData: any) => {
      const response = await apiRequest("POST", "/api/swaps", swapData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Swap request sent",
        description: "The item owner will be notified of your request.",
      });
      setMessage("");
      setSelectedItemId("");
    },
    onError: async (error: any) => {
      const { getUserFriendlyErrorMessage } = await import("@/lib/error-messages");
      const userFriendlyMessage = getUserFriendlyErrorMessage(error.message || "Failed to send swap request");
      
      toast({
        title: "Failed to Send Swap Request",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    },
  });

  const handleSwapRequest = () => {
    if (!isAuthenticated()) {
      setLocation("/login");
      return;
    }

    if (!item) return;

    let swapData: any = {
      ownerItemId: parseInt(id!),
      message,
      pointsDifference: 0,
    };

    if (swapType === "item" && selectedItemId) {
      const myItem = myItems.find((i: Item) => i.id === parseInt(selectedItemId));
      if (myItem) {
        swapData.requesterItemId = parseInt(selectedItemId);
        swapData.pointsDifference = myItem.value - item.value;
      }
    } else if (swapType === "points") {
      swapData.pointsDifference = -item.value; // User pays points
    }

    swapMutation.mutate(swapData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-gray">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-light-gray">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bebas text-gray-500">Item not found</h1>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.userId;
  const inCart = isInCart(item.id);
  const availableItems = myItems.filter((i: Item) => i.isApproved && i.isAvailable && i.id !== item.id);

  const handleCartToggle = () => {
    if (!isAuthenticated()) {
      setLocation("/login");
      return;
    }

    if (inCart) {
      // Remove from cart
      removeFromCart(item.id);
      toast({
        title: "Removed from cart",
        description: `${item.title} has been removed from your cart.`,
      });
    } else {
      // Add to cart
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
    }
  };

  return (
    <div className="min-h-screen bg-light-gray">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#ffffff]">
        <Button
          variant="ghost"
          className="mb-6 text-dusty-rose hover:text-dusty-rose/80"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Browse
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
              {item.imageUrls?.[selectedImage] ? (
                <img
                  src={item.imageUrls[selectedImage]}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
            
            {item.imageUrls && item.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? "border-dusty-rose" : "border-gray-200"
                    }`}
                  >
                    <img src={url} alt={`${item.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge className={`${conditionColors[item.condition]} text-sm`}>
                    {item.condition}
                  </Badge>
                  <span className="text-2xl font-bold text-dusty-rose">{item.value} points</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={handleCartToggle}
                    className={inCart ? "text-red-600 hover:text-red-700" : "text-gray-700 hover:text-dusty-rose"}
                  >
                    {inCart ? <X className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <h1 className="text-3xl font-bebas text-dusty-rose mb-2">{item.title}</h1>
              <p className="text-gray-600 mb-4">{item.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Category:</span>
                  <span className="ml-2 capitalize">{item.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Size:</span>
                  <span className="ml-2">{item.size}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Value:</span>
                  <span className="ml-2">{item.value} points</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Condition:</span>
                  <span className="ml-2 capitalize">{item.condition}</span>
                </div>
              </div>

              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Owner Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-soft-pink">
                      {item.owner?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {item.owner?.username || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Member since {item.owner?.createdAt ? new Date(item.owner.createdAt).getFullYear() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Swap Options */}
            {!isOwner && !isAuthenticated() && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bebas text-dusty-rose">Interested in this item?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Sign in to your account to request a swap with this item owner.
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setLocation("/login")}
                      className="bg-dusty-rose hover:bg-dusty-rose/90 text-light-gray font-semibold"
                    >Login</Button>
                    <Button 
                      onClick={() => setLocation("/register")}
                      variant="outline"
                      className="border-dusty-rose text-dusty-rose hover:bg-dusty-rose/10"
                    >
                      Create Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isOwner && isAuthenticated() && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-bebas text-dusty-rose">Request a Swap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Swap Type</Label>
                    <Select value={swapType} onValueChange={(value: "item" | "points") => setSwapType(value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="item">Trade with my item</SelectItem>
                        <SelectItem value="points">Pay with points</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {swapType === "item" && (
                    <div>
                      <Label>Select your item to trade</Label>
                      <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose an item to trade" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableItems.map((myItem: Item) => (
                            <SelectItem key={myItem.id} value={myItem.id.toString()}>
                              {myItem.title} ({myItem.value} pts)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableItems.length === 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          You don't have any approved items to trade.{" "}
                          <Button variant="link" className="p-0 h-auto text-dusty-rose" onClick={() => setLocation("/add-item")}>
                            List an item
                          </Button>
                        </p>
                      )}
                    </div>
                  )}

                  {swapType === "points" && (
                    <div className="p-3 bg-golden-yellow/10 rounded-lg">
                      <p className="text-sm text-gray-700">
                        You'll pay <span className="font-bold text-dusty-rose">{item.value} points</span> for this item.
                        Your current balance: <span className="font-bold">{user?.points || 0} points</span>
                      </p>
                      {(user?.points || 0) < item.value && (
                        <p className="text-sm text-red-600 mt-2">You don't have enough points for this swap.</p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label>Message (optional)</Label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add a message to the item owner..."
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={handleSwapRequest}
                    disabled={
                      swapMutation.isPending ||
                      (swapType === "item" && !selectedItemId) ||
                      (swapType === "points" && (user?.points || 0) < item.value)
                    }
                    className="w-full bg-dusty-rose hover:bg-dusty-rose/90 text-light-gray font-semibold py-3"
                  >
                    {swapMutation.isPending ? "Sending Request..." : "Send Swap Request"}
                  </Button>
                </CardContent>
              </Card>
            )}

            
          </div>
        </div>
      </div>
    </div>
  );
}
