export interface TaxonomyDomain {
  name: string
  description: string
  keywords: string[]
  subdomains: Record<string, TaxonomySubdomain>
}

export interface TaxonomySubdomain {
  name: string
  description: string
  keywords: string[]
  applicableWhen: string[]
  systems?: Record<string, TaxonomySystem>
}

export interface TaxonomySystem {
  name: string
  description: string
  isCritical: boolean
  features?: string[]
}

export const TAXONOMY: Record<string, TaxonomyDomain> = {
  "Hardware": {
    name: "Hardware",
    description: "Physical devices, sensors, equipment, and infrastructure",
    keywords: ["device", "sensor", "physical", "equipment", "hardware", "iot", "gps"],
    subdomains: {
      "GPS & Location": {
        name: "GPS & Location",
        description: "GPS modules, location tracking hardware",
        keywords: ["gps", "location", "tracking", "geolocation", "coordinates"],
        applicableWhen: ["location", "tracking", "gps", "field", "mobile"],
        systems: {
          "GPS Module": {
            name: "GPS Module Selection",
            description: "Choose and integrate GPS hardware",
            isCritical: true,
            features: [
              "Accuracy requirements (±5m, ±10m, etc.)",
              "Update frequency",
              "Power consumption",
              "Weather resistance"
            ]
          },
          "Antenna System": {
            name: "GPS Antenna System",
            description: "Antenna design and placement",
            isCritical: true,
            features: [
              "Antenna type selection",
              "Placement optimization",
              "Signal strength monitoring"
            ]
          }
        }
      },
      
      "Mobile Devices": {
        name: "Mobile Devices",
        description: "Phones, tablets, handheld devices",
        keywords: ["phone", "tablet", "mobile", "handheld", "device"],
        applicableWhen: ["mobile", "field", "worker", "user"],
        systems: {
          "Device Selection": {
            name: "Mobile Device Fleet",
            description: "Select and procure mobile devices",
            isCritical: true,
            features: [
              "iOS vs Android decision",
              "Device specifications",
              "Bulk procurement",
              "MDM (Mobile Device Management)"
            ]
          }
        }
      },
      
      "Biometric Systems": {
        name: "Biometric Systems",
        description: "Fingerprint, facial recognition, RFID",
        keywords: ["biometric", "fingerprint", "facial", "rfid", "authentication"],
        applicableWhen: ["authentication", "identity", "security", "verification"],
        systems: {
          "Biometric Scanner": {
            name: "Biometric Authentication Hardware",
            description: "Fingerprint or facial recognition devices",
            isCritical: false,
            features: [
              "Scanner type (fingerprint/facial)",
              "Accuracy and false positive rate",
              "Integration with mobile devices",
              "Offline capability"
            ]
          }
        }
      },
      
      "Networking": {
        name: "Networking & Connectivity",
        description: "Network equipment, routers, connectivity hardware",
        keywords: ["network", "router", "wifi", "connectivity", "internet"],
        applicableWhen: ["network", "distributed", "remote", "iot"],
        systems: {
          "Network Infrastructure": {
            name: "Network Infrastructure",
            description: "Routers, access points, cabling",
            isCritical: true
          }
        }
      }
    }
  },
  
  "Software": {
    name: "Software",
    description: "Applications, APIs, databases, and platforms",
    keywords: ["app", "software", "platform", "digital", "code", "api"],
    subdomains: {
      "Frontend": {
        name: "Frontend",
        description: "User interfaces and client applications",
        keywords: ["ui", "interface", "frontend", "client", "user"],
        applicableWhen: ["always"], // Every software project needs frontend
        systems: {
          "Mobile App (iOS)": {
            name: "Mobile App (iOS)",
            description: "iOS application for iPhone and iPad",
            isCritical: true,
            features: [
              "Authentication & login",
              "GPS tracking integration",
              "Offline mode",
              "Photo capture",
              "Push notifications",
              "Settings & profile"
            ]
          },
          "Mobile App (Android)": {
            name: "Mobile App (Android)",
            description: "Android application",
            isCritical: true,
            features: [
              "Authentication & login",
              "GPS tracking integration",
              "Offline mode",
              "Photo capture",
              "Push notifications",
              "Settings & profile"
            ]
          },
          "Web Dashboard": {
            name: "Admin Web Dashboard",
            description: "Web-based admin interface",
            isCritical: true,
            features: [
              "User management",
              "Real-time monitoring",
              "Reports & analytics",
              "Settings & configuration"
            ]
          }
        }
      },
      
      "Backend": {
        name: "Backend",
        description: "Server logic, APIs, business rules",
        keywords: ["api", "server", "backend", "logic", "microservice"],
        applicableWhen: ["always"],
        systems: {
          "REST API": {
            name: "REST API",
            description: "RESTful API endpoints",
            isCritical: true,
            features: [
              "Authentication endpoints",
              "Check-in/check-out endpoints",
              "User management API",
              "Reporting API",
              "File upload API"
            ]
          },
          "Authentication Service": {
            name: "Authentication & Authorization",
            description: "User auth, JWT, sessions",
            isCritical: true,
            features: [
              "JWT token management",
              "Role-based access control",
              "Session management",
              "Password reset"
            ]
          },
          "Background Jobs": {
            name: "Background Jobs & Queues",
            description: "Async processing, scheduled tasks",
            isCritical: false,
            features: [
              "Payroll calculation jobs",
              "Report generation",
              "Email/SMS notifications",
              "Data sync jobs"
            ]
          }
        }
      },
      
      "Database": {
        name: "Database",
        description: "Data storage and management",
        keywords: ["database", "data", "storage", "postgres", "sql"],
        applicableWhen: ["always"],
        systems: {
          "Primary Database": {
            name: "Primary Database (PostgreSQL)",
            description: "Main application database",
            isCritical: true,
            features: [
              "Schema design",
              "Indexing strategy",
              "Backup & recovery",
              "Performance optimization"
            ]
          },
          "Cache Layer": {
            name: "Cache (Redis)",
            description: "Caching for performance",
            isCritical: false,
            features: [
              "Session caching",
              "Query result caching",
              "Real-time data caching"
            ]
          }
        }
      },
      
      "DevOps": {
        name: "DevOps & Infrastructure",
        description: "Deployment, monitoring, CI/CD",
        keywords: ["deployment", "infrastructure", "devops", "ci", "cd"],
        applicableWhen: ["always"],
        systems: {
          "CI/CD Pipeline": {
            name: "CI/CD Pipeline",
            description: "Automated testing and deployment",
            isCritical: true
          },
          "Hosting Infrastructure": {
            name: "Cloud Hosting",
            description: "Server hosting (AWS/Vercel/etc)",
            isCritical: true
          },
          "Monitoring": {
            name: "Monitoring & Logging",
            description: "Error tracking, performance monitoring",
            isCritical: true
          }
        }
      },
      
      "Integrations": {
        name: "Integrations",
        description: "Third-party services and APIs",
        keywords: ["integration", "api", "third-party", "external"],
        applicableWhen: ["payment", "notification", "accounting"],
        systems: {
          "Payroll Integration": {
            name: "Payroll Software Integration",
            description: "Connect to QuickBooks/Xero/etc",
            isCritical: false,
            features: [
              "Attendance data export",
              "Timesheet sync",
              "Payroll calculation"
            ]
          },
          "SMS Service": {
            name: "SMS Notification Service",
            description: "Twilio/similar for SMS",
            isCritical: false
          }
        }
      }
    }
  },
  
  "Operations": {
    name: "Operations",
    description: "Processes, training, support, deployment",
    keywords: ["operations", "process", "training", "support", "deployment"],
    subdomains: {
      "Deployment": {
        name: "Deployment & Rollout",
        description: "Launch and rollout strategy",
        keywords: ["deployment", "rollout", "launch"],
        applicableWhen: ["always"],
        systems: {
          "Pilot Program": {
            name: "Pilot Program",
            description: "Test with small group first",
            isCritical: true
          },
          "Full Rollout": {
            name: "Full Deployment",
            description: "Organization-wide launch",
            isCritical: true
          }
        }
      },
      
      "Training": {
        name: "Training & Onboarding",
        description: "User training and onboarding",
        keywords: ["training", "onboarding", "education"],
        applicableWhen: ["users", "team"],
        systems: {
          "Manager Training": {
            name: "Farm Manager Training",
            description: "Train managers on dashboard",
            isCritical: true
          },
          "Worker Onboarding": {
            name: "Worker Onboarding",
            description: "Train workers on mobile app",
            isCritical: true
          }
        }
      },
      
      "Support": {
        name: "Support & Maintenance",
        description: "Ongoing support and maintenance",
        keywords: ["support", "maintenance", "helpdesk"],
        applicableWhen: ["always"],
        systems: {
          "Help Desk": {
            name: "User Support System",
            description: "Support ticket system",
            isCritical: true
          },
          "Field Support": {
            name: "On-site Field Support",
            description: "Technical support on farms",
            isCritical: false
          }
        }
      }
    }
  },
  
  "Compliance": {
    name: "Compliance & Legal",
    description: "Legal, privacy, security, regulations",
    keywords: ["compliance", "legal", "privacy", "regulation", "gdpr"],
    subdomains: {
      "Data Privacy": {
        name: "Data Privacy",
        description: "GDPR, data protection",
        keywords: ["gdpr", "privacy", "data", "protection"],
        applicableWhen: ["user data", "personal"],
        systems: {
          "GDPR Compliance": {
            name: "GDPR Compliance",
            description: "EU data protection compliance",
            isCritical: true
          },
          "Data Encryption": {
            name: "Data Encryption",
            description: "Encrypt sensitive data",
            isCritical: true
          }
        }
      },
      
      "Labor Laws": {
        name: "Labor & Employment Laws",
        description: "Labor law compliance",
        keywords: ["labor", "employment", "worker", "law"],
        applicableWhen: ["workers", "employees"],
        systems: {
          "Work Hour Regulations": {
            name: "Work Hour Compliance",
            description: "Track legal work hours",
            isCritical: true
          }
        }
      }
    }
  }
}