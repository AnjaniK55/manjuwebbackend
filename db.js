import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';

dotenv.config();

const DATA_DIR = path.resolve('backend/data');

// Ensure database data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read JSON tables
export function readTable(tableName, defaultVal = []) {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2));
    return defaultVal;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return defaultVal;
  }
}

// Helper to write JSON tables
export function writeTable(tableName, data) {
  const filePath = path.join(DATA_DIR, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// --- MONGOOSE SCHEMAS & MODELS ---

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'administrator' }
});

const ProjectSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, default: '/dashboard.png' },
  tags: [String],
  features: [String],
  demoLink: String,
  githubLink: String,
  challenge: String,
  solution: String,
  impact: String,
  published: { type: Boolean, default: true }
});

const MessageSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  message: { type: String, required: true },
  projectType: String,
  budget: String,
  timeline: String,
  status: { type: String, default: 'New' },
  notes: String,
  timestamp: String
});

const TestimonialSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  company: String,
  location: String,
  photo: String, // Base64 or Image URL
  avatarText: String,
  text: { type: String, required: true },
  rating: { type: Number, default: 5 },
  published: { type: Boolean, default: true }
});

const ArticleSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  readTime: { type: String, default: '5 min read' },
  date: String,
  summary: String,
  content: { type: String, required: true },
  image: { type: String, default: '/analytics.png' },
  related: [Number],
  seoTitle: String,
  seoDescription: String,
  seoKeywords: String,
  published: { type: Boolean, default: true }
});

const VisitorSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  page: { type: String, default: '/' },
  deviceType: { type: String, default: 'Desktop' },
  browser: { type: String, default: 'Chrome' },
  dateString: String, // YYYY-MM-DD
  monthString: String // YYYY-MM
});

const SettingsSchema = new mongoose.Schema({
  agencyName: String,
  supportEmail: String,
  showPromotionBanner: Boolean,
  promoText: String
});

const LeadSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  service: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  whatsapp: String,
  company: String,
  description: String,
  budget: String,
  timeline: String,
  status: { type: String, default: 'New' },
  notes: String,
  conversationHistory: String,
  timestamp: { type: String, default: () => new Date().toISOString() }
});

const NotificationSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

const ServiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  icon: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  features: [String]
});

// Models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
const Testimonial = mongoose.models.Testimonial || mongoose.model('Testimonial', TestimonialSchema);
const Article = mongoose.models.Article || mongoose.model('Article', ArticleSchema);
const Visitor = mongoose.models.Visitor || mongoose.model('Visitor', VisitorSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema);

// Setup Database Connection
let isMongoConnected = false;

async function seedDefaultAdmin() {
  try {
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';
    const existing = await User.findOne({ username: adminUser });
    if (!existing) {
      const hashedPassword = await bcryptjs.hash(adminPass, 10);
      const defaultAdmin = new User({
        username: adminUser,
        password: hashedPassword,
        role: 'administrator'
      });
      await defaultAdmin.save();
      console.log(`>>> [DB SEED] Administrator account seeded successfully: ${adminUser}`);
    }
  } catch (err) {
    console.error('>>> [DB SEED ERROR] Failed to seed default admin:', err.message);
  }
}

