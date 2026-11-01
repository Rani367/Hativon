// Stored timestamps have no time zone and are treated as UTC everywhere, so
// tests must not depend on the machine's zone.
process.env.TZ = "UTC";
