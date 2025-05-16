import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import SearchBar from "./SearchBar";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { BellIcon } from "lucide-react";

const Header: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  const handleAskQuestion = () => {
    if (isAuthenticated) {
      navigate("/ask");
    } else {
      window.location.href = "/api/login";
    }
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <a className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.5a4.5 4.5 0 109 0v-1a1 1 0 10-2 0v1a2.5 2.5 0 01-5 0V5z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2 text-2xl font-bold text-neutral-800">DevRx</span>
                </a>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <Link href="/">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${location === "/" ? "text-primary-500 bg-primary-50" : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"}`}>
                  Home
                </a>
              </Link>
              <Link href="/questions">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${location.startsWith("/questions") ? "text-primary-500 bg-primary-50" : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"}`}>
                  Questions
                </a>
              </Link>
              <Link href="/tags">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${location === "/tags" ? "text-primary-500 bg-primary-50" : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"}`}>
                  Tags
                </a>
              </Link>
              <Link href="/users">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${location === "/users" ? "text-primary-500 bg-primary-50" : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"}`}>
                  Users
                </a>
              </Link>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-lg w-full">
              <SearchBar />
            </div>
          </div>

          <div className="flex items-center">
            <Button 
              className="ml-3 bg-primary-500 hover:bg-primary-600"
              onClick={handleAskQuestion}
            >
              Ask Question
            </Button>
            
            <div className="ml-4 flex items-center">
              {isAuthenticated ? (
                <>
                  {/* Notification bell */}
                  <button className="p-1 rounded-full text-neutral-500 hover:text-neutral-700 focus:outline-none">
                    <BellIcon className="h-6 w-6" />
                  </button>

                  {/* Profile dropdown */}
                  <div className="ml-3 relative">
                    <Link href="/profile">
                      <a>
                        <UserAvatar 
                          user={user} 
                          className="h-8 w-8 rounded-full object-cover cursor-pointer"
                        />
                      </a>
                    </Link>
                  </div>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  className="ml-3"
                  onClick={() => { window.location.href = "/api/login"; }}
                >
                  Log In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
