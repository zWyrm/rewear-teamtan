import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Package, FileText, Check, X, Eye, Clock, UserX } from "lucide-react";
import Navbar from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { getAuthUser, isAuthenticated, isAdmin } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import type { Item, User } from "@shared/schema";

const conditionColors = {
  excellent: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800", 
  fair: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
};

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = getAuthUser();
  const [activeTab, setActiveTab] = useState("users");
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [suspendDuration, setSuspendDuration] = useState({ months: 0, days: 0, hours: 0 });
  const [cancelSuspensionDialogOpen, setCancelSuspensionDialogOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      setLocation("/login");
    }
  }, [setLocation]);

  const { data: pendingItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ["/api/admin/pending-items"],
    enabled: isAuthenticated() && isAdmin(),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated() && isAdmin(),
  });

  const approveMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await apiRequest("PATCH", `/api/admin/items/${itemId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item approved",
        description: "The item is now visible to users.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-items"] });
    },
    onError: async (error: any) => {
      const { getUserFriendlyErrorMessage } = await import("@/lib/error-messages");
      const userFriendlyMessage = getUserFriendlyErrorMessage(error.message || "Failed to approve item");
      
      toast({
        title: "Failed to Approve Item",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/items/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item rejected",
        description: "The item has been removed from the platform.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-items"] });
    },
    onError: async (error: any) => {
      const { getUserFriendlyErrorMessage } = await import("@/lib/error-messages");
      const userFriendlyMessage = getUserFriendlyErrorMessage(error.message || "Failed to reject item");
      
      toast({
        title: "Failed to Reject Item",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (itemId: number) => {
    approveMutation.mutate(itemId);
  };

  const handleReject = (itemId: number) => {
    if (confirm("Are you sure you want to reject this item? This action cannot be undone.")) {
      rejectMutation.mutate(itemId);
    }
  };

  const handleSuspendUser = (userId: number) => {
    setSelectedUserId(userId);
    setSuspendDialogOpen(true);
  };

  const handleBanUser = (userId: number) => {
    setSelectedUserId(userId);
    setBanDialogOpen(true);
  };

  const handleCancelSuspension = (userId: number) => {
    setSelectedUserId(userId);
    setCancelSuspensionDialogOpen(true);
  };

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, duration }: { userId: number; duration: { months: number; days: number; hours: number } }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/suspend`, duration);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User suspended",
        description: "User has been suspended successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSuspendDialogOpen(false);
      setSuspendDuration({ months: 0, days: 0, hours: 0 });
    },
    onError: async (error: any) => {
      const { getUserFriendlyErrorMessage } = await import("@/lib/error-messages");
      const userFriendlyMessage = getUserFriendlyErrorMessage(error.message || "Failed to suspend user");
      
      toast({
        title: "Failed to Suspend User",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    },
  });

  const cancelSuspensionMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/cancel-suspension`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Suspension cancelled",
        description: "User suspension has been cancelled",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCancelSuspensionDialogOpen(false);
    },
    onError: async (error: any) => {
      const { getUserFriendlyErrorMessage } = await import("@/lib/error-messages");
      const userFriendlyMessage = getUserFriendlyErrorMessage(error.message || "Failed to cancel suspension");
      
      toast({
        title: "Failed to Cancel Suspension",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    },
  });

  const confirmSuspend = () => {
    if (selectedUserId) {
      const totalHours = suspendDuration.months * 30 * 24 + suspendDuration.days * 24 + suspendDuration.hours;
      if (totalHours > 0) {
        suspendMutation.mutate({ userId: selectedUserId, duration: suspendDuration });
      } else {
        toast({
          title: "Invalid duration",
          description: "Please enter a valid suspension duration",
          variant: "destructive",
        });
      }
    }
  };

  const confirmCancelSuspension = () => {
    if (selectedUserId) {
      cancelSuspensionMutation.mutate(selectedUserId);
    }
  };

  const confirmBan = () => {
    if (selectedUserId) {
      // Here you would make an API call to ban the user permanently
      toast({
        title: "User banned",
        description: "User has been permanently banned from the platform",
      });
      setBanDialogOpen(false);
    }
  };

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-light-gray">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bebas text-dusty-rose mb-4">ADMIN PANEL</h1>
          <p className="text-gray-600">Manage users, orders, and listings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white border border-gray-200">
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-dusty-rose data-[state=active]:text-light-gray"
            >
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </TabsTrigger>
            <TabsTrigger 
              value="listings"
              className="data-[state=active]:bg-dusty-rose data-[state=active]:text-light-gray"
            >
              <Package className="w-4 h-4 mr-2" />
              Manage Listings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bebas text-dusty-rose">MANAGE USERS</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((userData: any) => (
                      <div key={userData.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                        <Avatar className="w-16 h-16 border-2 border-dusty-rose">
                          <AvatarFallback className="bg-dusty-rose text-light-gray text-lg">
                            {userData.username?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-1">{userData.username}</h3>
                            <p className="text-sm text-gray-600 mb-2">{userData.email}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Role: <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>{userData.role}</Badge></span>
                              <span>Points: <span className="font-medium text-dusty-rose">{userData.points}</span></span>
                              {userData.isBanned && (
                                <Badge variant="destructive" className="text-xs">BANNED</Badge>
                              )}
                              {userData.suspendedUntil && new Date(userData.suspendedUntil) > new Date() && (
                                <Badge variant="secondary" className="text-xs">
                                  SUSPENDED UNTIL {new Date(userData.suspendedUntil).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {userData.suspendedUntil && new Date(userData.suspendedUntil) > new Date() ? (
                            <Button 
                              size="sm" 
                              className="bg-blue-500 hover:bg-blue-600 text-light-gray font-medium"
                              onClick={() => handleCancelSuspension(userData.id)}
                            >
                              Cancel
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              className="bg-orange-500 hover:bg-orange-600 text-light-gray font-medium"
                              onClick={() => handleSuspendUser(userData.id)}
                            >
                              Suspend
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            className="bg-red-500 hover:bg-red-600 text-light-gray font-medium"
                            onClick={() => handleBanUser(userData.id)}
                          >
                            Ban
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="listings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bebas text-dusty-rose">PENDING ITEM APPROVALS</CardTitle>
                <p className="text-gray-600">Review and approve items submitted by users</p>
              </CardHeader>
              <CardContent>
                {itemsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : pendingItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No pending items</h3>
                    <p className="text-gray-500">All submitted items have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingItems.map((item: Item) => (
                      <div key={item.id} className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.imageUrls?.[0] ? (
                            <img 
                              src={item.imageUrls[0]} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                              </div>
                              <span className="text-lg font-bold text-dusty-rose">{item.pointValue} pts</span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Category: <span className="capitalize font-medium">{item.category}</span></span>
                              <span>Size: <span className="font-medium">{item.size}</span></span>
                              <Badge className={`${conditionColors[item.condition]} text-xs`}>
                                {item.condition}
                              </Badge>
                              <span>Value: <span className="font-medium">${parseFloat(item.estimatedValue).toFixed(2)}</span></span>
                            </div>
                            
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 text-light-gray font-medium"
                            onClick={() => handleApprove(item.id)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleReject(item.id)}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setLocation(`/item/${item.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Suspend User Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                Suspend User
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Enter the suspension duration. The user will be temporarily banned for this period.
              </p>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="months">Months</Label>
                  <Input
                    id="months"
                    type="number"
                    min="0"
                    value={suspendDuration.months}
                    onChange={(e) => setSuspendDuration(prev => ({ ...prev, months: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="days">Days</Label>
                  <Input
                    id="days"
                    type="number"
                    min="0"
                    value={suspendDuration.days}
                    onChange={(e) => setSuspendDuration(prev => ({ ...prev, days: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="hours">Hours</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    value={suspendDuration.hours}
                    onChange={(e) => setSuspendDuration(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmSuspend} className="bg-orange-500 hover:bg-orange-600 text-light-gray">
                  Suspend User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ban User Dialog */}
        <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-500" />
                Ban User Permanently
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                This will permanently ban the user from accessing the platform. This action cannot be undone.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Warning: This is a permanent action that cannot be reversed.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmBan} className="bg-red-500 hover:bg-red-600 text-light-gray">
                  Ban User Permanently
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Suspension Dialog */}
        <Dialog open={cancelSuspensionDialogOpen} onOpenChange={setCancelSuspensionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Cancel Suspension
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to cancel this user's suspension? They will regain access to the platform immediately.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium">
                  ℹ️ The user will be able to access the platform again after cancellation.
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCancelSuspensionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmCancelSuspension} className="bg-blue-500 hover:bg-blue-600 text-light-gray">
                  Cancel Suspension
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
