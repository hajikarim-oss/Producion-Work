import * as crypto from 'crypto';

/**
 * Validates HMAC SHA-256 signature sent by Twenty webhooks
 */
export function verifyTwentyWebhookSignature(
  rawBody: string | Buffer,
  signature: string | undefined,
  timestamp: string | undefined,
  secret: string,
): { isValid: boolean; error?: string } {
  if (!signature) {
    return { isValid: false, error: 'Missing X-Twenty-Webhook-Signature header' };
  }
  if (!timestamp) {
    return { isValid: false, error: 'Missing X-Twenty-Webhook-Timestamp header' };
  }
  if (!secret) {
    return { isValid: false, error: 'Server secret is not configured' };
  }

  // Prevent replay attacks (check if within 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  const webhookTime = parseInt(timestamp, 10);
  if (Math.abs(currentTime - webhookTime) > 300) {
    return { isValid: false, error: 'Webhook timestamp expired (drift > 300s)' };
  }

  const payloadString = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  const stringToSign = `${timestamp}:${payloadString}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(stringToSign)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const receivedBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return { isValid: false, error: 'Signature length mismatch' };
  }

  const matches = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  return { isValid: matches, error: matches ? undefined : 'Invalid signature' };
}
