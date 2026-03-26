// ── Admin dashboard mock statistics ──────────────────────────────────────────

export const COUNTRY_STATS = [
  { country: "Indonesia",      flag: "🇮🇩", code: "id", users: 342, premium: 87,  gold: 34, suite: 53, mrr: 799.47  },
  { country: "Philippines",    flag: "🇵🇭", code: "ph", users: 134, premium: 38,  gold: 14, suite: 24, mrr: 258.74  },
  { country: "Thailand",       flag: "🇹🇭", code: "th", users: 198, premium: 54,  gold: 21, suite: 33, mrr: 374.68  },
  { country: "Singapore",      flag: "🇸🇬", code: "sg", users: 89,  premium: 31,  gold: 14, suite: 17, mrr: 224.65  },
  { country: "Malaysia",       flag: "🇲🇾", code: "my", users: 156, premium: 43,  gold: 17, suite: 26, mrr: 299.67  },
  { country: "Vietnam",        flag: "🇻🇳", code: "vn", users: 112, premium: 28,  gold: 11, suite: 17, mrr: 194.63  },
  { country: "United Kingdom", flag: "🇬🇧", code: "gb", users: 67,  premium: 24,  gold: 11, suite: 13, mrr: 174.81  },
  { country: "Australia",      flag: "🇦🇺", code: "au", users: 56,  premium: 21,  gold: 10, suite: 11, mrr: 154.79  },
  { country: "USA",            flag: "🇺🇸", code: "us", users: 71,  premium: 29,  gold: 13, suite: 16, mrr: 209.71  },
  { country: "Ireland",        flag: "🇮🇪", code: "ie", users: 43,  premium: 17,  gold: 8,  suite: 9,  mrr: 124.73  },
  { country: "France",         flag: "🇫🇷", code: "fr", users: 58,  premium: 20,  gold: 9,  suite: 11, mrr: 144.75  },
  { country: "Belgium",        flag: "🇧🇪", code: "be", users: 38,  premium: 14,  gold: 6,  suite: 8,  mrr: 99.70   },
];

export const MONTHLY_REVENUE = [
  { month: "Apr '25", revenue: 412,  suite: 280,  gold: 132  },
  { month: "May '25", revenue: 587,  suite: 380,  gold: 207  },
  { month: "Jun '25", revenue: 743,  suite: 470,  gold: 273  },
  { month: "Jul '25", revenue: 891,  suite: 545,  gold: 346  },
  { month: "Aug '25", revenue: 1102, suite: 655,  gold: 447  },
  { month: "Sep '25", revenue: 1340, suite: 785,  gold: 555  },
  { month: "Oct '25", revenue: 1587, suite: 920,  gold: 667  },
  { month: "Nov '25", revenue: 1829, suite: 1040, gold: 789  },
  { month: "Dec '25", revenue: 2140, suite: 1200, gold: 940  },
  { month: "Jan '26", revenue: 2398, suite: 1340, gold: 1058 },
  { month: "Feb '26", revenue: 2618, suite: 1450, gold: 1168 },
  { month: "Mar '26", revenue: 3059, suite: 1720, gold: 1339 },
];

export const PACKAGE_BREAKDOWN = [
  { name: "Seller Room", value: 986, color: "rgba(255,255,255,0.35)" },
  { name: "Ghost Suite",  value: 232, color: "#4ade80"               },
  { name: "Gold Room",    value: 146, color: "#d4af37"               },
];

export const RECENT_TRANSACTIONS = [
  { id: "TXN-9421", user: "Sari W.",     country: "🇮🇩", pkg: "Gold Room",   amount: "$9.99", date: "Mar 21, 2026", status: "paid"    },
  { id: "TXN-9420", user: "Ploy K.",     country: "🇹🇭", pkg: "Ghost Suite", amount: "$4.99", date: "Mar 21, 2026", status: "paid"    },
  { id: "TXN-9419", user: "Ana R.",      country: "🇵🇭", pkg: "Gold Room",   amount: "$9.99", date: "Mar 21, 2026", status: "paid"    },
  { id: "TXN-9418", user: "Jess L.",     country: "🇸🇬", pkg: "Ghost Suite", amount: "$4.99", date: "Mar 20, 2026", status: "paid"    },
  { id: "TXN-9417", user: "Nurul A.",    country: "🇲🇾", pkg: "Gold Room",   amount: "$9.99", date: "Mar 20, 2026", status: "paid"    },
  { id: "TXN-9416", user: "Sophie T.",   country: "🇬🇧", pkg: "Ghost Suite", amount: "$4.99", date: "Mar 20, 2026", status: "paid"    },
  { id: "TXN-9415", user: "Linh N.",     country: "🇻🇳", pkg: "Ghost Suite", amount: "$4.99", date: "Mar 19, 2026", status: "paid"    },
  { id: "TXN-9414", user: "Emma C.",     country: "🇦🇺", pkg: "Gold Room",   amount: "$9.99", date: "Mar 19, 2026", status: "paid"    },
  { id: "TXN-9413", user: "Dewi S.",     country: "🇮🇩", pkg: "Ghost Suite", amount: "$4.99", date: "Mar 19, 2026", status: "paid"    },
  { id: "TXN-9412", user: "Maria G.",    country: "🇵🇭", pkg: "Ghost Suite", amount: "$4.99", date: "Mar 18, 2026", status: "refund"  },
  { id: "TXN-9411", user: "Olivia M.",   country: "🇺🇸", pkg: "Gold Room",   amount: "$9.99", date: "Mar 18, 2026", status: "paid"    },
  { id: "TXN-9410", user: "Rina P.",     country: "🇮🇩", pkg: "Gold Room",   amount: "$9.99", date: "Mar 18, 2026", status: "paid"    },
];

