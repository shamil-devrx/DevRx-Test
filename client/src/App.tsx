import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import QuestionDetail from "@/pages/QuestionDetail";
import AskQuestion from "@/pages/AskQuestion";
import Tags from "@/pages/Tags";
import Users from "@/pages/Users";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/questions/:id" component={QuestionDetail} />
      <Route path="/ask" component={AskQuestion} />
      <Route path="/tags" component={Tags} />
      <Route path="/users" component={Users} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Layout>
          <Router />
        </Layout>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
