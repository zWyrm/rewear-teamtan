import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, ArrowUpDown, CheckCircle, X } from "lucide-react";
import Navbar from "@/components/navbar";
import { getAuthUser, getAuthHeaders, isAuthenticated } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Item, Swap } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const user = getAuthUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/login");
    }
  }, [setLocation]);

  const { data: myItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/my-items"],
    enabled: isAuthenticated(),
  });

  const { data: swapsData, isLoading: swapsLoading } = useQuery({
    queryKey: ["/api/my-swaps"],
    enabled: isAuthenticated(),
  });

  const swapMutation = useMutation({
    mutationFn: async ({ swapId, status }: { swapId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/swaps/${swapId}`, { status });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-swaps"] });
      
      if (variables.status === 'accepted' && data.contactDetails) {
        // Show contact details for both users
        const { requester, owner } = data.contactDetails;
        const otherUser = data.requesterId === user?.id ? owner : requester;
        const userType = data.requesterId === user?.id ? 'requester' : 'owner';
        
        toast({
          title: "Swap Accepted! 🎉",
          description: `Contact ${otherUser.name}: ${otherUser.email} | ${otherUser.phoneNumber}. They have your contact details too.`,
          duration: 15000, // Show for 15 seconds so user can read contact info
        });
      } else {
        toast({
          title: "Swap Updated",
          description: `Swap request ${variables.status === 'accepted' ? 'accepted' : 'declined'} successfully.`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update swap request.",
        variant: "destructive",
      });
    },
  });

  const handleSwapAction = (swapId: number, status: 'accepted' | 'declined') => {
    swapMutation.mutate({ swapId, status });
  };

  if (!user) {
    return null;
  }

  const pendingSwaps = swapsData?.received?.filter((swap: Swap) => swap.status === 'pending') || [];
  const recentSwaps = [...(swapsData?.requested || []), ...(swapsData?.received || [])].filter((swap: Swap) => swap.status !== 'pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-light-gray">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#ffffff]">
        {/* User Header */}
        <div className="mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20 border-4 border-dusty-rose">
                  <AvatarFallback className="bg-dusty-rose text-light-gray text-xl font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bebas text-dusty-rose mb-2">Welcome back, {user.username}!</h1>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Points Balance:</span>
                      <span className="ml-2 text-2xl font-bold text-dusty-rose">{user.points}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Link href="/add-item">
                    <Button 
                      variant="outline"
                      className="border border-dusty-rose hover:bg-gray-100 hover:border-dusty-rose/80 text-dusty-rose font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      + List a Item
                    </Button>
                  </Link>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* My Listings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bebas text-dusty-rose flex items-center gap-2">
                <Package className="w-6 h-6" />
                MY LISTINGS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : myItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">You haven't listed any items yet. Use the "List New Item" button above to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myItems.slice(0, 4).map((item: Item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-warm-beige rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0">
                        {item.imageUrls?.[0] && (
                          <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={item.isApproved ? "default" : "secondary"} className="text-xs">
                            {item.isApproved ? "Approved" : "Pending"}
                          </Badge>
                          <span className="text-sm text-dusty-rose font-medium">{item.pointValue} pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Swap Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bebas text-dusty-rose flex items-center gap-2">
                <ArrowUpDown className="w-6 h-6" />
                SWAP REQUESTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {swapsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : pendingSwaps.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowUpDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending swap requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingSwaps.map((swap: Swap) => (
                    <div key={swap.id} className="p-3 bg-soft-pink/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">Swap Request</p>
                          <p className="text-sm text-gray-600">
                            {swap.pointsDifference !== 0 && (
                              <span>Points difference: {Math.abs(swap.pointsDifference)}</span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 text-light-gray"
                            onClick={() => handleSwapAction(swap.id, 'accepted')}
                            disabled={swapMutation.isPending}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSwapAction(swap.id, 'declined')}
                            disabled={swapMutation.isPending}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bebas text-dusty-rose flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              RECENT ACTIVITY
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSwaps.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No swap activity yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSwaps.slice(0, 5).map((swap: Swap) => {

                  const isRequester = swap.requesterId === user?.id;
                  const swapStatus = swap.status;
                  const statusColors = {
                    accepted: 'bg-green-50 text-green-700',
                    declined: 'bg-red-50 text-red-700',
                    completed: 'bg-blue-50 text-blue-700'
                  };
                  
                  return (
                    <div key={swap.id} className={`p-3 rounded-lg ${statusColors[swapStatus as keyof typeof statusColors]}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {swapStatus === 'accepted' && isRequester && 'Your swap request was accepted!'}
                            {swapStatus === 'accepted' && !isRequester && 'You accepted a swap request'}
                            {swapStatus === 'declined' && isRequester && 'Your swap request was declined'}
                            {swapStatus === 'declined' && !isRequester && 'You declined a swap request'}
                            {swapStatus === 'completed' && 'Swap completed'}
                          </p>
                          
                          {/* Item details with clickable links */}
                          <div className="text-sm mt-1 space-y-1">
                            {(swap as any).ownerItem && (
                              <p>
                                <span className="opacity-75">Item: </span>
                                <Link 
                                  href={`/item/${(swap as any).ownerItem.id}`}
                                  className="text-dusty-rose hover:text-dusty-rose/80 font-medium underline"
                                >
                                  {(swap as any).ownerItem.title}
                                </Link>
                              </p>
                            )}
                            {(swap as any).requesterItem && (
                              <p>
                                <span className="opacity-75">Traded for: </span>
                                <Link 
                                  href={`/item/${(swap as any).requesterItem.id}`}
                                  className="text-dusty-rose hover:text-dusty-rose/80 font-medium underline"
                                >
                                  {(swap as any).requesterItem.title}
                                </Link>
                              </p>
                            )}
                          </div>
                          
                          <p className="text-sm opacity-75 mt-2">
                            {new Date(swap.createdAt).toLocaleDateString()} at {new Date(swap.createdAt).toLocaleTimeString()}
                          </p>
                          {swapStatus === 'accepted' && (swap as any).otherUserContact && (
                            <div className="mt-2 p-2 bg-white/50 rounded text-sm">
                              <p className="font-medium mb-1">Contact Details:</p>
                              <div className="space-y-1">
                                <p><span className="font-medium">Name:</span> {(swap as any).otherUserContact.name}</p>
                                <p><span className="font-medium">Email:</span> {(swap as any).otherUserContact.email}</p>
                                <p><span className="font-medium">Phone:</span> {(swap as any).otherUserContact.phoneNumber}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          {swapStatus === 'accepted' && <CheckCircle className="w-6 h-6 text-green-600" />}
                          {swapStatus === 'declined' && <X className="w-6 h-6 text-red-600" />}
                          {swapStatus === 'completed' && <CheckCircle className="w-6 h-6 text-blue-600" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