export const MOCK_REAL_USERS = [
  { id: "USR-001", ghostId: "mock-001", name: "Sari Wulandari",    phone: "+62 812 *** 4521", city: "Jakarta",     country: "🇮🇩", tier: "gold",  joined: "Jan 12, 2026", lastActive: "2h ago",   gender: "Female", verificationStatus: "verified"  as const },
  { id: "USR-002", ghostId: "mock-002", name: "Ploy Kanchanara",   phone: "+66 81 *** 7832",  city: "Bangkok",     country: "🇹🇭", tier: "suite", joined: "Jan 18, 2026", lastActive: "5h ago",   gender: "Female", verificationStatus: "pending"   as const, verificationVideoUrl: "" },
  { id: "USR-003", ghostId: "mock-003", name: "Ana Reyes",          phone: "+63 917 *** 3241", city: "Manila",      country: "🇵🇭", tier: "gold",  joined: "Feb 2, 2026",  lastActive: "1h ago",   gender: "Female", verificationStatus: "none"      as const },
  { id: "USR-004", ghostId: "mock-004", name: "Jess Lim",           phone: "+65 9*** 1234",    city: "Singapore",   country: "🇸🇬", tier: "suite", joined: "Feb 8, 2026",  lastActive: "30m ago",  gender: "Female", verificationStatus: "none"      as const },
  { id: "USR-005", ghostId: "mock-005", name: "Nurul Aisyah",       phone: "+60 11 *** 5678",  city: "Kuala Lumpur",country: "🇲🇾", tier: "gold",  joined: "Feb 14, 2026", lastActive: "3h ago",   gender: "Female", verificationStatus: "verified"  as const },
  { id: "USR-006", ghostId: "mock-006", name: "Bagas Pratama",      phone: "+62 813 *** 9012", city: "Surabaya",    country: "🇮🇩", tier: "free",  joined: "Feb 20, 2026", lastActive: "1d ago",   gender: "Male",   verificationStatus: "none"      as const },
  { id: "USR-007", ghostId: "mock-007", name: "Sophie Turner",      phone: "+44 77 *** 3456",  city: "London",      country: "🇬🇧", tier: "suite", joined: "Mar 1, 2026",  lastActive: "6h ago",   gender: "Female", verificationStatus: "none"      as const },
  { id: "USR-008", ghostId: "mock-008", name: "Linh Nguyen",        phone: "+84 90 *** 7890",  city: "Ho Chi Minh", country: "🇻🇳", tier: "suite", joined: "Mar 3, 2026",  lastActive: "2h ago",   gender: "Female", verificationStatus: "verified"  as const },
  { id: "USR-009", ghostId: "mock-009", name: "Emma Clarke",        phone: "+61 4 *** 2345",   city: "Sydney",      country: "🇦🇺", tier: "gold",  joined: "Mar 7, 2026",  lastActive: "1h ago",   gender: "Female", verificationStatus: "none"      as const },
  { id: "USR-010", ghostId: "mock-010", name: "Dewi Rahayu",        phone: "+62 878 *** 6789", city: "Yogyakarta",  country: "🇮🇩", tier: "gold",  joined: "Mar 9, 2026",  lastActive: "4h ago",   gender: "Female", verificationStatus: "pending"   as const, verificationVideoUrl: "" },
  { id: "USR-011", ghostId: "mock-011", name: "Olivia Martinez",    phone: "+1 646 *** 0123",  city: "New York",    country: "🇺🇸", tier: "gold",  joined: "Mar 11, 2026", lastActive: "8h ago",   gender: "Female", verificationStatus: "none"      as const },
  { id: "USR-012", ghostId: "mock-012", name: "Rizky Firmansyah",   phone: "+62 811 *** 4567", city: "Bandung",     country: "🇮🇩", tier: "free",  joined: "Mar 14, 2026", lastActive: "2d ago",   gender: "Male",   verificationStatus: "none"      as const },
  { id: "USR-013", ghostId: "mock-013", name: "Charlotte Wilson",   phone: "+44 79 *** 8901",  city: "Manchester",  country: "🇬🇧", tier: "suite", joined: "Mar 15, 2026", lastActive: "3h ago",   gender: "Female", verificationStatus: "none"      as const },
  { id: "USR-014", ghostId: "mock-014", name: "Aoife Murphy",       phone: "+353 87 *** 2345", city: "Dublin",      country: "🇮🇪", tier: "gold",  joined: "Mar 16, 2026", lastActive: "5h ago",   gender: "Female", verificationStatus: "verified"  as const },
  { id: "USR-015", ghostId: "mock-015", name: "Emma Dupont",        phone: "+33 6 *** 6789",   city: "Paris",       country: "🇫🇷", tier: "suite", joined: "Mar 17, 2026", lastActive: "1h ago",   gender: "Female", verificationStatus: "none"      as const },
];
