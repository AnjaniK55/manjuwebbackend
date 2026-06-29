import express from 'express';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import mongoose from 'mongoose';
import { 
  getProjects, saveProject, updateProject, deleteProject,
  getMessages, saveMessage, updateMessage, deleteMessage, clearMessages,
  getTestimonials, saveTestimonial, updateTestimonial, deleteTestimonial,
  getArticles, saveArticle, updateArticle, deleteArticle,
  logVisitor, getVisitorStats,
  getLeads, saveLead, updateLead, deleteLead,
  getSettings, updateSettings, readTable, writeTable,
  getNotifications, saveNotification, markNotificationsRead, deleteNotification,
  getServices, saveService, updateService, deleteService,
  isMongoConnected
} from '../db.js';
import { verifyToken } from './auth.js';

const router = express.Router();

// Setup Nodemailer transporter with dynamic environment inputs
const mailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Verify Mail connection logs
mailTransporter.verify((err) => {
  if (err) {
    console.log('>>> [SMTP WARNING] Mailer SMTP credentials not configured. Email notifications will log to server terminal.');
  } else {
    console.log('>>> [SMTP STATUS] Mailer service connected successfully.');
  }
});

// Helper to send email alerts
async function sendEmailAlert(inquiryData) {
  const mailSettings = await getSettings();
  const targetEmail = mailSettings.supportEmail || 'manjuwbagency@gmail.com';
  
  const mailOptions = {
    from: '"Command Center Alerts" <no-reply@manjuwebagency.com>',
    to: targetEmail,
    subject: `New Client Brief: ${inquiryData.name} - ${inquiryData.projectType}`,
    text: `New project intake brief received:\n\nName: ${inquiryData.name}\nEmail: ${inquiryData.email}\nProject Type: ${inquiryData.projectType}\nBudget: ${inquiryData.budget}\nTimeline: ${inquiryData.timeline}\nDescription: ${inquiryData.message}\n\nReview details inside the Command Center.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fafafa;">
        <h2 style="color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 8px;">New Client Project Brief</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 6px; font-weight: bold; width: 140px;">Client Name:</td>
            <td style="padding: 6px;">${inquiryData.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold;">Email:</td>
            <td style="padding: 6px;">${inquiryData.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold;">Project Type:</td>
            <td style="padding: 6px; color: #d4af37; font-weight: bold;">${inquiryData.projectType}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold;">Budget:</td>
            <td style="padding: 6px;">${inquiryData.budget}</td>
          </tr>
          <tr>
            <td style="padding: 6px; font-weight: bold;">Timeline:</td>
            <td style="padding: 6px;">${inquiryData.timeline}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 12px; background: #fff; border-left: 4px solid #d4af37; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #888;">Brief Description</p>
          <p style="margin: 6px 0 0 0; line-height: 1.6; font-size: 13px; color: #333;">"${inquiryData.message}"</p>
        </div>
      </div>
    `
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`\n========================================\n>>> [MOCK EMAIL ALERT SENT TO: ${targetEmail}]\nSubject: ${mailOptions.subject}\nBody: ${mailOptions.text}\n========================================\n`);
      return;
    }
    await mailTransporter.sendMail(mailOptions);
    console.log(`>>> [SMTP STATUS] Project Alert email dispatched successfully to: ${targetEmail}`);
  } catch (err) {
    console.error('>>> [SMTP ERROR] Failed to dispatch project alert email:');
  }
}