const defaultProjects = [
  {
    id: 1,
    title: "Nexus AI Agent Orchestrator",
    category: "Web Apps",
    description: "An enterprise-grade workspace that coordinates multi-agent LLM teams, Redis vector search pipelines, and distributed memory states.",
    image: "/analytics.png",
    tags: ["React", "Node.js", "Redis", "Vector DB", "WebSockets"],
    demoLink: "#",
    githubLink: "https://github.com/AnjaniK55",
    challenge: "Coordinating context sharing and execution workflows across 1,000+ autonomous AI agent threads concurrently without latency degradation.",
    solution: "Engineered transactional WebSocket event loops, decoupled task synchronization brokers, and in-memory Redis message queues.",
    impact: "Reduced multi-agent system state synchronization latency to under 12ms avg.",
    features: ["Multi-Agent Orchestrator Portal", "Real-time Event Streaming Logs", "Vector Embedding Sync Engines", "Secure User Role Keys"]
  },
  {
    id: 2,
    title: "Aura Fit Club Portal",
    category: "Websites",
    description: "A high-end luxury fitness club landing page and booking system featuring dynamic membership schedules, class reservation forms, and trainer directories.",
    image: "/aurafit.png",
    tags: ["React", "Tailwind CSS", "Framer Motion", "Vercel"],
    demoLink: "#",
    githubLink: "https://github.com/AnjaniK55",
    challenge: "Converting raw web traffic into high-value premium memberships and guest pass bookings for a luxury boutique fitness franchise.",
    solution: "Designed a visual-first dark themed user experience with clear benefit copy, floating chat assistant triggers, and seamless forms.",
    impact: "Boosted guest-pass capture rates by 40% within the first 30 days of implementation.",
    features: ["Custom Intake Form Validation", "Interactive Class Calendars", "Stripe payment integration gateways", "Responsive navigation layout"]
  },
  {
    id: 3,
    title: "Cognitive AI Suite",
    category: "Web Apps",
    description: "Deep learning model visualization dashboard offering real-time model accuracy analytics and telemetry nodes mapping.",
    image: "/analytics.png",
    tags: ["Go", "React", "Docker", "Redis", "WebSockets"],
    demoLink: "#",
    githubLink: "https://github.com/AnjaniK55",
    challenge: "Streaming real-time neural network node configurations and weights dynamically without lagging browser rendering engines.",
    solution: "Created highly optimized WebSocket handlers in Go, utilizing JSON-binary serialization protocols for frontend streams.",
    impact: "Allowed machine learning engineers to visualize model updates with less than 50ms latency response times.",
    features: ["Dynamic WebGL Visualizations", "Go WebSocket Stream Handlers", "Performance optimized CPU layouts", "Interactive nodes hover tools"]
  },
  {
    id: 4,
    title: "Vanguard Payment Suite",
    category: "Dashboards",
    description: "Multi-tenant B2B payments orchestrator allowing global startups to accept localized bank transfers securely.",
    image: "/dashboard.png",
    tags: ["React", "Express.js", "MongoDB", "OAuth 2.0", "Docker"],
    demoLink: "#",
    githubLink: "https://github.com/AnjaniK55",
    challenge: "Maintaining PCI-DSS compliance standards while creating custom routing endpoints for international accounts.",
    solution: "Abstracted payment payload inputs through verified sandbox containers, utilizing double-token JWT validations.",
    impact: "Processed $12M+ in cross-border settlements with zero security occurrences or database drift.",
    features: ["Sandbox execution toggles", "Double-token JWT authorization controls", "Multi-tenant merchant panels", "Auto-generating invoice exports"]
  },
  {
    id: 5,
    title: "Nouveau Marketplace",
    category: "E-commerce",
    description: "High-performance headless online fashion marketplace with instant search indexing and custom product grids.",
    image: "/ecommerce.png",
    tags: ["React", "Shopify API", "Node.js", "Tailwind CSS", "Vercel"],
    demoLink: "#",
    githubLink: "https://github.com/AnjaniK55",
    challenge: "Handling severe traffic surges during flash-sale launches without breaking DB connections or increasing response lags.",
    solution: "Designed static HTML pre-generation templates, serving images via CDN edge caching layers.",
    impact: "Maintained 100% server uptime during a high-profile influencer product launch event with 50,000+ concurrent visitors.",
    features: ["Instant category filtering structures", "Headless Shopify checkout APIs", "Dynamic shopping cart controllers", "CDN static page rendering optimizations"]
  },
  {
    id: 6,
    title: "Telemetry Log Engine",
    category: "Web Apps",
    description: "Secure cloud infrastructure log collector and analytics workspace highlighting immediate server error warning codes.",
    image: "/analytics.png",
    tags: ["Go", "React", "PostgreSQL", "AWS S3", "Tailwind CSS"],
    demoLink: "#",
    githubLink: "https://github.com/AnjaniK55",
    challenge: "Storing and query-searching terabytes of historical server errors efficiently while keeping search times low.",
    solution: "Implemented time-series table partition structures in PostgreSQL and automated older logs archival routines.",
    impact: "Reduced average log lookup times from 8.2 seconds down to 230 milliseconds.",
    features: ["PostgreSQL timescaled log partitions", "AWS S3 automated archival triggers", "Full-text query search consoles", "Mobile telemetry logs viewport"]
  },
  {
    id: 7,
    title: "Aether Decentralized Vector Engine",
    category: "Web Apps",
    description: "Distributed database query portal executing similarity searches across large dimensional AI embeddings.",
    image: "/analytics.png",
    tags: ["Rust", "React", "gRPC", "Kubernetes", "HNSW"],
    demoLink: "#",
    githubLink: "https://github.com/AnjaniK55",
    challenge: "Maintaining similarity query latencies under 5ms for datasets exceeding 100 million vector coordinates.",
    solution: "Implemented HNSW index partition algorithms in Rust, communicating via gRPC network streams to React dashboards.",
    impact: "Improved similarity query throughput by 300% compared to traditional vector database engines.",
    features: ["Similarity search interface portals", "Dynamic index rebuild timers", "Real-time coordinate maps", "Custom cluster health metrics"]
  },
  {
    id: 8,
    title: "Helios Cloud CDN Cache Router",
    category: "Dashboards",
    description: "Custom edge proxy routing dashboard displaying active traffic requests, cached hits ratios, and geo-ip coordinates.",
    image: "/dashboard.png",
    tags: ["React", "Express.js", "Redis", "GeoIP", "Chart.js"],
    demoLink: "#",
    githubLink: "https://github.com/AnjaniK55",
    challenge: "Visualizing live global request routing spikes and hit ratios across 20+ edge locations simultaneously.",
    solution: "Configured local cache databases utilizing dynamic Redis hashes synced via SSE event streams to Chart.js widgets.",
    impact: "Allowed cache administrators to identify invalidation bottlenecks inside 2 seconds.",
    features: ["Global geo-location telemetry plots", "Real-time edge cache invalidation controls", "Live chart update loops", "Detailed log level filtering consoles"]
  }
];

