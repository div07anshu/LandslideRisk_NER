import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../middleware/errorHandler';
import { getSupabaseAdminClient } from '../config/supabaseClient';

export async function subscribeToAlerts(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user) {
            throw new HttpError(401, 'Not authenticated');
        }

        const { phone_number, latitude, longitude } = req.body;

        if (!phone_number || latitude === undefined || longitude === undefined) {
            throw new HttpError(
                400,
                'Phone number, latitude and longitude are required',
            );
        }

        const supabase = getSupabaseAdminClient();

        const { data, error } = await supabase
            .from('alert_subscriptions')
            .upsert(
                {
                    user_id: req.user.id,
                    phone_number,
                    latitude,
                    longitude,
                    is_active: true,
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'user_id',
                },
            )
            .select()
            .single();

        if (error) {
            throw error;
        }

        res.status(200).json({
            success: true,
            subscription: data,
        });
    } catch (err) {
        next(err);
    }
}

export async function checkMyRisk(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        if (!req.user) {
            throw new HttpError(401, 'Not authenticated');
        }

        const supabase = getSupabaseAdminClient();

        const { data, error } = await supabase
            .from('alert_subscriptions')
            .select('phone_number, latitude, longitude, is_active')
            .eq('user_id', req.user.id)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            throw new HttpError(
                404,
                'Location alert subscription not found',
            );
        }

        if (!data.is_active) {
            throw new HttpError(
                400,
                'Location alerts are not active',
            );
        }

        const response = await fetch(
            'http://127.0.0.1:8000/api/risk/check-and-alert',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: data.phone_number,
                    latitude: data.latitude,
                    longitude: data.longitude,
                }),
            },
        );

        const riskData = (await response.json()) as {
            risk: unknown;
            alert_sent: boolean;
            sms_sid?: string;
        };

        if (!response.ok) {
            throw new HttpError(
                502,
                'Risk analysis and alert service is unavailable',
            );
        }

        res.status(200).json({
            success: true,
            location: {
                latitude: data.latitude,
                longitude: data.longitude,
            },
            risk: riskData.risk,
            alert_sent: riskData.alert_sent,
            sms_sid: riskData.sms_sid ?? null,
        });
    } catch (err) {
        next(err);
    }
}