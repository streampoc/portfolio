import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-6">Welcome to Trading Dashboard</h1>
      <p className="text-xl mb-8">Visualize your trades from multiple brokers consolidated and with ease.</p>
      <Link href="/dashboard">
        <Button size="lg">Enter Dashboard</Button>
      </Link>
    </div>
  );
}