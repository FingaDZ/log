import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
    currentDate: string;
}

export function ExportButton({ currentDate }: ExportButtonProps) {
    const handleExport = () => {
        const hostname = window.location.hostname;
        const url = `http://${hostname}:3000/api/export?date=${currentDate}&format=csv`;
        window.open(url, '_blank');
    };

    return (
        <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="border-border hover:bg-secondary"
        >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
        </Button>
    );
}
