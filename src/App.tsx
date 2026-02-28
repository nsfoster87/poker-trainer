import Header from './components/Header';
import PokerTable from './components/PokerTable';

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <PokerTable />
      </main>
    </div>
  );
}
