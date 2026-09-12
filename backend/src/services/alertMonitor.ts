import { getSupabaseAdminClient } from '../config/supabaseClient';

const AI_SERVICE_URL = 'http://127.0.0.1:8000';

const CHECK_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const ALERT_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

// Approximate bounding box covering Northeast India
const NER_LAT_MIN = 21.5;
const NER_LAT_MAX = 29.5;
const NER_LON_MIN = 88.0;
const NER_LON_MAX = 97.5;

function isInNER(latitude: number, longitude: number): boolean {
  return (
    latitude >= NER_LAT_MIN &&
    latitude <= NER_LAT_MAX &&
    longitude >= NER_LON_MIN &&
    longitude <= NER_LON_MAX
  );
}

export function startAlertMonitor(): void {
  console.log('[alerts] Automatic risk monitor started');

  checkAllSubscriptions();

  setInterval(() => {
    checkAllSubscriptions();
  }, CHECK_INTERVAL_MS);
}

async function checkAllSubscriptions(): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: subscriptions, error } = await supabase
      .from('alert_subscriptions')
      .select(
        'id, phone_number, latitude, longitude, is_active, last_alert_at',
      )
      .eq('is_active', true);

    if (error) {
      console.error('[alerts] Failed to load subscriptions:', error);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[alerts] No active subscriptions');
      return;
    }

    console.log(
      `[alerts] Checking ${subscriptions.length} active subscription(s)`,
    );

    for (const subscription of subscriptions) {
      await checkSubscription(subscription);
    }
  } catch (error) {
    console.error('[alerts] Monitor error:', error);
  }
}

async function checkSubscription(subscription: {
  id: string;
  phone_number: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  last_alert_at: string | null;
}): Promise<void> {
  try {
    // Only monitor users located in Northeast India
    if (!isInNER(subscription.latitude, subscription.longitude)) {
      console.log(
        `[alerts] Skipping subscription ${subscription.id} - outside NER`,
      );
      return;
    }

    const response = await fetch(
      `${AI_SERVICE_URL}/api/risk/check-and-alert`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: subscription.phone_number,
          latitude: subscription.latitude,
          longitude: subscription.longitude,
        }),
      },
    );

    const result = (await response.json()) as {
      success?: boolean;
      alert_sent?: boolean;
      risk?: {
        risk_level?: string;
        risk_score?: number;
      };
      sms_sid?: string;
    };

    if (!response.ok) {
      console.error(
        `[alerts] Risk check failed for subscription ${subscription.id}`,
      );
      return;
    }

    const riskLevel = result.risk?.risk_level;

    console.log(
      `[alerts] Subscription ${subscription.id}: ${riskLevel} (${result.risk?.risk_score}/100)`,
    );

    if (riskLevel !== 'HIGH') {
      return;
    }

    if (subscription.last_alert_at) {
      const lastAlertTime = new Date(
        subscription.last_alert_at,
      ).getTime();

      const timeSinceLastAlert = Date.now() - lastAlertTime;

      if (timeSinceLastAlert < ALERT_COOLDOWN_MS) {
        console.log(
          `[alerts] Alert skipped for ${subscription.id} - cooldown active`,
        );
        return;
      }
    }

    if (result.alert_sent) {
      const supabase = getSupabaseAdminClient();

      const { error } = await supabase
        .from('alert_subscriptions')
        .update({
          last_alert_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) {
        console.error(
          `[alerts] Failed to update last_alert_at for ${subscription.id}:`,
          error,
        );
      } else {
        console.log(
          `[alerts] HIGH risk alert sent to subscription ${subscription.id}`,
        );
      }
    }
  } catch (error) {
    console.error(
      `[alerts] Failed checking subscription ${subscription.id}:`,
      error,
    );
  }
}