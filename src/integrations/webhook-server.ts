import * as http from 'http';
import { verifyTwentyWebhookSignature } from './webhook-verifier';

const PORT = parseInt(process.env.WEBHOOK_PORT || '4000', 10);
const WEBHOOK_SECRET = process.env.TWENTY_WEBHOOK_SECRET || 'tbm_webhook_secret_key_992178';

export interface TwentyWebhookEvent {
  event: 'project.created' | 'project.updated' | 'project.deleted' | 'brand.created';
  data: {
    id: string;
    title?: string;
    name?: string;
    currentStage?: string;
    clientStatus?: string;
    brand?: { id: string; name: string };
    assignedTo?: { id: string; email: string };
    updatedAt?: string;
    [key: string]: any;
  };
  timestamp: string;
}

export function handleWebhookPayload(payload: TwentyWebhookEvent) {
  console.log(`[Webhook Event Received] Type: ${payload.event} for Record ID: ${payload.data.id}`);

  switch (payload.event) {
    case 'project.updated':
      console.log(` -> Project Updated: "${payload.data.title}" Stage: ${payload.data.currentStage}`);
      if (payload.data.currentStage === 'FIRST_CUT_SENT') {
        console.log(` -> [External Sync] Triggering Smartlead/Slack notification for First Cut.`);
      }
      break;

    case 'project.created':
      console.log(` -> New Project Created: "${payload.data.title}" (Brand: ${payload.data.brand?.name})`);
      break;

    case 'brand.created':
      console.log(` -> New Brand Registered: "${payload.data.name}"`);
      break;

    default:
      console.log(` -> Unhandled event: ${payload.event}`);
  }

  return { status: 'PROCESSED', event: payload.event };
}

export function createWebhookServer() {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/webhook/twenty') {
      const chunks: Buffer[] = [];

      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        const rawBody = Buffer.concat(chunks);
        const signature = req.headers['x-twenty-webhook-signature'] as string;
        const timestamp = req.headers['x-twenty-webhook-timestamp'] as string;

        // Verify HMAC
        const verification = verifyTwentyWebhookSignature(
          rawBody,
          signature,
          timestamp,
          WEBHOOK_SECRET,
        );

        if (!verification.isValid) {
          console.warn(`[Webhook Rejected] ${verification.error}`);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: verification.error }));
          return;
        }

        try {
          const body: TwentyWebhookEvent = JSON.parse(rawBody.toString('utf8'));
          const result = handleWebhookPayload(body);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (e: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
        }
      });
    } else if (req.method === 'GET' && req.url === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'OK', service: 'TBM Webhook Receiver' }));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  return server;
}

if (require.main === module) {
  const server = createWebhookServer();
  server.listen(PORT, () => {
    console.log(`🚀 TBM Webhook Receiver listening on port ${PORT}`);
    console.log(`   Endpoint: POST http://localhost:${PORT}/webhook/twenty`);
  });
}
