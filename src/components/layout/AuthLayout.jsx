import Footer from "./Footer";
import Logo from "./Logo";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FC]">
      <header className="border-b border-[#ECEEF2] bg-white">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center px-6">
          <Logo to="/login" />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">{children}</main>
      <Footer />
    </div>
  );
}