const defaultTestimonials = [
  {
    id: 1,
    name: "Sarah Jenkins",
    role: "CTO",
    company: "Apex Healthcare Solutions",
    location: "New York, USA",
    avatarText: "SJ",
    text: "Manju Web Agency's full-stack expertise completely transformed our platform's performance. They refactored our core React frontend and PostgreSQL databases, cutting dashboard loading times down to sub-second speeds. An absolute elite freelance partner.",
    rating: 5
  },
  {
    id: 2,
    name: "Hiroshi Tanaka",
    role: "Director of Engineering",
    company: "Quantum AI Labs",
    location: "Tokyo, Japan",
    avatarText: "HT",
    text: "We contracted Manju Web Agency to architect a real-time Go-based telemetry dashboard. The speed, security, and cleanliness of their code exceeded our expectations. They have excellent command over microservices, and their communication across time zones was seamless.",
    rating: 5
  },
  {
    id: 3,
    name: "Clara Dupont",
    role: "E-Commerce Director",
    company: "Nouveau Mode",
    location: "Paris, France",
    avatarText: "CD",
    text: "Transitioning to a headless Shopify storefront was a daunting task, but Manju Web Agency made it seamless. They designed a lightning-fast frontend that improved our checkouts by 18% and automated our product synchronization workflows. Uncompromising quality.",
    rating: 5
  }
];

