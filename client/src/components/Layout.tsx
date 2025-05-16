import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import Footer from "./Footer";
import AiAssistant from "./AiAssistant";
import { useAuth } from "@/hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAiChat, setShowAiChat] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-grow">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left sidebar */}
            <Sidebar />
            
            {/* Main content area */}
            <div className="flex-1">
              {children}
            </div>
            
            {/* Right panel (hidden on mobile) */}
            <RightPanel />
          </div>
        </main>
      </div>
      
      <Footer />
      
      {/* Floating AI Assistant Button */}
      <button 
        className="fixed bottom-6 right-6 p-4 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 z-20"
        onClick={() => setShowAiChat(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>
      
      {/* AI Assistant Chat Modal */}
      <AiAssistant isOpen={showAiChat} onClose={() => setShowAiChat(false)} />
    </div>
  );
};

export default Layout;
