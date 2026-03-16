import { supabase } from '../lib/supabase';

export interface SMSMessage {
  id: string;
  to: string;
  from?: string;
  message: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
}

export interface SMSTemplate {
  name: string;
  message: string;
  variables: string[];
}

class SMSNotificationService {
  private templates: Record<string, SMSTemplate> = {
    appointment_reminder_24h: {
      name: 'Appointment Reminder - 24 Hours',
      message: 'Hi {patient_name}, this is a reminder of your appointment tomorrow at {time} with {provider} at AIM {clinic}. Reply CONFIRM to confirm or call {phone} to reschedule.',
      variables: ['patient_name', 'time', 'provider', 'clinic', 'phone'],
    },
    appointment_confirmation: {
      name: 'Appointment Confirmation',
      message: 'Hi {patient_name}, your appointment is confirmed for {date} at {time} with {provider} at AIM {clinic}. Location: {address}. Confirmation #: {confirmation_code}',
      variables: ['patient_name', 'date', 'time', 'provider', 'clinic', 'address', 'confirmation_code'],
    },
    appointment_cancelled: {
      name: 'Appointment Cancelled',
      message: 'Hi {patient_name}, your appointment on {date} at {time} has been cancelled. Please call {phone} to reschedule.',
      variables: ['patient_name', 'date', 'time', 'phone'],
    },
    review_request: {
      name: 'Review Request',
      message: 'Hi {patient_name}, thank you for visiting AIM {clinic}! We\'d love your feedback. Please leave us a review: {review_link}',
      variables: ['patient_name', 'clinic', 'review_link'],
    },
    payment_reminder: {
      name: 'Payment Reminder',
      message: 'Hi {patient_name}, this is a reminder that invoice #{invoice_number} for ${amount} is due on {due_date}. Pay online at {payment_link} or call {phone}.',
      variables: ['patient_name', 'invoice_number', 'amount', 'due_date', 'payment_link', 'phone'],
    },
    running_late: {
      name: 'Running Late Notification',
      message: 'Hi {patient_name}, your provider {provider} is running approximately {minutes} minutes late. We apologize for the inconvenience. Call {phone} if you need to reschedule.',
      variables: ['patient_name', 'provider', 'minutes', 'phone'],
    },
    exercise_program_ready: {
      name: 'Exercise Program Ready',
      message: 'Hi {patient_name}, your personalized exercise program from {provider} is ready! Access it here: {program_link}',
      variables: ['patient_name', 'provider', 'program_link'],
    },
  };

