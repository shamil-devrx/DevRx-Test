import React from "react";
import { Link } from "wouter";
import { Tag } from "@shared/schema";

interface TagsListProps {
  tags: Tag[];
  className?: string;
}

const TagsList: React.FC<TagsListProps> = ({ tags, className = "" }) => {
  if (!tags || tags.length === 0) return null;
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map((tag) => (
        <Link key={tag.id} href={`/questions?tags=${tag.id}`}>
          <a className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-md hover:bg-primary-200">
            #{tag.name}
          </a>
        </Link>
      ))}
    </div>
  );
};

export default TagsList;
