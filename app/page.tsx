import Sidebar from '../components/Sidebar';
import HomeTab from '../components/Home/HomeTab';
import { FilterProvider } from '../contexts/FilterContext';

export default function Home() {
  return (
    <FilterProvider>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <HomeTab />
        </main>
      </div>
    </FilterProvider>
  );
}