const defaultArticles = [
  {
    id: 1,
    title: "Scaling Next.js App Router to 5M Daily Inquiries",
    category: "Frontend",
    readTime: "6 min read",
    date: "June 25, 2026",
    summary: "An in-depth review of layout caching headers, ISR pipelines, and server component memory pooling on AWS Amplify infrastructures.",
    content: "Next.js App Router introduces powerful server component architectures, but high concurrent load requests require strategic cache strategies. By configuring stale-while-revalidate headers at the CDN edge and leveraging incremental static regeneration, we decreased our server loads by 75% for custom dashboard builds. In this article, we map the routing parameters and database pool controls that prevent cluster scaling crashes.",
    related: [2, 3]
  },
  {
    id: 2,
    title: "Spring Boot OAuth2 SSO Security Orchestration",
    category: "Backend",
    readTime: "8 min read",
    date: "May 18, 2026",
    summary: "How to configure double-token JWT validations, dynamic role authorities, and stateless session scopes for microservices.",
    content: "Security is non-negotiable for enterprise SaaS systems. Using Spring Security paired with JWT tokens, we built a zero-session trust architecture that validates routing claims in under 5ms. We cover dynamic user scopes, database authority caching, and configuring fallback filters to isolate malicious clients automatically.",
    related: [1, 4]
  },
  {
    id: 3,
    title: "PostgreSQL Database Partitioning Patterns for High-Scale Shops",
    category: "Database",
    readTime: "5 min read",
    date: "April 12, 2026",
    summary: "A practical guide to time-series table partition structures, automated log archives, and query index performance audits.",
    content: "When tables cross 50 million records, standard query lookups stall. By partitioning the sales database by transaction months and indexing search coordinates, we reduced lookup metrics from 8.4 seconds down to 210ms. Here is the step-by-step SQL migration checklist.",
    related: [1, 2]
  },
  {
    id: 5,
    title: "Architecting Zero-Trust APIs for High-Load Enterprises",
    category: "Architecture",
    readTime: "7 min read",
    date: "March 20, 2026",
    summary: "A deep dive into building decentralized API security with key-rotation triggers, client rate-limiting nodes, and token claims validation.",
    content: "Zero-trust environments require constant verification. In this technical review, we document the implementation of OAuth2 authorization scopes, client-side signature checks, and JWT access tokens with Redis caching to authorize microservices in under 2ms. We examine configuration pipelines that handle up to 10k concurrent authorization handshakes safely.",
    related: [2, 7]
  },
  {
    id: 6,
    title: "Optimizing Redis Memory Spikes in Event-Driven Systems",
    category: "Database",
    readTime: "5 min read",
    date: "February 14, 2026",
    summary: "Resolving memory exhaustion crashes in high-throughput event buses using eviction pipelines and binary payload structures.",
    content: "High frequency message buses can quickly exhaust Redis memory if data structures are not optimized. By switching from standard JSON strings to binary Protocol Buffers and configuring volatile-lru memory eviction models, we cut active memory overhead by 68%. This guide walks through configuring payload schemas and tuning Redis settings for zero-data-loss streaming.",
    related: [3, 7]
  },
  {
    id: 7,
    title: "Designing Smooth Web UIs with Custom GPU Shaders",
    category: "Frontend",
    readTime: "6 min read",
    date: "January 10, 2026",
    summary: "Creating premium interactive 3D elements and background distortions with WebGL shaders and smooth linear interpolation.",
    content: "To stand out as a top 1% developer, generic CSS animations are not enough. We implement custom vertex and fragment shaders using WebGL/Three.js to render premium interactive backgrounds with mouse-movement parallax. We cover math controls, viewport scaling ratios, and frame rate optimization techniques that keep browser rendering at a solid 60fps.",
    related: [1, 5]
  },
  {
    id: 4,
    title: "Managing Connection Pools in Node.js Microservices",
    category: "Backend",
    readTime: "4 min read",
    date: "March 05, 2026",
    summary: "Preventing thread exhaustion and memory leaks when integrating third-party rate-limited checkout endpoints.",
    content: "Thread pooling anomalies can silently crash Node microservices under high sales surges. We explore cluster configurations, rate-limiting handlers using Redis buffers, and dynamic keep-alive settings that ensure backend connections stay reliable under traffic bursts.",
    related: [2, 6]
  }
];

function seedLocalDefaultAdmin() {
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin123';
  const users = readTable('users', []);
  const existing = users.find(u => u.username === adminUser);
  if (!existing) {
    bcryptjs.hash(adminPass, 10, (err, hashedPassword) => {
      if (!err) {
        users.push({
          username: adminUser,
          password: hashedPassword,
          role: 'administrator'
        });
        writeTable('users', users);
        console.log(`>>> [LOCAL SEED] Local administrator account seeded: ${adminUser}`);
      }
    });
  }
}

