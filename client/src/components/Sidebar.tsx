import React from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import UserAvatar from "./UserAvatar";
import {
  HomeIcon,
  HelpCircleIcon,
  TagIcon,
  UsersIcon,
  SettingsIcon,
} from "lucide-react";

const Sidebar: React.FC = () => {
  const [location] = useLocation();

  // Fetch popular tags
  const { data: popularTags } = useQuery({
    queryKey: ["/api/tags/popular"],
  });

  // Fetch top contributors
  const { data: topContributors } = useQuery({
    queryKey: ["/api/users/top-contributors"],
  });

  const navItems = [
    { path: "/", label: "Home", icon: HomeIcon },
    { path: "/questions", label: "Questions", icon: HelpCircleIcon },
    { path: "/tags", label: "Tags", icon: TagIcon },
    { path: "/users", label: "Users", icon: UsersIcon },
    { path: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <nav className="space-y-6">
        <div className="bg-white shadow rounded-lg p-5 space-y-4">
          <h3 className="font-medium text-neutral-900">Navigation</h3>
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <a 
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md",
                      location === item.path 
                        ? "text-primary-500 bg-primary-50" 
                        : "text-neutral-700 hover:text-primary-500 hover:bg-primary-50"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <h3 className="font-medium text-neutral-900 mb-3">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {popularTags ? (
              popularTags.map((tag: any) => (
                <Link key={tag.id} href={`/questions?tags=${tag.id}`}>
                  <a className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-md hover:bg-neutral-200">
                    #{tag.name}
                  </a>
                </Link>
              ))
            ) : (
              // Loading state placeholders
              Array.from({ length: 9 }).map((_, i) => (
                <div 
                  key={i} 
                  className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded-md animate-pulse w-16 h-6"
                />
              ))
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-5">
          <h3 className="font-medium text-neutral-900 mb-3">Top Contributors</h3>
          <ul className="space-y-3">
            {topContributors ? (
              topContributors.map((user: any) => (
                <li key={user.id} className="flex items-center gap-2">
                  <UserAvatar user={user} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {user.reputation} reputation
                    </p>
                  </div>
                </li>
              ))
            ) : (
              // Loading state placeholders
              Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-neutral-200 rounded animate-pulse mb-1" />
                    <div className="w-16 h-3 bg-neutral-200 rounded animate-pulse" />
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
