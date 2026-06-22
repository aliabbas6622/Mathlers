import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavBar } from "@/components/NavBar";
import React, { Suspense } from "react";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

const Home         = React.lazy(() => import("@/pages/home"));
const Dashboard    = React.lazy(() => import("@/pages/dashboard"));
const Arena        = React.lazy(() => import("@/pages/arena"));
const Match        = React.lazy(() => import("@/pages/match"));
const Result       = React.lazy(() => import("@/pages/result"));
const Leaderboard  = React.lazy(() => import("@/pages/leaderboard"));
const Training     = React.lazy(() => import("@/pages/training"));
const Records      = React.lazy(() => import("@/pages/records"));
const Admin         = React.lazy(() => import("@/pages/admin"));
const AdminRecords  = React.lazy(() => import("@/pages/admin-records"));
const AdminStudents = React.lazy(() => import("@/pages/admin-students"));
const Profile       = React.lazy(() => import("@/pages/profile"));

const Spinner = () => (
  <div className="flex-1 flex items-center justify-center p-8 min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-sm text-muted-foreground">Loading arena...</span>
    </div>
  </div>
);

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<Spinner />}>
          <Switch>
            <Route path="/"              component={Home} />
            <Route path="/dashboard"     component={Dashboard} />
            <Route path="/arena"         component={Arena} />
            <Route path="/match"         component={Match} />
            <Route path="/match/result"  component={Result} />
            <Route path="/leaderboard"   component={Leaderboard} />
            <Route path="/training"      component={Training} />
            <Route path="/records"       component={Records} />
            <Route path="/admin"          component={Admin} />
            <Route path="/admin/records"  component={AdminRecords} />
            <Route path="/admin/students" component={AdminStudents} />
            <Route path="/result"         component={Result} />
            <Route path="/profile"        component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
