import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, X } from "lucide-react";
import Navbar from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { insertItemSchema, type InsertItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isAuthenticated } from "@/lib/auth";

const categories = ["tops", "dresses", "bottoms", "outerwear", "shoes", "accessories"];
const conditions = ["excellent", "good", "fair", "poor"];

export default function AddItem() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/login");
    }
  }, [setLocation]);

  const form = useForm<InsertItem>({
    resolver: zodResolver(insertItemSchema),
    defaultValues: {
      title: "",
      description: "",
      category: undefined,
      condition: undefined,
      size: "",
      value: 0,
      imageUrls: [],
      tags: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertItem) => {
      const response = await apiRequest("POST", "/api/items", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Item listed successfully",
        description: "Your item is now pending admin approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-items"] });
      setLocation("/dashboard");
    },
    onError: async (error: any) => {
      const { getUserFriendlyErrorMessage } = await import("@/lib/error-messages");
      const userFriendlyMessage = getUserFriendlyErrorMessage(error.message || "Failed to list item");
      
      toast({
        title: "Failed to List Item",
        description: userFriendlyMessage,
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + imageFiles.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload a maximum of 5 images",
        variant: "destructive",
      });
      return;
    }

    const newImageUrls: string[] = [];
    const newImageFiles: File[] = [];

    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        // Convert to base64 data URL for persistent storage
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setImageUrls(prev => [...prev, dataUrl]);
        };
        reader.readAsDataURL(file);
        newImageFiles.push(file);
      }
    });

    setImageFiles(prev => [...prev, ...newImageFiles]);
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: InsertItem) => {
    mutation.mutate({
      ...data,
      value: data.value,
      imageUrls,
      tags,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-light-gray">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bebas text-dusty-rose">ADD NEW LISTING</CardTitle>
            <p className="text-gray-600">Share your pre-loved fashion with the community</p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Images Section */}
              <div className="space-y-4">
                <Label className="text-lg font-medium text-dusty-rose">Product Images</Label>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Product ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  
                  <label className="h-32 border-2 border-dashed border-gray-300 hover:border-golden-yellow bg-golden-yellow/10 hover:bg-golden-yellow/20 rounded-lg cursor-pointer flex items-center justify-center transition-colors">
                    <div className="text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-golden-yellow" />
                      <span className="text-sm text-gray-600">Upload Image</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      placeholder="e.g., Vintage Denim Jacket"
                      className="mt-1"
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => form.setValue("category", value as any)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.category && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <Select onValueChange={(value) => form.setValue("condition", value as any)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition.charAt(0).toUpperCase() + condition.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.condition && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.condition.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      {...form.register("size")}
                      placeholder="e.g., M, 32, 8.5"
                      className="mt-1"
                    />
                    {form.formState.errors.size && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.size.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="value">Point Value</Label>
                    <Input
                      id="value"
                      type="number"
                      {...form.register("value", { valueAsNumber: true })}
                      placeholder="100"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">How many points this item is worth</p>
                    {form.formState.errors.value && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.value.message}</p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register("description")}
                      placeholder="Describe the item's style, fit, materials, and any special details..."
                      className="mt-1 h-32"
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <Label>Tags</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                          {tag} <X className="w-3 h-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="bg-terracotta hover:bg-terracotta/90 text-light-gray px-8 py-3 font-semibold"
                >
                  {mutation.isPending ? "Saving..." : "Save & Publish"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
