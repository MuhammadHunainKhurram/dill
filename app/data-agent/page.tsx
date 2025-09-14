import MessyDataAgent from '@/components/MessyDataAgent';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';

export default function DataAgentPage() {
  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-gray-50">
        <MessyDataAgent />
      </div>
      <Footer />
    </>
  );
}