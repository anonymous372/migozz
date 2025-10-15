import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    // Use exact viewport height and ensure children can use flex and do internal scrolling
    <div className="flex flex-col min-h-[100vh] h-[100vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-500">
      <Navbar />
      <main className="flex-1 min-h-0">
        {/* min-h-0 is important so inner flex children can overflow internally without creating page scroll */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
