import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import VerifyHome from "./pages/VerifyHome";
import VerifyBatch from "./pages/VerifyBatch";
import Portal from "./pages/Portal";
import FarmerDashboard from "./pages/Farmer";
import LabDashboard from "./pages/Lab";
import DistributorDashboard from "./pages/Distributor";
import AdminDashboard from "./pages/Admin";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <>
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Routes>
        {/* Public routes — no wallet needed */}
        <Route path="/" element={<Landing />} />
        <Route path="/verify" element={<VerifyHome />} />
        <Route path="/verify/:batchId" element={<VerifyBatch />} />

        {/* Wallet-connected routes */}
        <Route path="/app" element={<Portal />} />
        <Route path="/app/farmer" element={<FarmerDashboard />} />
        <Route path="/app/lab" element={<LabDashboard />} />
        <Route path="/app/distributor" element={<DistributorDashboard />} />
        <Route path="/app/admin" element={<AdminDashboard />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
