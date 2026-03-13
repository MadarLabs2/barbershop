require('dotenv').config();

module.exports = {
  ...require('./app.json').expo,
  plugins: ['expo-font', 'expo-video'],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    whatsappServiceUrl: process.env.EXPO_PUBLIC_WHATSAPP_SERVICE_URL || null,
  },
};
