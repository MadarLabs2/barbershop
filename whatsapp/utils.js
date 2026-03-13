function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('972')) cleaned = cleaned.slice(3);
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  return cleaned;
}

function formatPhoneForWhatsApp(phone) {
  const n = normalizePhone(phone);
  return n ? `972${n}` : '';
}

module.exports = { normalizePhone, formatPhoneForWhatsApp };
