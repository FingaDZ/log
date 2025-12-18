import { ConnectionLog } from '@/types/connection';

const usernames = ['client001', 'client002', 'client003', 'enterprise_A', 'enterprise_B', 'home_user_01', 'home_user_02'];
const protocols: ('TCP' | 'UDP')[] = ['TCP', 'UDP'];

function randomIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomPort(): number {
  return Math.floor(Math.random() * 65535) + 1;
}

function randomTime(): string {
  const hours = String(Math.floor(Math.random() * 24)).padStart(2, '0');
  const minutes = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  const seconds = String(Math.floor(Math.random() * 60)).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function generateMockData(): ConnectionLog[] {
  const logs: ConnectionLog[] = [];
  const today = new Date();
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    
    const logsPerDay = Math.floor(Math.random() * 20) + 10;
    
    for (let i = 0; i < logsPerDay; i++) {
      logs.push({
        id: `${dateStr}-${i}`,
        date: dateStr,
        time: randomTime(),
        username: usernames[Math.floor(Math.random() * usernames.length)],
        sourceIp: randomIp(),
        sourcePort: randomPort(),
        destinationIp: randomIp(),
        destinationPort: [80, 443, 8080, 3389, 22, 53, 25, 110][Math.floor(Math.random() * 8)],
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
      });
    }
  }
  
  return logs.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.time.localeCompare(a.time);
  });
}

export const mockConnectionLogs = generateMockData();
