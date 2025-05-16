import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Loader2 } from "lucide-react";

const Tags: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const tagsPerPage = 20;

  // Fetch tags with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/tags", { limit: tagsPerPage, offset: (currentPage - 1) * tagsPerPage }],
  });

  // Filter tags based on search query
  const filteredTags = data?.tags
    ? data.tags.filter((tag: any) => 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Calculate total pages
  const totalPages = data?.total ? Math.ceil(data.total / tagsPerPage) : 0;

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="pb-5 border-b border-neutral-200 mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tags</h1>
          <p className="text-neutral-500">Browse questions by topic tag</p>
        </div>
        <div className="w-full sm:w-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <Input
              type="search"
              placeholder="Filter tags"
              className="pl-10 pr-3 py-2"
              value={searchQuery}
              onChange={handleSearch}
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
          <p className="text-error-500">Error loading tags. Please try again later.</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTags.length > 0 ? (
              filteredTags.map((tag: any) => (
                <Card key={tag.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <Link href={`/questions?tags=${tag.id}`}>
                      <a className="block">
                        <div className="mb-2">
                          <span className="px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-md inline-block">
                            #{tag.name}
                          </span>
                        </div>
                        {tag.description && (
                          <p className="text-sm text-neutral-600 mb-2">{tag.description}</p>
                        )}
                        <p className="text-xs text-neutral-500">{tag.count} questions</p>
                      </a>
                    </Link>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-neutral-600">No tags found matching "{searchQuery}"</p>
              </div>
            )}
          </div>

          {!searchQuery && totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1} 
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber = currentPage > 3 && totalPages > 5
                      ? currentPage - 3 + i + (currentPage + 2 > totalPages ? totalPages - currentPage - 2 : 0)
                      : i + 1;
                    
                    return pageNumber <= totalPages ? (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          onClick={() => setCurrentPage(pageNumber)}
                          isActive={pageNumber === currentPage}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    ) : null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages} 
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Tags;
