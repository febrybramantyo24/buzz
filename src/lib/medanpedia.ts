const API_URL = process.env.MEDANPEDIA_API_URL || 'https://api.medanpedia.co.id';
const API_ID = process.env.MEDANPEDIA_API_ID || '';
const API_KEY = process.env.MEDANPEDIA_API_KEY || '';

export interface MedanPediaResponse {
  status: boolean;
  data: any;
}

/**
 * Sends a POST request to MedanPedia API
 */
async function callMedanPedia(action: string, payload: Record<string, any>): Promise<MedanPediaResponse> {
  if (!API_KEY || !API_ID) {
    return {
      status: false,
      data: { msg: 'MedanPedia API ID or API Key is not configured in .env' }
    };
  }

  try {
    const params = new URLSearchParams();
    params.append('api_id', API_ID);
    params.append('api_key', API_KEY);
    
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        params.append(key, String(val));
      }
    });

    const endpoint = `${API_URL}/${action}`;

    const response = await fetch(endpoint, {
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
    console.error(`MedanPedia ${action} API call failed:`, error);
    return {
      status: false,
      data: { msg: error.message || `Internal connection error to MedanPedia ${action}` }
    };
  }
}

/**
 * Fetch profile info and balance from MedanPedia
 */
export async function getMedanPediaProfile() {
  return callMedanPedia('profile', {});
}

/**
 * Place a new order on MedanPedia
 */
export async function placeMedanPediaOrder(
  providerServiceId: string | number,
  targetUrl: string,
  quantity: number,
  additionalParams: Record<string, any> = {}
) {
  return callMedanPedia('order', {
    service: providerServiceId,
    target: targetUrl,
    data: targetUrl,
    quantity: quantity,
    ...additionalParams
  });
}

/**
 * Get status of an order on MedanPedia
 */
export async function getMedanPediaOrderStatus(providerOrderId: string | number) {
  return callMedanPedia('status', {
    id: providerOrderId
  });
}

/**
 * Get list of all services from MedanPedia
 */
export async function getMedanPediaServices() {
  return callMedanPedia('services', {});
}
