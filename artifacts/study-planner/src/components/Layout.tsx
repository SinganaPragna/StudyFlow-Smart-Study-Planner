import { Link, useLocation } from "wouter";
import { BookOpen, Calendar, LayoutDashboard, Sun, Moon, PieChart, Home, LogOut, User, ChevronDown, LogIn, UserPlus, StickyNote } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Subjects", href: "/subjects", icon: BookOpen },
    { name: "Timetable", href: "/timetable", icon: Calendar },
    { name: "Progress", href: "/progress", icon: PieChart },
    { name: "Notes", href: "/notes", icon: StickyNote },
  ];

  const isHome = location === "/";
  const isAuth = location === "/signin" || location === "/signup";

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className={`sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-xl no-print transition-all duration-300 ${
        isHome ? "bg-background/70" : "bg-background/90"
      }`}>
        <div className="container flex h-16 max-w-screen-2xl items-center mx-auto px-4">

          {/* Logo */}
          <Link href="/" data-testid="nav-logo">
            <div className="mr-6 flex items-center gap-2.5 cursor-pointer group">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-500/30 transition-all group-hover:shadow-violet-500/50">
                <BookOpen className="h-5 w-5 text-white" />
                <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-pink-400 border-2 border-background" />
              </div>
              <span className="font-heading font-bold text-lg tracking-tight">
                Study<span className="text-violet-400">Flow</span>
              </span>
            </div>
          </Link>

          {/* Nav */}
          {!isAuth && (
            <nav className="flex items-center gap-1 text-sm font-medium flex-1">
              <Link
                href="/"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                  isHome ? "nav-link-active font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
                data-testid="nav-link-home"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>

              {user && navigation.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "nav-link-active font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                    data-testid={`nav-link-${item.name.toLowerCase()}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {isAuth && <div className="flex-1" />}

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle"
              aria-label="Toggle theme"
              className="rounded-xl hover:bg-muted/60"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Auth controls */}
            {!isAuth && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/60 px-3 py-1.5 text-sm font-medium hover:bg-muted/60 transition-all duration-200"
                      data-testid="button-profile-menu"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white text-xs font-bold">
                        {initials}
                      </div>
                      <span className="max-w-[100px] truncate">{user.name}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1">
                    <DropdownMenuLabel className="pb-0">
                      <p className="font-semibold">{user.name}</p>
                    </DropdownMenuLabel>
                    <p className="px-2 pb-2 text-xs text-muted-foreground">{user.email}</p>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer gap-2"
                      onClick={handleLogout}
                      data-testid="button-logout"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/signin">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-muted-foreground hover:text-foreground"
                      data-testid="nav-button-signin"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      size="sm"
                      className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white shadow-sm shadow-violet-500/30"
                      data-testid="nav-button-signup"
                    >
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      <main className={`flex-1 ${(location === "/" || location === "/signin" || location === "/signup") ? "" : "container max-w-screen-2xl mx-auto px-4 py-8"}`}>
        {children}
      </main>
    </div>
  );
}