function seedLocalDefaultData() {
  // Projects
  const projects = readTable('projects', []);
  if (projects.length === 0) {
    writeTable('projects', defaultProjects);
    console.log('>>> [LOCAL SEED] Default projects seeded.');
  }
  // Testimonials
  const testimonials = readTable('testimonials', []);
  if (testimonials.length === 0) {
    writeTable('testimonials', defaultTestimonials);
    console.log('>>> [LOCAL SEED] Default testimonials seeded.');
  }
  // Articles
  const articles = readTable('articles', []);
  if (articles.length === 0) {
    writeTable('articles', defaultArticles);
    console.log('>>> [LOCAL SEED] Default articles seeded.');
  }
}

async function seedDefaultCollections() {
  try {
    // 1. Projects
    const projectCount = await Project.countDocuments({});
    if (projectCount === 0) {
      await Project.insertMany(defaultProjects);
      console.log('>>> [DB SEED] Default projects seeded successfully.');
    }

    // 2. Testimonials
    const testimonialCount = await Testimonial.countDocuments({});
    if (testimonialCount === 0) {
      await Testimonial.insertMany(defaultTestimonials);
      console.log('>>> [DB SEED] Default testimonials seeded successfully.');
    }

    // 3. Articles (Blog)
    const articleCount = await Article.countDocuments({});
    if (articleCount === 0) {
      await Article.insertMany(defaultArticles);
      console.log('>>> [DB SEED] Default articles seeded successfully.');
    }
  } catch (err) {
    console.error('>>> [DB SEED ERROR] Failed to seed default collections:', err.message);
  }
}

// Run database connection in the background so it doesn't block Express server startup
const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      console.log('>>> [DB STATUS] Connecting to MongoDB Atlas...');
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of hanging
        socketTimeoutMS: 45000,
      });
      isMongoConnected = true;
      console.log('>>> [DB STATUS] Connected to MongoDB database successfully.');
      await seedDefaultAdmin();
      await seedDefaultCollections();
    } catch (err) {
      console.error('>>> [DB WARNING] MongoDB Connection failed. Switching to Local JSON files. Error:', err.message);
      seedLocalDefaultAdmin();
      seedLocalDefaultData();
    }
  } else {
    console.log('>>> [DB STATUS] MONGODB_URI not configured. Using Local JSON filesystem.');
    seedLocalDefaultAdmin();
    seedLocalDefaultData();
  }
};

connectDB();

// --- ABSTRACTED REPOSITORY PATTERN WRAPPERS ---

// Auth
export async function getUserByUsername(username) {
  if (isMongoConnected) return await User.findOne({ username }).lean();
  const list = readTable('users', []);
  return list.find(u => u.username === username) || null;
}

// Projects
export async function getProjects() {
  if (isMongoConnected) return await Project.find().lean();
  return readTable('projects', []);
}
export async function saveProject(data) {
  if (isMongoConnected) {
    const item = new Project(data);
    return await item.save();
  }
  const list = readTable('projects', []);
  list.push(data);
  writeTable('projects', list);
  return data;
}
export async function updateProject(id, data) {
  if (isMongoConnected) return await Project.findOneAndUpdate({ id }, data, { new: true });
  const list = readTable('projects', []);
  const idx = list.findIndex(p => p.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    writeTable('projects', list);
    return list[idx];
  }
  return null;
}
export async function deleteProject(id) {
  if (isMongoConnected) return await Project.deleteOne({ id });
  const list = readTable('projects', []);
  const filtered = list.filter(p => p.id !== id);
  writeTable('projects', filtered);
}

// CRM Messages
export async function getMessages() {
  if (isMongoConnected) return await Message.find().sort({ id: -1 }).lean();
  return readTable('messages', []).reverse();
}
export async function saveMessage(data) {
  if (isMongoConnected) {
    const item = new Message(data);
    return await item.save();
  }
  const list = readTable('messages', []);
  list.push(data);
  writeTable('messages', list);
  return data;
}
export async function updateMessage(id, data) {
  if (isMongoConnected) return await Message.findOneAndUpdate({ id }, data, { new: true });
  const list = readTable('messages', []);
  const idx = list.findIndex(m => m.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    writeTable('messages', list);
    return list[idx];
  }
  return null;
}
export async function deleteMessage(id) {
  if (isMongoConnected) return await Message.deleteOne({ id });
  const list = readTable('messages', []);
  const filtered = list.filter(m => m.id !== id);
  writeTable('messages', filtered);
}
export async function clearMessages() {
  if (isMongoConnected) return await Message.deleteMany({});
  writeTable('messages', []);
}

