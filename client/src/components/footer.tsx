import { Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-light-gray py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-[#fbf4ec]">
        <div className="flex flex-col md:flex-row md:justify-between gap-8">
          <div className="flex-1">
            <h3 className="text-3xl font-bebas text-dusty-rose mb-4">ReWear</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Building a more sustainable future through community-driven fashion exchange. 
              Every swap makes a difference.
            </p>
            <div className="flex space-x-4">
              <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
                <Instagram className="w-5 h-5" />
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
                <Twitter className="w-5 h-5" />
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg transition-colors">
                <Facebook className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-dusty-rose transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-dusty-rose transition-colors">Safety</a></li>
              <li><a href="#" className="hover:text-dusty-rose transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-dusty-rose transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>© 2025 ReWear - TeamTAN. All rights reserved. Making fashion more sustainable.</p>
        </div>
      </div>
    </footer>
  );
}
