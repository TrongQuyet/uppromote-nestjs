import { registerAs } from '@nestjs/config';

export default registerAs('aiAgent', () => ({
  // AI Agent API Configuration
  serviceApiUrl: process.env.AI_AGENT_SERVICE_API_URL || 'https://n8n.uppromote.dev',
  serviceApiKey: process.env.AI_AGENT_SERVICE_API_KEY || '782d18e0a94874b367be66b2be3e6ef6',

  // MongoDB Configuration
  mongodbUri:
    process.env.MONGODB_AI_AGENT_URI || 'mongodb://localhost:27017/ai_agent',

  // Redis Event Chat Configuration
  redisEventChat: {
    keyPrefix: process.env.AI_AGENT_REDIS_KEY_PREFIX || 'event_chat',
    ttl: parseInt(process.env.AI_AGENT_REDIS_TTL || '300', 10), // 5 minutes in seconds
    defaultWaitTime: parseInt(
      process.env.AI_AGENT_REDIS_DEFAULT_WAIT_TIME || '5',
      10,
    ),
    maxWaitTime: parseInt(process.env.AI_AGENT_REDIS_MAX_WAIT_TIME || '10', 10),
    pollInterval: parseFloat(
      process.env.AI_AGENT_REDIS_POLL_INTERVAL || '0.5',
    ),
    enableLongPolling:
      process.env.AI_AGENT_REDIS_ENABLE_LONG_POLLING !== 'false',
  },

  // Allowed shops for chat (comma-separated)
  allowedShopsChat: process.env.AI_ALLOWED_SHOP_CHAT
    ? process.env.AI_ALLOWED_SHOP_CHAT.split(',').filter(Boolean)
    : [],
}));
