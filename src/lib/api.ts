import { ConnectionLog, SearchFilters } from '@/types/connection';

// Use current hostname (so it works on LAN) but port 3000
const hostname = window.location.hostname;
const API_URL = `http://${hostname}:3000/api`;

export const fetchLogs = async (filters: SearchFilters, page = 1): Promise<{ data: ConnectionLog[], total: number }> => {
    const params = new URLSearchParams();

    if (filters.startDate) params.append('date', filters.startDate); // For now filtering by single DATE

    // NOTE: The current backend design separates tables by Day. 
    // To search range, we'd need to loop distinct days or use a more complex backend search.
    // For this MV, we will pass 'date' (using startDate) to select the Table.

    if (filters.username) params.append('search', filters.username);
    if (filters.sourceIp) params.append('search', filters.sourceIp);

    params.append('page', page.toString());
    params.append('limit', '50');

    const response = await fetch(`${API_URL}/logs?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch logs');
    }

    const json = await response.json();

    // Transform DB format to Frontend Interface
    // DB: id, timestamp, source_ip, source_port ...
    // Frontend: date, time, sourceIp, sourcePort ...
    const logs = json.data.map((row: any) => {
        const dateObj = new Date(row.timestamp);
        return {
            id: row.id.toString(),
            date: dateObj.toISOString().split('T')[0],
            time: dateObj.toLocaleTimeString(),
            username: row.user || 'N/A',
            sourceIp: row.source_ip,
            sourcePort: row.source_port,
            destinationIp: row.dest_ip,
            destinationPort: row.dest_port,
            protocol: row.protocol,
        } as ConnectionLog;
    });

    return { data: logs, total: json.total || 0 };
};