// Testimonials
export async function getTestimonials() {
  if (isMongoConnected) return await Testimonial.find().lean();
  return readTable('testimonials', []);
}
export async function saveTestimonial(data) {
  if (isMongoConnected) {
    const item = new Testimonial(data);
    return await item.save();
  }
  const list = readTable('testimonials', []);
  list.push(data);
  writeTable('testimonials', list);
  return data;
}
export async function updateTestimonial(id, data) {
  if (isMongoConnected) return await Testimonial.findOneAndUpdate({ id }, data, { new: true });
  const list = readTable('testimonials', []);
  const idx = list.findIndex(t => t.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    writeTable('testimonials', list);
    return list[idx];
  }
  return null;
}
export async function deleteTestimonial(id) {
  if (isMongoConnected) return await Testimonial.deleteOne({ id });
  const list = readTable('testimonials', []);
  const filtered = list.filter(t => t.id !== id);
  writeTable('testimonials', filtered);
}

// Articles
export async function getArticles() {
  if (isMongoConnected) return await Article.find().lean();
  return readTable('articles', []);
}
export async function saveArticle(data) {
  if (isMongoConnected) {
    const item = new Article(data);
    return await item.save();
  }
  const list = readTable('articles', []);
  list.push(data);
  writeTable('articles', list);
  return data;
}
export async function updateArticle(id, data) {
  if (isMongoConnected) return await Article.findOneAndUpdate({ id }, data, { new: true });
  const list = readTable('articles', []);
  const idx = list.findIndex(a => a.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    writeTable('articles', list);
    return list[idx];
  }
  return null;
}
export async function deleteArticle(id) {
  if (isMongoConnected) return await Article.deleteOne({ id });
  const list = readTable('articles', []);
  const filtered = list.filter(a => a.id !== id);
  writeTable('articles', filtered);
}

// Visitor stats tracking
export async function logVisitor(ip, userAgent, page = '/') {
  const now = new Date();
  const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const monthString = dateString.substring(0, 7); // YYYY-MM

  let deviceType = 'Desktop';
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    deviceType = 'Mobile';
  } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    deviceType = 'Tablet';
  }

  let browser = 'Other';
  if (/edge|edg/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/opr|opera/i.test(userAgent)) {
    browser = 'Opera';
  } else if (/chrome|crios/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox|iceweasel|fxios/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/msie|trident/i.test(userAgent)) {
    browser = 'IE';
  }

  const data = {
    id: Date.now(),
    timestamp: now,
    ip: ip || '127.0.0.1',
    userAgent: userAgent || 'Unknown Browser',
    page: page || '/',
    deviceType,
    browser,
    dateString,
    monthString
  };

  if (isMongoConnected) {
    const item = new Visitor(data);
    await item.save();
    return;
  }
  
  const list = readTable('visitors', []);
  list.push(data);
  writeTable('visitors', list);
}