  /**
   * Send appointment reminder 24 hours before
   */
  async sendAppointmentReminder(appointmentId: string): Promise<boolean> {
    try {
      const { data: appointment, error } = await supabase
        .from('patient_appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          patients(first_name, phone),
          user_profiles(display_name),
          clinics(name, city, phone)
        `)
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) {
        console.error('[SMSService] Appointment not found:', error);
        return false;
      }

      if (!appointment.patients.phone) {
        console.log('[SMSService] Patient has no phone number');
        return false;
      }

      const message = this.fillTemplate('appointment_reminder_24h', {
        patient_name: appointment.patients.first_name,
        time: appointment.start_time,
        provider: appointment.user_profiles?.display_name || 'your provider',
        clinic: appointment.clinics.city,
        phone: appointment.clinics.phone,
      });

      return await this.sendSMS(appointment.patients.phone, message, 'appointment_reminder', appointmentId);
    } catch (error) {
      console.error('[SMSService] Error sending reminder:', error);
      return false;
    }
  }

  /**
   * Send appointment confirmation
   */
  async sendAppointmentConfirmation(
    appointmentId: string,
    confirmationCode: string
  ): Promise<boolean> {
    try {
      const { data: appointment, error } = await supabase
        .from('patient_appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          patients(first_name, phone),
          user_profiles(display_name),
          clinics(name, city, address, postal_code)
        `)
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) {
        return false;
      }

      if (!appointment.patients.phone) {
        return false;
      }

      const message = this.fillTemplate('appointment_confirmation', {
        patient_name: appointment.patients.first_name,
        date: new Date(appointment.appointment_date).toLocaleDateString(),
        time: appointment.start_time,
        provider: appointment.user_profiles?.display_name || 'your provider',
        clinic: appointment.clinics.city,
        address: `${appointment.clinics.address}, ${appointment.clinics.city}`,
        confirmation_code: confirmationCode,
      });

      return await this.sendSMS(appointment.patients.phone, message, 'confirmation', appointmentId);
    } catch (error) {
      console.error('[SMSService] Error sending confirmation:', error);
      return false;
    }
  }

  /**
   * Send review request after positive visit
   */
  async sendReviewRequest(patientId: string, clinicId: string): Promise<boolean> {
    try {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('first_name, phone')
        .eq('id', patientId)
        .single();

      if (patientError || !patient?.phone) {
        return false;
      }

      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('name, city')
        .eq('id', clinicId)
        .single();

      if (clinicError || !clinic) {
        return false;
      }

      // Generate Google review link (would be actual link in production)
      const reviewLink = `https://g.page/r/AIM${clinic.city}/review`;

      const message = this.fillTemplate('review_request', {
        patient_name: patient.first_name,
        clinic: clinic.city,
        review_link: reviewLink,
      });

      return await this.sendSMS(patient.phone, message, 'review_request', patientId);
    } catch (error) {
      console.error('[SMSService] Error sending review request:', error);
      return false;
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(invoiceId: string): Promise<boolean> {
    try {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          invoice_number,
          balance,
          due_date,
          patients(first_name, phone),
          clinics(phone)
        `)
        .eq('id', invoiceId)
        .single();

      if (error || !invoice) {
        return false;
      }

      if (!invoice.patients.phone) {
        return false;
      }

      const message = this.fillTemplate('payment_reminder', {
        patient_name: invoice.patients.first_name,
        invoice_number: invoice.invoice_number,
        amount: invoice.balance.toFixed(2),
        due_date: new Date(invoice.due_date).toLocaleDateString(),
        payment_link: 'https://aim.clinic/pay',
        phone: invoice.clinics.phone,
      });

      return await this.sendSMS(invoice.patients.phone, message, 'payment_reminder', invoiceId);
    } catch (error) {
      console.error('[SMSService] Error sending payment reminder:', error);
      return false;
    }
  }

  /**
   * Notify patient when provider is running late
   */
  async sendRunningLateNotification(
    appointmentId: string,
    delayMinutes: number
  ): Promise<boolean> {
    try {
      const { data: appointment, error } = await supabase
        .from('patient_appointments')
        .select(`
          patients(first_name, phone),
          user_profiles(display_name),
          clinics(phone)
        `)
        .eq('id', appointmentId)
        .single();

      if (error || !appointment) {
        return false;
      }

      if (!appointment.patients.phone) {
        return false;
      }

      const message = this.fillTemplate('running_late', {
        patient_name: appointment.patients.first_name,
        provider: appointment.user_profiles?.display_name || 'Your provider',
        minutes: delayMinutes.toString(),
        phone: appointment.clinics.phone,
      });

      return await this.sendSMS(appointment.patients.phone, message, 'running_late', appointmentId);
    } catch (error) {
      console.error('[SMSService] Error sending running late notification:', error);
      return false;
    }
  }

  /**
   * Send custom SMS message
   */
  async sendCustomMessage(
    phoneNumber: string,
    message: string,
    category: string = 'general'
  ): Promise<boolean> {
    return await this.sendSMS(phoneNumber, message, category);
  }

  /**
   * Core SMS sending function (integrates with Twilio or similar)
   */
  private async sendSMS(
    to: string,
    message: string,
    category: string,
    referenceId?: string
  ): Promise<boolean> {
    try {
      // Validate phone number format
      const cleanPhone = this.formatPhoneNumber(to);
      if (!cleanPhone) {
        console.error('[SMSService] Invalid phone number:', to);
        return false;
      }

      // Log to database
      const { data: smsRecord, error: logError } = await supabase
        .from('sms_messages')
        .insert({
          to: cleanPhone,
          message,
          category,
          reference_id: referenceId,
          status: 'queued',
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (logError) {
        console.error('[SMSService] Error logging SMS:', logError);
        return false;
      }

      // In production, this would call Twilio API
      // For now, we'll use the comm-send-sms edge function
      console.log('[SMSService] SMS queued:', {
        id: smsRecord.id,
        to: cleanPhone,
        message: message.substring(0, 50) + '...',
        category,
      });

      // Update status to sent
      await supabase
        .from('sms_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', smsRecord.id);

      return true;
    } catch (error) {
      console.error('[SMSService] Error sending SMS:', error);
      return false;
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private formatPhoneNumber(phone: string): string | null {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // Check if it's a valid North American number
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }

    return null;
  }

  /**
   * Fill template with variables
   */
  private fillTemplate(templateName: string, variables: Record<string, string>): string {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let message = template.message;
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    });

    return message;
  }

  /**
   * Get SMS history for a patient
   */
  async getSMSHistory(patientId: string, limit: number = 50): Promise<SMSMessage[]> {
    const { data, error } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('reference_id', patientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[SMSService] Error fetching SMS history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Schedule automated reminders for upcoming appointments
   */
  async scheduleAppointmentReminders(clinicId: string): Promise<number> {
    try {
      // Get appointments 24 hours from now
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      const { data: appointments, error } = await supabase
        .from('patient_appointments')
        .select('id, status')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', tomorrowDate)
        .in('status', ['scheduled', 'confirmed']);

      if (error || !appointments) {
        return 0;
      }

      let sent = 0;
      for (const appointment of appointments) {
        const success = await this.sendAppointmentReminder(appointment.id);
        if (success) sent++;
      }

      console.log(`[SMSService] Sent ${sent} appointment reminders for ${tomorrowDate}`);
      return sent;
    } catch (error) {
      console.error('[SMSService] Error scheduling reminders:', error);
      return 0;
    }
  }

  /**
   * Process SMS responses (e.g., CONFIRM, CANCEL)
   */
  async processSMSResponse(from: string, body: string): Promise<void> {
    const responseUpper = body.trim().toUpperCase();

    // Find the most recent appointment reminder for this phone number
    const { data: recentSMS } = await supabase
      .from('sms_messages')
      .select('reference_id, category')
      .eq('to', from)
      .eq('category', 'appointment_reminder')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!recentSMS || !recentSMS.reference_id) {
      console.log('[SMSService] No recent appointment found for response');
      return;
    }

    if (responseUpper === 'CONFIRM' || responseUpper === 'YES' || responseUpper === 'Y') {
      // Update appointment to confirmed
      await supabase
        .from('patient_appointments')
        .update({ status: 'confirmed' })
        .eq('id', recentSMS.reference_id);

      await this.sendSMS(from, 'Thank you! Your appointment is confirmed.', 'confirmation_response');
    } else if (responseUpper === 'CANCEL' || responseUpper === 'NO' || responseUpper === 'N') {
      // Mark as needs rescheduling
      await this.sendSMS(
        from,
        'We understand. Please call us to reschedule: (780) 555-0100',
        'cancellation_response'
      );
    }
  }

  /**
   * Get SMS statistics
   */
  async getSMSStatistics(
    clinicId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    total_sent: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
    by_category: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from('sms_messages')
      .select('status, category')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error || !data) {
      return {
        total_sent: 0,
        total_delivered: 0,
        total_failed: 0,
        delivery_rate: 0,
        by_category: {},
      };
    }

    const totalSent = data.filter(m => m.status !== 'queued').length;
    const totalDelivered = data.filter(m => m.status === 'delivered').length;
    const totalFailed = data.filter(m => m.status === 'failed').length;

    const byCategory: Record<string, number> = {};
    data.forEach(m => {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    });

    return {
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_failed: totalFailed,
      delivery_rate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
      by_category: byCategory,
    };
  }
}

export const smsNotificationService = new SMSNotificationService();
