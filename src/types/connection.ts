export interface ConnectionLog {
  id: string;
  date: string;
  time: string;
  username: string;
  sourceIp: string;
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  protocol: 'TCP' | 'UDP';
}

export interface SearchFilters {
  username: string;
  sourceIp: string;
  sourcePort: string;
  destinationIp: string;
  destinationPort: string;
  protocol: 'Any' | 'TCP' | 'UDP';
  startDate: string;
  endDate: string;
  fromTime: string;
  toTime: string;
}

export interface GroupedLogs {
  date: string;
  logs: ConnectionLog[];
}
