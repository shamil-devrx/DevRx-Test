import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { User } from "@shared/schema";

interface UserAvatarProps {
  user?: User | null;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, className = "" }) => {
  const initials = user ? getInitials(user.firstName, user.lastName) : "U";
  
  return (
    <Avatar className={className}>
      <AvatarImage 
        src={user?.profileImageUrl || undefined} 
        alt={`${user?.firstName || ''} ${user?.lastName || ''}`} 
      />
      <AvatarFallback className="bg-primary-100 text-primary-700">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
