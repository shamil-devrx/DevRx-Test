import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import QuestionCard from "@/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Loader2 } from "lucide-react";

const Home: React.FC = () => {
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 10;

  // Parse query parameters (if coming from a search or filter)
  const queryParams = new URLSearchParams(window.location.search);
  const searchQuery = queryParams.get("search") || "";
  const tagIds = queryParams.get("tags") ? queryParams.get("tags")?.split(",") : [];

  // Fetch questions with sorting, pagination and filters
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "/api/questions", 
      {
        limit: questionsPerPage,
        offset: (currentPage - 1) * questionsPerPage,
        sortBy,
        search: searchQuery,
        tags: tagIds?.join(",")
      }
    ],
  });

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  // Calculate total pages
  const totalPages = data?.total ? Math.ceil(data.total / questionsPerPage) : 0;

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // If total pages are less than max visible, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page, last page, and pages around current page
      pageNumbers.push(1);
      
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis indicator if needed
      if (startPage > 2) {
        pageNumbers.push('ellipsis-start');
      }
      
      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Add ellipsis indicator if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('ellipsis-end');
      }
      
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  return (
    <div>
      {/* Page header */}
      <div className="pb-5 border-b border-neutral-200 mb-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {searchQuery 
              ? `Search Results for "${searchQuery}"` 
              : tagIds?.length 
                ? "Questions with Selected Tags" 
                : "Top Questions"}
          </h1>
          <p className="text-neutral-500">
            {searchQuery || tagIds?.length 
              ? `Showing questions matching your criteria` 
              : `Browse questions with the most engagement`}
          </p>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-neutral-700 mr-2">Sort by:</span>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="votes">Most upvoted</SelectItem>
              <SelectItem value="views">Most viewed</SelectItem>
              <SelectItem value="active">Recently active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Question list */}
      <div className="space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-error-500">Error loading questions. Please try again later.</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Refresh Page
            </Button>
          </div>
        ) : data?.questions?.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-neutral-700 mb-4">No questions found matching your criteria.</p>
            <Link href="/ask">
              <Button>Ask the First Question</Button>
            </Link>
          </div>
        ) : (
          <>
            {data?.questions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-neutral-700">
                      Showing <span className="font-medium">{(currentPage - 1) * questionsPerPage + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * questionsPerPage, data?.total || 0)}
                      </span>{" "}
                      of <span className="font-medium">{data?.total}</span> results
                    </p>
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1} 
                        />
                      </PaginationItem>
                      
                      {getPageNumbers().map((page, index) => (
                        typeof page === 'number' ? (
                          <PaginationItem key={index}>
                            <PaginationLink 
                              onClick={() => setCurrentPage(page)}
                              isActive={page === currentPage}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <span className="px-2">...</span>
                          </PaginationItem>
                        )
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages} 
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
