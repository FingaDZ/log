import { ConnectionLog } from '@/types/connection';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Activity, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface ConnectionTableProps {
  logs: ConnectionLog[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function ProtocolBadge({ protocol }: { protocol: 'TCP' | 'UDP' }) {
  return (
    <span className={`protocol-badge ${protocol === 'TCP' ? 'protocol-tcp' : 'protocol-udp'}`}>
      {protocol}
    </span>
  );
}

function LogRow({ log }: { log: ConnectionLog }) {
  return (
    <TableRow className="data-row border-border/30">
      <TableCell className="text-muted-foreground text-xs py-2">{log.date}</TableCell>
      <TableCell className="font-mono text-xs text-foreground py-2">{log.time}</TableCell>
      <TableCell className="font-medium text-primary text-xs py-2">{log.username}</TableCell>
      <TableCell className="font-mono text-xs text-foreground py-2">{log.sourceIp}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground py-2">{log.sourcePort}</TableCell>
      <TableCell className="font-mono text-xs text-foreground py-2">{log.destinationIp}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground py-2">{log.destinationPort}</TableCell>
      <TableCell className="py-2"><ProtocolBadge protocol={log.protocol} /></TableCell>
    </TableRow>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
      <div className="text-sm text-muted-foreground">
        Page {currentPage} sur {totalPages}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="border-border hover:bg-secondary"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border-border hover:bg-secondary"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {getPageNumbers().map((page, index) => (
          typeof page === 'number' ? (
            <Button
              key={index}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={currentPage === page
                ? "bg-primary text-primary-foreground"
                : "border-border hover:bg-secondary"
              }
            >
              {page}
            </Button>
          ) : (
            <span key={index} className="px-2 text-muted-foreground">...</span>
          )
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border-border hover:bg-secondary"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="border-border hover:bg-secondary"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function ConnectionTable({ logs, totalCount, currentPage, totalPages, onPageChange }: ConnectionTableProps) {
  if (logs.length === 0) {
    return (
      <div className="glass-card p-12 text-center animate-fade-in">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Results Found</h3>
        <p className="text-muted-foreground">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/20 glow-accent">
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Search Results</h2>
        </div>
        <span className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
          {totalCount} total entries
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Date</TableHead>
              <TableHead className="text-muted-foreground font-medium">Time</TableHead>
              <TableHead className="text-muted-foreground font-medium">Username</TableHead>
              <TableHead className="text-muted-foreground font-medium">Source IP</TableHead>
              <TableHead className="text-muted-foreground font-medium">Source Port</TableHead>
              <TableHead className="text-muted-foreground font-medium">Dest. IP</TableHead>
              <TableHead className="text-muted-foreground font-medium">Dest. Port</TableHead>
              <TableHead className="text-muted-foreground font-medium">Protocol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <LogRow key={log.id} log={log} />
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
