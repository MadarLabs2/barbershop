const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const config = require('./config');
const { formatPhoneForWhatsApp } = require('./utils');

const app = express();
app.use(express.json());

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

let supabase = null;
if (config.SUPABASE_URL && config.SUPABASE_ANON_KEY) {
  supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
}

const OTP_MESSAGE = (code) => `קוד ההתחברות לאפליקציה BarberShop: ${code}`;

client.on('qr', (qr) => {
  console.log('\n📱 סרוק את ה-QR עם WhatsApp → מכשירים מקושרים\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp מוכן!');
});

client.on('authenticated', () => {
  console.log('🔗 WhatsApp מחובר');
});

// ============ OTP Endpoint (for BarberShop app) ============
app.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'phone required' });
  }

  const phoneCleaned = phone.replace(/\D/g, '');
  if (phoneCleaned.length < 9) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  const code = String(Math.floor(1000 + Math.random() * 9000));
  let whatsappSent = false;

  // 1. Save to Supabase otp_requests (so app can verify)
  if (supabase) {
    const { error } = await supabase.from('otp_requests').insert({
      phone: phoneCleaned,
      code,
    });
    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // 2. Send via WhatsApp if client is ready
  if (client.info?.wid) {
    try {
      const chatId = `${formatPhoneForWhatsApp(phone)}@c.us`;
      await client.sendMessage(chatId, OTP_MESSAGE(code));
      whatsappSent = true;
      console.log(`📤 OTP sent to ${phoneCleaned}`);
    } catch (err) {
      console.error('WhatsApp send error:', err.message);
    }
  } else {
    console.warn('WhatsApp not ready – OTP saved to DB, send manually via otp-panel');
  }

  res.json({ success: true, whatsappSent });
});

// ============ Reminder Endpoint (for appointment reminders) ============
app.post('/send-reminder', async (req, res) => {
  const { phone_number, message_text } = req.body;
  if (!phone_number || !message_text) {
    return res.status(400).json({ error: 'phone_number and message_text required' });
  }
  if (!client.info?.wid) {
    return res.status(503).json({ error: 'WhatsApp not ready' });
  }

  try {
    const chatId = `${formatPhoneForWhatsApp(phone_number)}@c.us`;
    await client.sendMessage(chatId, message_text);
    console.log(`📤 Reminder sent to ${phone_number}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Reminder send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({
    ready: !!(client.info?.wid),
    supabase: !!supabase,
  });
});

// Initialize WhatsApp client
client.initialize().catch((err) => {
  console.error('❌ WhatsApp init failed:', err.message);
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🌐 WhatsApp API: http://localhost:${PORT}`);
  console.log(`   POST /send-otp    - Send OTP to phone`);
  console.log(`   POST /send-reminder - Send reminder message`);
  console.log(`   GET  /health      - Check status`);
});