export async function getVisitorStats() {
  if (isMongoConnected) {
    const total = await Visitor.countDocuments({});
    
    const now = new Date();
    const currentMonth = now.toISOString().substring(0, 7);
    const monthly = await Visitor.countDocuments({ monthString: currentMonth });

    const currentDay = now.toISOString().split('T')[0];
    const daily = await Visitor.countDocuments({ dateString: currentDay });

    // Last 7 days counts
    const statsList = await Visitor.aggregate([
      { $group: { _id: '$dateString', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 7 }
    ]);
    const weeklyChart = statsList.map(s => ({ date: s._id, count: s.count })).reverse();

    // Device split
    const deviceGroups = await Visitor.aggregate([
      { $group: { _id: '$deviceType', count: { $sum: 1 } } }
    ]);
    const deviceStats = {};
    deviceGroups.forEach(g => { deviceStats[g._id || 'Desktop'] = g.count; });

    // Browser split
    const browserGroups = await Visitor.aggregate([
      { $group: { _id: '$browser', count: { $sum: 1 } } }
    ]);
    const browserStats = {};
    browserGroups.forEach(g => { browserStats[g._id || 'Other'] = g.count; });

    // Popular pages
    const pageGroups = await Visitor.aggregate([
      { $group: { _id: '$page', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    const popularPages = pageGroups.map(g => ({ page: g._id || '/', count: g.count }));

    return { total, monthly, daily, weeklyChart, deviceStats, browserStats, popularPages };
  }

  // Fallback JSON stats
  const list = readTable('visitors', []);
  const now = new Date();
  const currentMonth = now.toISOString().substring(0, 7);
  const currentDay = now.toISOString().split('T')[0];

  const total = list.length;
  const monthly = list.filter(v => v.monthString === currentMonth).length;
  const daily = list.filter(v => v.dateString === currentDay).length;

  // Last 7 days counts
  const dayGroups = {};
  list.forEach(v => {
    dayGroups[v.dateString] = (dayGroups[v.dateString] || 0) + 1;
  });
  const weeklyChart = Object.keys(dayGroups)
    .sort()
    .slice(-7)
    .map(date => ({ date, count: dayGroups[date] }));

  // Device stats
  const deviceStats = {};
  list.forEach(v => {
    const dev = v.deviceType || 'Desktop';
    deviceStats[dev] = (deviceStats[dev] || 0) + 1;
  });

  // Browser stats
  const browserStats = {};
  list.forEach(v => {
    const br = v.browser || 'Other';
    browserStats[br] = (browserStats[br] || 0) + 1;
  });

  // Popular pages
  const pageCounts = {};
  list.forEach(v => {
    const pg = v.page || '/';
    pageCounts[pg] = (pageCounts[pg] || 0) + 1;
  });
  const popularPages = Object.keys(pageCounts)
    .map(page => ({ page, count: pageCounts[page] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return { total, monthly, daily, weeklyChart, deviceStats, browserStats, popularPages };
}

// Settings
export async function getSettings() {
  if (isMongoConnected) {
    const s = await Settings.findOne({});
    if (s) return s.toObject();
  }
  return readTable('settings', {
    agencyName: 'Manju Web Agency',
    supportEmail: 'manjuwbagency@gmail.com',
    showPromotionBanner: true,
    promoText: 'Top 1% Bespoke SaaS Development Partner'
  });
}

export async function updateSettings(data) {
  if (isMongoConnected) {
    return await Settings.findOneAndUpdate({}, data, { upsert: true, new: true });
  }
  writeTable('settings', data);
  return data;
}

// Leads (Chatbot)
export async function getLeads() {
  if (isMongoConnected) return await Lead.find().sort({ id: -1 }).lean();
  return readTable('leads', []).reverse();
}
export async function saveLead(data) {
  if (isMongoConnected) {
    const item = new Lead(data);
    return await item.save();
  }
  const list = readTable('leads', []);
  list.push(data);
  writeTable('leads', list);
  return data;
}
export async function updateLead(id, data) {
  if (isMongoConnected) return await Lead.findOneAndUpdate({ id }, data, { new: true });
  const list = readTable('leads', []);
  const idx = list.findIndex(l => l.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    writeTable('leads', list);
    return list[idx];
  }
  return null;
}
export async function deleteLead(id) {
  if (isMongoConnected) return await Lead.deleteOne({ id });
  const list = readTable('leads', []);
  const filtered = list.filter(l => l.id !== id);
  writeTable('leads', filtered);
}

// Notifications
export async function getNotifications() {
  if (isMongoConnected) return await Notification.find().sort({ timestamp: -1 }).lean();
  return readTable('notifications', []).reverse();
}

export async function saveNotification(data) {
  const payload = {
    id: Date.now(),
    title: data.title,
    message: data.message,
    read: false,
    timestamp: new Date()
  };
  if (isMongoConnected) {
    const item = new Notification(payload);
    return await item.save();
  }
  const list = readTable('notifications', []);
  list.push(payload);
  writeTable('notifications', list);
  return payload;
}

export async function markNotificationsRead() {
  if (isMongoConnected) {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    return;
  }
  const list = readTable('notifications', []);
  const updated = list.map(n => ({ ...n, read: true }));
  writeTable('notifications', updated);
}

export async function deleteNotification(id) {
  if (isMongoConnected) return await Notification.deleteOne({ id });
  const list = readTable('notifications', []);
  const filtered = list.filter(n => n.id !== id);
  writeTable('notifications', filtered);
}

// Services CRUD
export async function getServices() {
  if (isMongoConnected) return await Service.find().lean();
  return readTable('services', [
    {
      id: "service-web-dev",
      category: "webDevelopment",
      icon: "Globe",
      title: "Business Websites",
      description: "High-end corporate websites and landing pages built for extreme speed, visual prestige, and search engine domination.",
      features: [
        "Headless CMS Integration (Strapi, Sanity)",
        "Flawless Mobile Responsive Layouts",
        "Next.js Static Site Generation (SSG)",
        "Strict Search Engine Optimization (SEO)"
      ]
    },
    {
      id: "service-web-apps",
      category: "webDevelopment",
      icon: "Cpu",
      title: "Web Applications",
      description: "Robust, custom-built software architectures and SaaS applications designed to handle thousands of concurrent operations.",
      features: [
        "Stateful React / Redux Frontends",
        "Fast REST & GraphQL API Design",
        "Scalable Server Frameworks (Node, Express)",
        "Database Query Optimization & Safety"
      ]
    },
    {
      id: "service-ecommerce",
      category: "webDevelopment",
      icon: "ShoppingBag",
      title: "E-commerce Solutions",
      description: "Bespoke digital storefronts and sales pipelines that provide friction-free checkout workflows and automate back-office operations.",
      features: [
        "Shopify Headless or Custom Storefronts",
        "Stripe, PayPal, and Apple Pay Integration",
        "Real-time Inventory & Shipping Sync",
        "Optimized Multi-step Checkout Funnels"
      ]
    },
    {
      id: "service-video",
      category: "creative",
      icon: "Video",
      title: "Professional Video Editing",
      description: "Professional video editing solutions and motion graphics for businesses, brands, and marketing campaigns.",
      features: [
        "Promotional Videos & Commercials",
        "Social Media Reels & Shorts Dynamic Cuts",
        "Product Advertisements & Mockups",
        "Motion Graphics & Fluid Transitions"
      ]
    },
    {
      id: "service-ai-graphics",
      category: "creative",
      icon: "Palette",
      title: "AI Image Creation & Design",
      description: "Custom AI generated visual assets and premium graphic designs optimized for marketing campaigns.",
      features: [
        "Midjourney / DALL-E Generative Prompts",
        "Social Media Brand Assets",
        "Bespoke Website Custom Illustration",
        "Marketing Banner Graphics"
      ]
    },
    {
      id: "service-marketing-visuals",
      category: "creative",
      icon: "Sparkles",
      title: "Marketing Visuals & Identity",
      description: "Premium visual strategies, logo packages, and visual brand assets that differentiate businesses from competitors.",
      features: [
        "Vector Logo & Visual Guidelines",
        "Newsletter Templates Design",
        "Slide Decks & Pitch Presentations",
        "Custom SVG Illustrations"
      ]
    }
  ]);
}

export async function saveService(data) {
  if (isMongoConnected) {
    const item = new Service(data);
    return await item.save();
  }
  const list = await getServices();
  list.push(data);
  writeTable('services', list);
  return data;
}

export async function updateService(id, data) {
  if (isMongoConnected) return await Service.findOneAndUpdate({ id }, data, { new: true });
  const list = await getServices();
  const idx = list.findIndex(s => s.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...data };
    writeTable('services', list);
    return list[idx];
  }
  return null;
}

export async function deleteService(id) {
  if (isMongoConnected) return await Service.deleteOne({ id });
  const list = await getServices();
  const filtered = list.filter(s => s.id !== id);
  writeTable('services', filtered);
}

export { isMongoConnected };
