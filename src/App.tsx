import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CommandPage from './pages/CommandPage';
import SignalsPage from './pages/SignalsPage';
import CustomersPage from './pages/CustomersPage';
import IntelligencePage from './pages/IntelligencePage';
import BoardPage from './pages/BoardPage';
import ProductsPage from './pages/ProductsPage';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<CommandPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/intelligence" element={<IntelligencePage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/products" element={<ProductsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
