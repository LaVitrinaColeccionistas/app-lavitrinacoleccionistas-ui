import Footer from "./Footer";
import Navbar from "./Navbar";

export default function PageLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FC]">
      <Navbar />

      <main className="flex-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}