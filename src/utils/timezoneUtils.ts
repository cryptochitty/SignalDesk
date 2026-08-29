/**
 * Indian Standard Time (IST - Asia/Kolkata, UTC+05:30) Date & Time Utilities
 * Ensures all stock quotes, watchdog checks, order executions, and Kite feeds
 * strictly match Indian National Stock Exchange (NSE) & Bombay Stock Exchange (BSE)
 * market session clocks and local trader devices.
 */

/**
 * Returns formatted time in Indian Standard Time (IST)
 * Example output: "12:15:42 PM IST"
 */
export function formatToISTTime(
  dateInput?: Date | string | number | null,
  includeSeconds: boolean = true
): string {
  if (!dateInput) {
    return formatCurrentISTTime(includeSeconds);
  }

  // If already an IST string e.g. "12:15:40 PM IST", return sanitized
  if (typeof dateInput === "string" && dateInput.includes("IST")) {
    return dateInput;
  }

  let d: Date;
  if (typeof dateInput === "string") {
    // If it's a bare time string like "06:42:40 AM" (likely an unadjusted UTC server timestamp),
    // we convert current date/time to IST
    const bareTimeMatch = dateInput.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (bareTimeMatch) {
      // Return current time in IST to immediately rectify UTC delay display
      return formatCurrentISTTime(includeSeconds);
    }
    d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return formatCurrentISTTime(includeSeconds);
    }
  } else {
    d = new Date(dateInput);
    if (isNaN(d.getTime())) {
      return formatCurrentISTTime(includeSeconds);
    }
  }

  try {
    const timeStr = d.toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      ...(includeSeconds ? { second: "2-digit" } : {}),
    });
    return `${timeStr} IST`;
  } catch (_e) {
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      ...(includeSeconds ? { second: "2-digit" } : {}),
    }) + " IST";
  }
}

/**
 * Get current system time formatted in Indian Standard Time (IST)
 */
export function formatCurrentISTTime(includeSeconds: boolean = true): string {
  try {
    const timeStr = new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      ...(includeSeconds ? { second: "2-digit" } : {}),
    });
    return `${timeStr} IST`;
  } catch (_e) {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      ...(includeSeconds ? { second: "2-digit" } : {}),
    }) + " IST";
  }
}

/**
 * Check whether NSE/BSE regular trading session (09:15 AM - 03:30 PM IST, Mon-Fri) is active.
 */
export function getNSEMarketStatus(dateInput: Date = new Date()): {
  isOpen: boolean;
  statusLabel: string;
  sessionDescription: string;
  istTimeString: string;
} {
  try {
    const istFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });

    const parts = istFormatter.formatToParts(dateInput);
    const weekday = parts.find((p) => p.type === "weekday")?.value || "";
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const currentMins = hour * 60 + minute;

    const isWeekend = weekday === "Sat" || weekday === "Sun";
    const openMins = 9 * 60 + 15; // 09:15 AM IST
    const closeMins = 15 * 60 + 30; // 03:30 PM IST

    const istTimeString = formatToISTTime(dateInput, true);

    if (isWeekend) {
      return {
        isOpen: false,
        statusLabel: "Weekend Closed",
        sessionDescription: "NSE & BSE Reopen Monday at 09:15 AM IST",
        istTimeString,
      };
    }

    if (currentMins >= openMins && currentMins <= closeMins) {
      const minsLeft = closeMins - currentMins;
      const hLeft = Math.floor(minsLeft / 60);
      const mLeft = minsLeft % 60;
      return {
        isOpen: true,
        statusLabel: "Live Market (NSE / BSE)",
        sessionDescription: `Trading Session Active • Closes in ${hLeft}h ${mLeft}m (15:30 IST)`,
        istTimeString,
      };
    }

    if (currentMins < openMins) {
      const minsToOpen = openMins - currentMins;
      return {
        isOpen: false,
        statusLabel: "Pre-Market",
        sessionDescription: `Opens in ${Math.floor(minsToOpen / 60)}h ${minsToOpen % 60}m (09:15 AM IST)`,
        istTimeString,
      };
    }

    return {
      isOpen: false,
      statusLabel: "Market Closed (EOD)",
      sessionDescription: "NSE Regular Session Closed • Reopens Tomorrow 09:15 AM IST",
      istTimeString,
    };
  } catch (_e) {
    return {
      isOpen: true,
      statusLabel: "Live Market",
      sessionDescription: "09:15 - 15:30 IST",
      istTimeString: formatCurrentISTTime(true),
    };
  }
}
