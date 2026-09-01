import { execSync } from 'node:child_process';
import os from 'node:os';

export type NetworkDevice = {
  ip: string;
  mac: string | null;
  hostname: string | null;
  vendor: string | null;
};

function toMaskBits(mask: string): number[] {
  return mask.split('.').map((part) => Number(part));
}

function getInterfaceInfo() {
  const interfaces = os.networkInterfaces();

  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        return {
          name,
          address: address.address,
          netmask: address.netmask ?? '255.255.255.0',
        };
      }
    }
  }

  return null;
}

function getNetworkBase(ip: string, mask: string): string {
  const ipParts = ip.split('.').map(Number);
  const maskParts = mask.split('.').map(Number);
  const networkBase = ipParts
    .map((part, index) => part & maskParts[index])
    .join('.');

  const lastDot = networkBase.lastIndexOf('.');
  return lastDot === -1 ? networkBase : networkBase.slice(0, lastDot);
}

function parseArpTable(output: string): Record<string, string | null> {
  const parsed: Record<string, string | null> = {};

  const macMatches = output.matchAll(/\(([^)]+)\)\s+at\s+([0-9a-fA-F:]{11,})/g);
  for (const match of macMatches) {
    parsed[match[1]] = match[2].toUpperCase();
  }

  const tableMatches = output.matchAll(/\s*(\d+\.\d+\.\d+\.\d+)\s+.+?\s+([0-9A-Fa-f:]{17})/g);
  for (const match of tableMatches) {
    parsed[match[1]] = match[2].toUpperCase();
  }

  return parsed;
}

export function scanLocalNetwork(): NetworkDevice[] {
  const arpOutput = (() => {
    try {
      const output = execSync('arp -an 2>/dev/null || cat /proc/net/arp 2>/dev/null', {
        stdio: ['ignore', 'pipe', 'pipe'],
      }).toString();
      return output;
    } catch {
      return '';
    }
  })();

  const arpMap = parseArpTable(arpOutput);
  const knownIps = Object.keys(arpMap);

  if (knownIps.length > 0) {
    return knownIps.map((ip) => ({
      ip,
      mac: arpMap[ip] ?? null,
      hostname: null,
      vendor: null,
    }));
  }

  const interfaceInfo = getInterfaceInfo();
  if (!interfaceInfo) {
    return [];
  }

  const networkBase = getNetworkBase(interfaceInfo.address, interfaceInfo.netmask);
  const candidates = Array.from({ length: 254 }, (_, index) => `${networkBase}.${index + 1}`)
    .filter((target) => target !== interfaceInfo.address);

  const reachableIps: string[] = [];

  for (const ip of candidates) {
    try {
      const command = process.platform === 'win32'
        ? `ping -n 1 -w 150 ${ip} > nul 2>&1`
        : `ping -c 1 -W 150 ${ip} >/dev/null 2>&1`;

      execSync(command, { stdio: 'ignore' });
      reachableIps.push(ip);
    } catch {
      // ignore unreachable hosts
    }
  }

  return reachableIps.map((ip) => ({
    ip,
    mac: null,
    hostname: null,
    vendor: null,
  }));
}
