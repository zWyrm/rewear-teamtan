import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import ItemCard from "@/components/item-card";
import Navbar from "@/components/navbar";
import { Search, Filter, ChevronDown } from "lucide-react";
import { type Item } from "@shared/schema";

export default function Shop() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const viewMode = "grid"; // Fixed to grid view only

  // Monitor URL changes with a more comprehensive approach
  useEffect(() => {
    const handleUrlChange = () => {
      // Use window.location.search to get query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const categoryFromUrl = urlParams.get('category');
      
      if (categoryFromUrl) {
        setSelectedCategory(categoryFromUrl);
        setSearchQuery(""); // Clear search when navigating to a category from URL
      } else if (location === '/shop') {
        // Reset to "all" if no category in URL and we're on shop page
        setSelectedCategory("all");
      }
    };

    // Initial load
    handleUrlChange();
    
    // Override the native pushState and replaceState to detect programmatic navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleUrlChange, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleUrlChange, 0);
    };
    
    // Listen for browser navigation
    window.addEventListener('popstate', handleUrlChange);
    
    // Also listen for focus events to catch URL changes when returning to tab
    window.addEventListener('focus', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('focus', handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [location]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/items"],
    queryFn: async () => {
      const response = await fetch("/api/items?approved=true&available=true");
      if (!response.ok) {
        throw new Error("Failed to fetch items");
      }
      return response.json();
    },
  });

  // Filter and sort items using useMemo for proper reactivity
  const sortedItems = useMemo(() => {
    // Filter items based on search and filters
    const filteredItems = items.filter((item: Item) => {
      const matchesSearch = searchQuery === "" || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesCondition = selectedCondition === "all" || item.condition === selectedCondition;
      
      return matchesSearch && matchesCategory && matchesCondition;
    });

    // Sort items
    return [...filteredItems].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.value - b.value;
        case "price-high":
          return b.value - a.value;
        case "name":
          return a.title.localeCompare(b.title);
        case "newest":
        default:
          // Use createdAt if available, fallback to ID
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return b.id - a.id;
      }
    });
  }, [items, searchQuery, selectedCategory, selectedCondition, sortBy]);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "tops", label: "Tops" },
    { value: "dresses", label: "Dresses" },
    { value: "bottoms", label: "Bottoms" },
    { value: "outerwear", label: "Outerwear" },
    { value: "shoes", label: "Shoes" },
    { value: "accessories", label: "Accessories" },
  ];

  const conditions = [
    { value: "all", label: "All Conditions" },
    { value: "excellent", label: "Excellent" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" },
  ];

  return (
    <div className="min-h-screen bg-light-gray">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-[#ffffff]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bebas text-dusty-rose">SHOP ITEMS</h1>
              <p className="text-gray-600 mt-1">
                {selectedCategory !== "all" ? `${categories.find(c => c.value === selectedCategory)?.label || selectedCategory}` : 'All Items'} 
                {` • ${sortedItems.length} items`}
              </p>
            </div>

          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items, brands, or styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-gray-300 focus:border-dusty-rose focus:ring-dusty-rose"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="border-gray-300 focus:border-dusty-rose">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger className="border-gray-300 focus:border-dusty-rose">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                {conditions.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    {condition.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 border-gray-300 focus:border-dusty-rose">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            <div className="flex items-center gap-2">
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="bg-dusty-rose text-light-gray">
                  {categories.find(c => c.value === selectedCategory)?.label}
                  <button onClick={() => setSelectedCategory("all")} className="ml-1">×</button>
                </Badge>
              )}
              {selectedCondition !== "all" && (
                <Badge variant="secondary" className="bg-terracotta text-light-gray">
                  {conditions.find(c => c.value === selectedCondition)?.label}
                  <button onClick={() => setSelectedCondition("all")} className="ml-1">×</button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="bg-golden-yellow text-gray-800">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="ml-1">×</button>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Items Grid/List */}
        {!isLoading && (
          <>
            {sortedItems.length > 0 ? (
              <div key={selectedCategory} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedItems.map((item: Item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="mb-4">
                  <Search className="w-16 h-16 text-gray-300 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No items found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedCondition("all");
                  }}
                  className="bg-dusty-rose hover:bg-dusty-rose/90 text-light-gray"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}