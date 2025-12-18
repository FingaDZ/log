import { Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
    currentDate: string;
}

export function ExportButton({ currentDate }: ExportButtonProps) {
    const handleExportCSV = () => {
        const hostname = window.location.hostname;
        const url = `http://${hostname}:3000/api/export?date=${currentDate}&format=csv`;
        window.open(url, '_blank');
    };

    const handleExportExcel = () => {
        const hostname = window.location.hostname;
        const url = `http://${hostname}:3000/api/export?date=${currentDate}&format=xlsx`;
        window.open(url, '_blank');
    };

    return (
        <div className="flex gap-2">
            <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                className="border-border hover:bg-secondary"
            >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
            </Button>
            <Button
                onClick={handleExportExcel}
                variant="outline"
                size="sm"
                className="border-border hover:bg-secondary"
            >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
            </Button>
        </div>
    );
}
