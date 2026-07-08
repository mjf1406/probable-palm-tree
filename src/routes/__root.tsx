import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { PageLoader } from "@/components/PageLoader";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createRootRoute({
  loader: () => void 0,
  component: RootComponent,
});

function RootComponent() {
  const isLoading = useRouterState({ select: (state) => state.isLoading });

  return (
    <TooltipProvider>
      {isLoading ? <PageLoader /> : <Outlet />}
      <Toaster richColors position="top-center" />
    </TooltipProvider>
  );
}
