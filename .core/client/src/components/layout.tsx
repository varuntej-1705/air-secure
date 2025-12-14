import { Link, useLocation } from "wouter";
import { ShieldCheck, LayoutDashboard, Menu, TrendingUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Chatbot } from "./chatbot";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const NavLink = ({ href, icon: Icon, children }: any) => (
    <Link href={href}>
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${location === href
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
      >
        <Icon className="h-4 w-4" />
        <span className="font-medium">{children}</span>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-heading text-xl font-bold text-primary">
            <ShieldCheck className="h-6 w-6" />
            <span>Air Secure</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/">
              <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${location === "/" ? "text-foreground" : "text-muted-foreground"}`}>Home</span>
            </Link>
            <Link href="/dashboard">
              <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${location === "/dashboard" ? "text-foreground" : "text-muted-foreground"}`}>Analysis</span>
            </Link>
            <Link href="/predictions">
              <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${location === "/predictions" ? "text-foreground" : "text-muted-foreground"}`}>Predictions</span>
            </Link>
            <Link href="/history">
              <span className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${location === "/history" ? "text-foreground" : "text-muted-foreground"}`}>History</span>
            </Link>
          </nav>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  <NavLink href="/" icon={ShieldCheck}>Home</NavLink>
                  <NavLink href="/dashboard" icon={LayoutDashboard}>Analysis</NavLink>
                  <NavLink href="/predictions" icon={TrendingUp}>Predictions</NavLink>
                  <NavLink href="/history" icon={History}>History</NavLink>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <Chatbot />
    </div>
  );
}
