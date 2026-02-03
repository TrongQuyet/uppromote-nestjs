import { registerAs } from '@nestjs/config';

export default registerAs('aiAgent', () => ({
  // AI Agent API Configuration
  serviceApiUrl:
    process.env.AI_AGENT_SERVICE_API_URL || 'https://n8n.uppromote.dev',
  serviceApiKey:
    process.env.AI_AGENT_SERVICE_API_KEY || '782d1820a94873b367be66b4be3e6ef6',
}));
