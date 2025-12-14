import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CityDetail from "@/pages/city-detail";
import SearchResult from "@/pages/search-result";
import Dashboard from "@/pages/dashboard";
import Predictions from "@/pages/predictions";
import HistoryDashboard from "@/pages/history";
import { Chatbot } from "@/components/chatbot";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/predictions" component={Predictions} />
      <Route path="/history" component={HistoryDashboard} />
      <Route path="/city/:id" component={CityDetail} />
      <Route path="/search/:city" component={SearchResult} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <Chatbot />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
