import { query } from './db';

const API_URL = process.env.BUZZERPANEL_API_URL || 'https://buzzerpanel.id/api/json.php';
const API_KEY = process.env.BUZZERPANEL_API_KEY || '';
const SECRET_KEY = process.env.BUZZERPANEL_SECRET_KEY || '';

export interface BuzzerPanelResponse {
  status: boolean;
  data: any;
}

/**
 * Sends a generic POST request to the BuzzerPanel API
 */
async function callBuzzerPanel(payload: Record<string, any>): Promise<BuzzerPanelResponse> {
  if (!API_KEY || !SECRET_KEY) {
    console.error('BuzzerPanel API configuration is missing.');
    return {
      status: false,
      data: { msg: 'BuzzerPanel API Key or Secret Key is not configured in .env' }
    };
  }

  try {
    const params = new URLSearchParams();
    params.append('api_key', API_KEY);
    params.append('secret_key', SECRET_KEY);
    
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        params.append(key, String(val));
      }
    });

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('BuzzerPanel API call failed:', error);
    return {
      status: false,
      data: { msg: error.message || 'Internal connection error to BuzzerPanel' }
    };
  }
}

/**
 * Fetch profile info and balance from BuzzerPanel
 */
export async function getProviderProfile() {
  return callBuzzerPanel({ action: 'profile' });
}

/**
 * Place a new order on BuzzerPanel
 */
export async function placeProviderOrder(
  providerServiceId: string | number,
  targetUrl: string,
  quantity: number,
  additionalParams: Record<string, any> = {}
) {
  return callBuzzerPanel({
    action: 'order',
    service: providerServiceId,
    data: targetUrl,
    quantity: quantity,
    ...additionalParams
  });
}

/**
 * Get the status of an order on BuzzerPanel
 */
export async function getProviderOrderStatus(providerOrderId: string | number) {
  return callBuzzerPanel({
    action: 'status',
    id: providerOrderId
  });
}

/**
 * Request a refill for a specific order on BuzzerPanel
 */
export async function requestProviderRefill(providerOrderId: string | number) {
  return callBuzzerPanel({
    action: 'refill',
    id: providerOrderId
  });
}

/**
 * Get status of a refill request on BuzzerPanel
 */
export async function getProviderRefillStatus(refillId: string | number) {
  return callBuzzerPanel({
    action: 'status_refill',
    id: refillId
  });
}

/**
 * Get list of all services from BuzzerPanel
 */
export async function getProviderServices() {
  return callBuzzerPanel({ action: 'services' });
}
