import { registerAs } from '@nestjs/config';

export default registerAs('aiAgent', () => ({
  // AI Agent API Configuration
  serviceApiUrl:
    process.env.AI_AGENT_SERVICE_API_URL || 'https://n8n.uppromote.dev',
  serviceApiKey:
    process.env.AI_AGENT_SERVICE_API_KEY || '782d18e0a94874b367be66b2be3e6ef6',

  // MongoDB Configuration
  mongodbUri:
    process.env.MONGODB_AI_AGENT_URI || 'mongodb://localhost:27017/ai_agent',
}));