// --- VISITOR TRACKING API ---
router.post('/visitors', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { page } = req.body;
    await logVisitor(ip, userAgent, page || '/');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/visitors/stats', verifyToken, async (req, res) => {
  try {
    const stats = await getVisitorStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- PROJECTS ENDPOINTS ---
router.get('/projects', async (req, res) => {
  try {
    const data = await getProjects();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/projects', verifyToken, async (req, res) => {
  try {
    const payload = { ...req.body, id: Date.now() };
    const added = await saveProject(payload);
    res.json({ success: true, project: added });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/projects/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await updateProject(id, req.body);
    if (updated) {
      return res.json({ success: true, project: updated });
    }
    res.status(404).json({ message: 'Project not found' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/projects/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await deleteProject(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- CRM INQUIRIES ENDPOINTS ---
router.get('/messages', verifyToken, async (req, res) => {
  try {
    const data = await getMessages();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rate limiting tracker for general inquiries
const messageRateLimit = {};

router.post('/messages', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (messageRateLimit[ip] && (now - messageRateLimit[ip] < 60000)) {
      return res.status(429).json({ error: 'Too many submissions. Please wait a minute before sending another message.' });
    }
    
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing required contact fields.' });
    }
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address structure.' });
    }

    messageRateLimit[ip] = now;

    const payload = {
      ...req.body,
      id: Date.now(),
      status: 'New',
      notes: '',
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
    };
    const added = await saveMessage(payload);
    
    // Save live alert notification
    await saveNotification({
      title: 'New Client Inquiry',
      message: `New client inquiry received from ${added.name}`
    });

    // Dispatch automated Nodemailer alerts
    sendEmailAlert(added);

    res.json({ success: true, message: added });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/messages/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await updateMessage(id, req.body);
    if (updated) {
      return res.json({ success: true, message: updated });
    }
    res.status(404).json({ message: 'Message not found' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/messages/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await deleteMessage(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/messages', verifyToken, async (req, res) => {
  try {
    await clearMessages();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- TESTIMONIALS ENDPOINTS ---
router.get('/testimonials', async (req, res) => {
  try {
    const data = await getTestimonials();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/testimonials', verifyToken, async (req, res) => {
  try {
    const payload = { ...req.body, id: Date.now(), published: true };
    const added = await saveTestimonial(payload);
    res.json({ success: true, testimonial: added });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/testimonials/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await updateTestimonial(id, req.body);
    if (updated) {
      return res.json({ success: true, testimonial: updated });
    }
    res.status(404).json({ message: 'Testimonial not found' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/testimonials/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await deleteTestimonial(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- BLOG ARTICLES ENDPOINTS ---
router.get('/articles', async (req, res) => {
  try {
    const data = await getArticles();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/articles', verifyToken, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };
    const added = await saveArticle(payload);
    res.json({ success: true, article: added });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/articles/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await updateArticle(id, req.body);
    if (updated) {
      return res.json({ success: true, article: updated });
    }
    res.status(404).json({ message: 'Article not found' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/articles/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await deleteArticle(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- MEDIA MANAGER ENDPOINTS ---
router.get('/media', verifyToken, (req, res) => {
  const list = readTable('media', [
    { id: 1, name: 'dashboard.png', url: '/dashboard.png', size: '45 KB' },
    { id: 2, name: 'aurafit.png', url: '/aurafit.png', size: '60 KB' },
    { id: 3, name: 'analytics.png', url: '/analytics.png', size: '55 KB' },
    { id: 4, name: 'ecommerce.png', url: '/ecommerce.png', size: '52 KB' }
  ]);
  res.json(list);
});

router.post('/media', verifyToken, (req, res) => {
  const list = readTable('media', []);
  const added = {
    id: Date.now(),
    name: req.body.name || 'custom_upload.png',
    url: req.body.url || '/analytics.png',
    size: req.body.size || '28 KB'
  };
  list.push(added);
  writeTable('media', list);
  res.json({ success: true, file: added });
});

router.delete('/media/:id', verifyToken, (req, res) => {
  const id = parseInt(req.params.id);
  let list = readTable('media', []);
  list = list.filter(m => m.id !== id);
  writeTable('media', list);
  res.json({ success: true });
});

// --- WEBSITE SETTINGS ENDPOINTS ---
router.get('/settings', async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/settings', verifyToken, async (req, res) => {
  try {
    const updated = await updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- LEADS (CHATBOT) ENDPOINTS ---
router.get('/leads', verifyToken, async (req, res) => {
  try {
    const data = await getLeads();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Rate limiting tracker for lead submissions
const leadRateLimit = {};

router.post('/leads', async (req, res) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (leadRateLimit[ip] && (now - leadRateLimit[ip] < 60000)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a minute before submitting another brief.' });
    }
    
    const { name, email, service } = req.body;
    if (!name || !email || !service) {
      return res.status(400).json({ error: 'Missing required lead intake fields.' });
    }
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email address structure.' });
    }

    leadRateLimit[ip] = now;

    const payload = {
      ...req.body,
      id: Date.now(),
      status: req.body.status || 'New',
      notes: req.body.notes || '',
      timestamp: req.body.timestamp || new Date().toISOString()
    };
    const added = await saveLead(payload);

    // Save live alert notification
    await saveNotification({
      title: 'New Chatbot Lead',
      message: `New chatbot lead captured: ${added.name} (${added.service})`
    });

    // Send email notification for new lead
    sendLeadEmailAlert(added);

    res.json({ success: true, lead: added });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/leads/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await updateLead(id, req.body);
    if (updated) {
      return res.json({ success: true, lead: updated });
    }
    res.status(404).json({ message: 'Lead not found' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/leads/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await deleteLead(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Lead email alert helper
async function sendLeadEmailAlert(lead) {
  const mailSettings = await getSettings();
  const targetEmail = mailSettings.supportEmail || 'manjuwbagency@gmail.com';

  const mailOptions = {
    from: '"Lead Bot Alert" <no-reply@manjuwebagency.com>',
    to: targetEmail,
    subject: `🔥 New Lead: ${lead.name} - ${lead.service}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; padding: 24px; border: 1px solid #eee; border-radius: 12px; background: #fafafa;">
        <h2 style="color: #d4af37; margin-bottom: 4px;">New Chatbot Lead Captured</h2>
        <p style="color: #888; font-size: 13px; margin-top: 0;">A visitor completed the lead qualification chatbot</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px; font-weight: bold; color: #555; width: 140px;">Name:</td><td style="padding: 8px;">${lead.name}</td></tr>
          <tr style="background: #f5f5f5;"><td style="padding: 8px; font-weight: bold; color: #555;">Service:</td><td style="padding: 8px; color: #d4af37; font-weight: bold;">${lead.service}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Email:</td><td style="padding: 8px;">${lead.email}</td></tr>
          <tr style="background: #f5f5f5;"><td style="padding: 8px; font-weight: bold; color: #555;">WhatsApp:</td><td style="padding: 8px;">${lead.whatsapp || 'Not provided'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Company:</td><td style="padding: 8px;">${lead.company || 'Not provided'}</td></tr>
          <tr style="background: #f5f5f5;"><td style="padding: 8px; font-weight: bold; color: #555;">Budget:</td><td style="padding: 8px;">${lead.budget}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #555;">Timeline:</td><td style="padding: 8px;">${lead.timeline}</td></tr>
        </table>
        <div style="margin-top: 20px; padding: 14px; background: #fff; border-left: 4px solid #d4af37; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #999;">Project Description</p>
          <p style="margin: 8px 0 0 0; line-height: 1.6; font-size: 13px; color: #333;">${lead.description}</p>
        </div>
      </div>
    `
  };

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`\n========================================\n>>> [LEAD EMAIL ALERT] New lead: ${lead.name} (${lead.service})\n>>> Email: ${lead.email} | Budget: ${lead.budget}\n========================================\n`);
      return;
    }
    await mailTransporter.sendMail(mailOptions);
    console.log(`>>> [SMTP] Lead alert email sent to: ${targetEmail}`);
  } catch (err) {
    console.error('>>> [SMTP ERROR] Failed to send lead alert email');
  }
}

// --- SERVICES ENDPOINTS ---
router.get('/services', async (req, res) => {
  try {
    const data = await getServices();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/services', verifyToken, async (req, res) => {
  try {
    const added = await saveService(req.body);
    res.json({ success: true, service: added });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/services/:id', verifyToken, async (req, res) => {
  try {
    const updated = await updateService(req.params.id, req.body);
    if (updated) return res.json({ success: true, service: updated });
    res.status(404).json({ message: 'Service config not found' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/services/:id', verifyToken, async (req, res) => {
  try {
    await deleteService(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- NOTIFICATIONS ENDPOINTS ---
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const data = await getNotifications();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/notifications/read', verifyToken, async (req, res) => {
  try {
    await markNotificationsRead();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/notifications/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await deleteNotification(id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- CSV EXPORT ENDPOINTS ---
router.get('/export/inquiries', verifyToken, async (req, res) => {
  try {
    const list = await getMessages();
    let csv = 'ID,Name,Email,Phone,Project Type,Budget,Timeline,Status,Date,Notes\n';
    list.forEach(m => {
      csv += `"${m.id}","${m.name}","${m.email}","${m.phone || ''}","${m.projectType || ''}","${m.budget || ''}","${m.timeline || ''}","${m.status}","${m.timestamp || ''}","${(m.notes || '').replace(/"/g, '""')}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=client_inquiries.csv');
    res.send(csv);
  } catch (e) {
    res.status(500).send('Error generating export');
  }
});

router.get('/export/visitors', verifyToken, async (req, res) => {
  try {
    let list = [];
    if (isMongoConnected) {
      const Visitor = mongoose.model('Visitor');
      list = await Visitor.find().sort({ timestamp: -1 }).limit(1000).lean();
    } else {
      list = readTable('visitors', []).reverse();
    }
    
    let csv = 'Timestamp,IP Address,Page Visited,Device Type,Browser,User Agent\n';
    list.forEach(v => {
      csv += `"${v.timestamp || ''}","${v.ip || ''}","${v.page || '/'}","${v.deviceType || 'Desktop'}","${v.browser || 'Other'}","${(v.userAgent || '').replace(/"/g, '""')}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=visitor_reports.csv');
    res.send(csv);
  } catch (e) {
    res.status(500).send('Error generating export');
  }
});

// Secure endpoint to receive base64 file uploads and write them to public/uploads
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const { name, fileData } = req.body; // fileData is base64 string
    if (!name || !fileData) {
      return res.status(400).json({ error: 'Missing name or fileData payload.' });
    }
    
    // Extract base64 content
    const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Ensure public/uploads folder exists
    const uploadsDir = path.resolve('public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create unique filename to prevent collisions
    const ext = path.extname(name) || '.png';
    const baseName = path.basename(name, ext).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const uniqueName = `${baseName}_${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);
    
    fs.writeFileSync(filePath, buffer);
    
    // Sync to dist/uploads if compiled
    const distUploads = path.resolve('dist/uploads');
    if (fs.existsSync(path.resolve('dist'))) {
      if (!fs.existsSync(distUploads)) {
        fs.mkdirSync(distUploads, { recursive: true });
      }
      fs.writeFileSync(path.join(distUploads, uniqueName), buffer);
    }

    res.json({ success: true, url: `/uploads/${uniqueName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
