
// Generic Mikrotik Parser
// Example: "start_time input: in:ether1 out:(unknown 0), src-mac 00:00:00:00:00:00, proto TCP (SYN), 192.168.88.10:5432->1.1.1.1:80, len 60"
// Note: Mikrotik formats vary wildly based on configuration. This is a best-effort parser.

export interface ParsedLog {
    source_ip?: string;
    source_port?: number;
    dest_ip?: string;
    dest_port?: number;
    protocol?: string;
    message: string;
    user?: string;
}

export const parseMikrotikLog = (message: string): ParsedLog => {
    const result: ParsedLog = { message };

    // Regex to find IP:Port->IP:Port patterns
    // Pattern: 192.168.88.10:5432->1.1.1.1:80
    const trafficRegex = /([\d\.]+):(\d+)\->([\d\.]+):(\d+)/;
    const match = message.match(trafficRegex);

    if (match) {
        result.source_ip = match[1];
        result.source_port = parseInt(match[2]);
        result.dest_ip = match[3];
        result.dest_port = parseInt(match[4]);
    }

    // Protocol
    const protoRegex = /proto ([A-Z0-9]+)/i;
    const protoMatch = message.match(protoRegex);
    if (protoMatch) {
        result.protocol = protoMatch[1];
    }

    // Username from PPPoE
    // Pattern: in:<pppoe-username>
    const pppoeRegex = /in:<pppoe-([^>]+)>/;
    const pppoeMatch = message.match(pppoeRegex);
    if (pppoeMatch) {
        result.user = pppoeMatch[1];
    }

    return result;
};
