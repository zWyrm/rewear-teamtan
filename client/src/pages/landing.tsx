import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shirt, Package, Gem, Footprints, Camera, Search, Truck } from "lucide-react";
import { Link } from "wouter";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ItemCard from "@/components/item-card";
import { isAuthenticated } from "@/lib/auth";
import type { Item } from "@shared/schema";

const categories = [
  { name: "Tops", slug: "tops", icon: Shirt },
  { name: "Dresses", slug: "dresses", icon: Package },
  { name: "Bottoms", slug: "bottoms", icon: Package },
  { name: "Outerwear", slug: "outerwear", icon: Package },
  { name: "Shoes", slug: "shoes", icon: Footprints },
  { name: "Accessories", slug: "accessories", icon: Gem },
];

// Custom item card without cart functionality for landing page
const LandingItemCard = ({ item }: { item: Item }) => {
  const conditionColors = {
    excellent: "bg-green-100 text-green-800",
    good: "bg-blue-100 text-blue-800",
    fair: "bg-yellow-100 text-yellow-800",
    poor: "bg-red-100 text-red-800",
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
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1" title={item.description}>
            {item.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function Landing() {
  const authenticated = isAuthenticated();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["/api/items?approved=true"],
    enabled: true,
  });

  return (
    <div className="min-h-screen bg-light-gray">
      <Navbar />
      {/* Hero Section */}
      <section className="relative from-warm-beige via-white to-soft-pink/20 py-20 lg:py-32 bg-[#ffffff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-bebas text-dusty-rose leading-tight">
                  SWAP.<br />
                  SAVE.<br />
                  <span className="text-terracotta">SUSTAIN.</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                  Join our community of fashion lovers exchanging pre-loved clothing. 
                  Turn your closet gems into new treasures while making fashion more sustainable.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl">
                {!authenticated && (
                  <Button 
                    onClick={() => {
                      window.location.href = '/login';
                    }}
                    className="flex-1 bg-dusty-rose hover:bg-dusty-rose/90 text-light-gray py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                  >
                    Start Swapping
                  </Button>
                )}
                <Link href="/shop" className="flex-1">
                  <Button className="w-full bg-golden-yellow hover:bg-golden-yellow/90 text-gray-800 py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
                    Browse Items
                  </Button>
                </Link>
                <Button 
                  onClick={() => {
                    if (authenticated) {
                      window.location.href = '/add-item';
                    } else {
                      window.location.href = '/login';
                    }
                  }}
                  className="flex-1 bg-terracotta hover:bg-terracotta/90 text-light-gray py-4 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  List Item
                </Button>
              </div>

              
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4 transform rotate-3">
                <div className="space-y-4">
                  <img 
                    src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500" 
                    alt="Sustainable fashion model" 
                    className="rounded-2xl shadow-xl w-full h-auto" 
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                    alt="Vintage denim collection" 
                    className="rounded-2xl shadow-xl w-full h-auto" 
                  />
                </div>
                <div className="space-y-4 mt-8">
                  <img 
                    src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                    alt="Organized colorful wardrobe" 
                    className="rounded-2xl shadow-xl w-full h-auto" 
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=500" 
                    alt="Eco-friendly fashion accessories" 
                    className="rounded-2xl shadow-xl w-full h-auto" 
                  />
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </section>
      {/* Categories Section */}
      <section id="categories" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bebas text-dusty-rose mb-4">SHOP BY CATEGORY</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover unique pieces across all fashion categories. From everyday essentials to statement pieces.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link key={category.name} href={`/shop?category=${category.slug}`}>
                  <div className="group cursor-pointer">
                    <div className="bg-warm-beige rounded-2xl p-6 mb-4 text-center group-hover:bg-soft-pink/30 transition-colors">
                      <IconComponent className="w-8 h-8 text-dusty-rose mb-3 mx-auto" />
                      <h3 className="font-semibold text-gray-800">{category.name}</h3>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      {/* Featured Items */}
      <section className="py-16 bg-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bebas text-dusty-rose mb-4">FEATURED SWAPS</h2>
              <p className="text-lg text-gray-600">Trending items from our community</p>
            </div>
            <Link href="/shop">
              <Button className="hidden md:block bg-terracotta hover:bg-terracotta/90 text-light-gray px-6 py-3 rounded-lg font-medium">
                View All Items
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {items
                .sort((a, b) => b.value - a.value)
                .slice(0, 4)
                .map((item: Item) => (
                  <LandingItemCard key={item.id} item={item} />
                ))}
            </div>
          )}
          
          {!isLoading && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No items available yet.</p>
              <Button 
                onClick={() => {
                  if (authenticated) {
                    window.location.href = '/add-item';
                  } else {
                    window.location.href = '/login';
                  }
                }}
                className="bg-dusty-rose hover:bg-dusty-rose/90 text-light-gray"
              >
                List the First Item
              </Button>
            </div>
          )}
        </div>
      </section>
      {/* How It Works */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bebas text-dusty-rose mb-4">HOW IT WORKS</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple steps to start your sustainable fashion journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-warm-beige w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-soft-pink transition-colors">
                <Camera className="w-8 h-8 text-dusty-rose" />
              </div>
              <h3 className="text-xl font-bebas text-dusty-rose mb-3">1. UPLOAD ITEMS</h3>
              <p className="text-gray-600">Take photos of clothes you no longer wear and upload them with details like size, condition, and style.</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-warm-beige w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-soft-pink transition-colors">
                <Search className="w-8 h-8 text-dusty-rose" />
              </div>
              <h3 className="text-xl font-bebas text-dusty-rose mb-3">2. FIND & SWAP</h3>
              <p className="text-gray-600">Browse items from other users and propose swaps. Use our point system for value differences.</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-warm-beige w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-soft-pink transition-colors">
                <Truck className="w-8 h-8 text-dusty-rose" />
              </div>
              <h3 className="text-xl font-bebas text-dusty-rose mb-3">3. EXCHANGE</h3>
              <p className="text-gray-600">Coordinate shipping details with your swap partner and enjoy your new-to-you fashion finds!</p>
            </div>
          </div>
        </div>
      </section>
      {/* Community Stats */}
      <section id="community" className="py-16 bg-gradient-to-r from-dusty-rose to-soft-pink text-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bebas mb-4">JOIN OUR GROWING COMMUNITY</h2>
            <p className="text-xl opacity-90">Making fashion more sustainable, one swap at a time</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bebas mb-2">12,543</div>
              <div className="text-sm opacity-80">Active Members</div>
            </div>
            <div>
              <div className="text-4xl font-bebas mb-2">89,234</div>
              <div className="text-sm opacity-80">Items Listed</div>
            </div>
            <div>
              <div className="text-4xl font-bebas mb-2">45,012</div>
              <div className="text-sm opacity-80">Successful Swaps</div>
            </div>
            <div>
              <div className="text-4xl font-bebas mb-2">2,847</div>
              <div className="text-sm opacity-80">kg CO₂ Saved</div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
