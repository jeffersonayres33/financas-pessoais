import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Categories from "./pages/Categories";
import Expenses from "./pages/Expenses";
import Incomes from "./pages/Incomes";
import Reports from "./pages/Reports";
import Insights from "./pages/Insights";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/categories" component={Categories} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/incomes" component={Incomes} />
      <Route path="/reports" component={Reports} />
      <Route path="/insights" component={Insights} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
