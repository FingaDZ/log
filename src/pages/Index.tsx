import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SearchFilters } from '@/components/SearchFilters';
import { ConnectionTable } from '@/components/ConnectionTable';
import { ExportButton } from '@/components/ExportButton';
import { fetchLogs } from '@/lib/api';
import { SearchFilters as SearchFiltersType } from '@/types/connection';
import { useQuery } from '@tanstack/react-query';

const ITEMS_PER_PAGE = 50;

const initialFilters: SearchFiltersType = {
  username: '',
  sourceIp: '',
  sourcePort: '',
  destinationIp: '',
  destinationPort: '',
  protocol: 'Any',
  startDate: new Date().toISOString().split('T')[0], // Default to Today
  endDate: '',
  fromTime: '',
  toTime: '',
};

export default function Index() {
  const [filters, setFilters] = useState<SearchFiltersType>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<SearchFiltersType>(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);

  // Use Tanstack Query for catching data
  const { data, isLoading, error } = useQuery({
    queryKey: ['logs', appliedFilters, currentPage],
    queryFn: () => fetchLogs(appliedFilters, currentPage),
  });

  const logs = data?.data || [];
  // const totalCount = data?.total || 0; 
  // const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const totalPages = 10; // Placeholder until backend sends total count

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
    setCurrentPage(1);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
          onReset={handleReset}
        />

        <div className="flex justify-end">
          <ExportButton currentDate={appliedFilters.startDate} />
        </div>

        {isLoading && <div className="text-center">Loading logs...</div>}
        {error && <div className="text-red-500 text-center">Error loading logs. Check Backend Connection.</div>}

        {!isLoading && !error && (
          <ConnectionTable
            logs={data?.data || []}
            totalCount={data?.total || 0}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </main>
    </div>
  );
}
