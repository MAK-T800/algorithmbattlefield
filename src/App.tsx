import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ParticleBackground from "@/components/ParticleBackground";
import Navbar from "@/components/Navbar";
import RoomsPage from "./pages/RoomsPage";
import ArenaPage from "./pages/ArenaPage";
import VisualizePage from "./pages/VisualizePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ParticleBackground />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<RoomsPage />} />
          <Route path="/arena/:roomCode" element={<ArenaPage />} />
          <Route path="/visualize" element={<VisualizePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
