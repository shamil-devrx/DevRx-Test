import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Award } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

const Users: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch top contributors
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/users/top-contributors", { limit: 30 }],
  });

  // Filter users based on search query
  const filteredUsers = data
    ? data.filter((user: any) => {
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase();
        const email = (user.email || "").toLowerCase();
        const searchLower = searchQuery.toLowerCase();
        
        return (
          fullName.includes(searchLower) || 
          email.includes(searchLower)
        );
      })
    : [];

  return (
    <div>
      <div className="pb-5 border-b border-neutral-200 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Top Contributors</h1>
          <p className="text-neutral-500">Users with the highest reputation</p>
        </div>
        <div className="w-full sm:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <Input
              type="search"
              placeholder="Search users"
              className="pl-10 pr-3 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <p className="text-error-500">Error loading users. Please try again later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user: any) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <Link href={`/users/${user.id}`}>
                    <a className="block">
                      <div className="flex flex-col items-center text-center p-2">
                        <UserAvatar user={user} className="w-20 h-20 mb-3" />
                        <h3 className="font-medium text-neutral-900">
                          {user.firstName ? `${user.firstName} ${user.lastName || ""}` : user.email?.split("@")[0] || "User"}
                        </h3>
                        <div className="flex items-center mt-1 text-warning-500">
                          <Award className="h-4 w-4 mr-1" />
                          <span className="font-semibold">{user.reputation}</span>
                          <span className="ml-1 text-neutral-500 text-sm">reputation</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-neutral-600">No users found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Users;
