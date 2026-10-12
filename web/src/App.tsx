import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/ui";
import Home from "./pages/Home";
import Screening from "./pages/Screening";
import Result from "./pages/Result";
import Instructions from "./pages/Instructions";
import Schedule from "./pages/Schedule";
import CheckIns from "./pages/CheckIns";
import Summary from "./pages/Summary";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/skrining" element={<Screening />} />
        <Route path="/skrining/:id/hasil" element={<Result />} />
        <Route path="/instruksi" element={<Instructions />} />
        <Route path="/instruksi/:id/jadwal" element={<Schedule />} />
        <Route path="/catatan" element={<CheckIns />} />
        <Route path="/ringkasan" element={<Summary />} />
        <Route path="*" element={<p>Halaman tidak ditemukan.</p>} />
      </Routes>
    </Layout>
  );
}
