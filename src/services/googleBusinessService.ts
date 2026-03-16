import { supabase } from '../lib/supabase';

export interface GoogleReview {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  review_date: string;
  reply_text?: string;
  reply_date?: string;
}

export interface ReviewMetrics {
  average_rating: number;
  total_reviews: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
  recent_reviews: GoogleReview[];
  response_rate: number;
  negative_reviews_unaddressed: number;
}

export interface ReviewRequest {
  patient_id: string;
  patient_name: string;
  patient_email?: string;
  clinic_id: string;
  appointment_id: string;
  request_sent_at: string;
  review_link: string;
  status: 'pending' | 'completed' | 'declined';
}

class GoogleBusinessService {
  /**
   * Send review request to patient after positive visit
   */
  async requestReview(
    patientId: string,
    appointmentId: string,
    clinicId: string
  ): Promise<boolean> {
    try {
      // Get patient and clinic details
      const { data: patient } = await supabase
        .from('patients')
        .select('first_name, last_name, email')
        .eq('id', patientId)
        .single();

      const { data: clinic } = await supabase
        .from('clinics')
        .select('name, city')
        .eq('id', clinicId)
        .single();

      if (!patient || !clinic) {
        return false;
      }

      // Generate Google review link
      const reviewLink = this.generateReviewLink(clinicId, clinic.city);

      // Create review request record
      const { error } = await supabase
        .from('review_requests')
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          appointment_id: appointmentId,
          review_link: reviewLink,
          request_sent_at: new Date().toISOString(),
          status: 'pending',
        });

      if (error) {
        console.error('[GoogleBusinessService] Error creating review request:', error);
        return false;
      }

      // Send email/SMS with review link
      console.log('[GoogleBusinessService] Review request sent:', {
        patient: `${patient.first_name} ${patient.last_name}`,
        clinic: clinic.name,
        link: reviewLink,
      });

      return true;
    } catch (error) {
      console.error('[GoogleBusinessService] Error requesting review:', error);
      return false;
    }
  }

  /**
   * Generate Google review link for specific clinic
   */
  private generateReviewLink(clinicId: string, clinicCity: string): string {
    // In production, this would use actual Google Place ID
    // Format: https://search.google.com/local/writereview?placeid=PLACE_ID
    const citySlug = clinicCity.toLowerCase().replace(/\s+/g, '-');
    return `https://g.page/r/AIM-${citySlug}/review`;
  }

  /**
   * Monitor reviews from Google My Business API
   */
  async fetchReviews(clinicId: string): Promise<GoogleReview[]> {
    try {
      // In production, this would call Google My Business API
      // For now, fetch from our database cache
      const { data: reviews, error } = await supabase
        .from('google_reviews')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('review_date', { ascending: false });

      if (error) {
        console.error('[GoogleBusinessService] Error fetching reviews:', error);
        return [];
      }

      return (reviews || []).map(r => ({
        id: r.id,
        reviewer_name: r.reviewer_name,
        rating: r.rating,
        review_text: r.review_text,
        review_date: r.review_date,
        reply_text: r.reply_text,
        reply_date: r.reply_date,
      }));
    } catch (error) {
      console.error('[GoogleBusinessService] Error in fetchReviews:', error);
      return [];
    }
  }

  /**
   * Alert on negative reviews
   */
  async monitorNegativeReviews(clinicId: string): Promise<GoogleReview[]> {
    const reviews = await this.fetchReviews(clinicId);

    // Filter for negative reviews (3 stars or below) without replies
    const negativeUnreplied = reviews.filter(
      r => r.rating <= 3 && !r.reply_text
    );

    if (negativeUnreplied.length > 0) {
      console.warn('[GoogleBusinessService] Negative reviews need attention:', negativeUnreplied.length);

      // Create alerts for managers
      for (const review of negativeUnreplied) {
        await this.createReviewAlert(clinicId, review);
      }
    }

    return negativeUnreplied;
  }

  /**
   * Create alert for clinic manager about review
   */
  private async createReviewAlert(clinicId: string, review: GoogleReview): Promise<void> {
    try {
      const { error } = await supabase
        .from('alerts')
        .insert({
          clinic_id: clinicId,
          alert_type: 'negative_review',
          severity: review.rating === 1 ? 'critical' : 'high',
          title: `${review.rating}-Star Review Needs Response`,
          description: `${review.reviewer_name}: "${review.review_text.substring(0, 100)}..."`,
          reference_id: review.id,
          created_at: new Date().toISOString(),
          is_resolved: false,
        });

      if (error) {
        console.error('[GoogleBusinessService] Error creating alert:', error);
      }
    } catch (error) {
      console.error('[GoogleBusinessService] Error in createReviewAlert:', error);
    }
  }

  /**
   * Post reply to Google review
   */
  async replyToReview(
    reviewId: string,
    replyText: string
  ): Promise<boolean> {
    try {
      // In production, this would use Google My Business API to post reply
      // For now, update our database
      const { error } = await supabase
        .from('google_reviews')
        .update({
          reply_text: replyText,
          reply_date: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (error) {
        console.error('[GoogleBusinessService] Error replying to review:', error);
        return false;
      }

      console.log('[GoogleBusinessService] Reply posted to review:', reviewId);

      // Mark alert as resolved
      await supabase
        .from('alerts')
        .update({ is_resolved: true })
        .eq('reference_id', reviewId)
        .eq('alert_type', 'negative_review');

      return true;
    } catch (error) {
      console.error('[GoogleBusinessService] Error in replyToReview:', error);
      return false;
    }
  }

  /**
   * Get review metrics for clinic
   */
  async getReviewMetrics(clinicId: string): Promise<ReviewMetrics> {
    const reviews = await this.fetchReviews(clinicId);

    if (reviews.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
        recent_reviews: [],
        response_rate: 0,
        negative_reviews_unaddressed: 0,
      };
    }

    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    const fiveStar = reviews.filter(r => r.rating === 5).length;
    const fourStar = reviews.filter(r => r.rating === 4).length;
    const threeStar = reviews.filter(r => r.rating === 3).length;
    const twoStar = reviews.filter(r => r.rating === 2).length;
    const oneStar = reviews.filter(r => r.rating === 1).length;

    const reviewsWithReplies = reviews.filter(r => r.reply_text).length;
    const responseRate = (reviewsWithReplies / totalReviews) * 100;

    const negativeUnaddressed = reviews.filter(r => r.rating <= 3 && !r.reply_text).length;

    return {
      average_rating: Math.round(averageRating * 10) / 10,
      total_reviews: totalReviews,
      five_star: fiveStar,
      four_star: fourStar,
      three_star: threeStar,
      two_star: twoStar,
      one_star: oneStar,
      recent_reviews: reviews.slice(0, 5),
      response_rate: Math.round(responseRate),
      negative_reviews_unaddressed: negativeUnaddressed,
    };
  }

  /**
   * Update metrics dashboard
   */
  async updateMetricsDashboard(clinicId: string): Promise<void> {
    const metrics = await this.getReviewMetrics(clinicId);

    // Store metrics for dashboard display
    const { error } = await supabase
      .from('clinic_metrics')
      .upsert({
        clinic_id: clinicId,
        metric_type: 'google_reviews',
        value: metrics.average_rating,
        metadata: {
          total_reviews: metrics.total_reviews,
          distribution: {
            five_star: metrics.five_star,
            four_star: metrics.four_star,
            three_star: metrics.three_star,
            two_star: metrics.two_star,
            one_star: metrics.one_star,
          },
          response_rate: metrics.response_rate,
          negative_unaddressed: metrics.negative_reviews_unaddressed,
        },
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[GoogleBusinessService] Error updating metrics:', error);
    }
  }

  /**
   * Determine if patient should be asked for review
   * Based on visit sentiment and history
   */
  async shouldRequestReview(
    patientId: string,
    appointmentId: string
  ): Promise<{ shouldRequest: boolean; reason: string }> {
    // Check if patient has already been asked recently
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: recentRequests } = await supabase
      .from('review_requests')
      .select('id')
      .eq('patient_id', patientId)
      .gte('request_sent_at', thirtyDaysAgo.toISOString());

    if (recentRequests && recentRequests.length > 0) {
      return {
        shouldRequest: false,
        reason: 'Patient was asked for review within last 30 days',
      };
    }

    // Check if appointment was positive (could use NPS score or clinician notes)
    // For now, assume positive unless marked otherwise
    const { data: appointment } = await supabase
      .from('patient_appointments')
      .select('status')
      .eq('id', appointmentId)
      .single();

    if (appointment?.status !== 'completed') {
      return {
        shouldRequest: false,
        reason: 'Appointment not completed',
      };
    }

    // Check patient's overall experience
    // In production, this would check NPS scores, complaint history, etc.

    return {
      shouldRequest: true,
      reason: 'Patient is a good candidate for review request',
    };
  }

  /**
   * Automated review request workflow
   * Run after each completed appointment
   */
  async automatedReviewWorkflow(appointmentId: string): Promise<void> {
    try {
      const { data: appointment } = await supabase
        .from('patient_appointments')
        .select('patient_id, clinic_id, status')
        .eq('id', appointmentId)
        .single();

      if (!appointment || appointment.status !== 'completed') {
        return;
      }

      const { shouldRequest, reason } = await this.shouldRequestReview(
        appointment.patient_id,
        appointmentId
      );

      console.log('[GoogleBusinessService] Review workflow decision:', {
        appointmentId,
        shouldRequest,
        reason,
      });

      if (shouldRequest) {
        // Wait 24 hours after appointment to send request
        setTimeout(async () => {
          await this.requestReview(
            appointment.patient_id,
            appointmentId,
            appointment.clinic_id
          );
        }, 24 * 60 * 60 * 1000);
      }
    } catch (error) {
      console.error('[GoogleBusinessService] Error in automated workflow:', error);
    }
  }

  /**
   * Get review request statistics
   */
  async getReviewRequestStats(
    clinicId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    total_requests: number;
    reviews_received: number;
    conversion_rate: number;
    average_rating_from_requests: number;
  }> {
    const { data: requests } = await supabase
      .from('review_requests')
      .select('*')
      .eq('clinic_id', clinicId)
      .gte('request_sent_at', startDate)
      .lte('request_sent_at', endDate);

    if (!requests || requests.length === 0) {
      return {
        total_requests: 0,
        reviews_received: 0,
        conversion_rate: 0,
        average_rating_from_requests: 0,
      };
    }

    const totalRequests = requests.length;
    const reviewsReceived = requests.filter(r => r.status === 'completed').length;
    const conversionRate = (reviewsReceived / totalRequests) * 100;

    return {
      total_requests: totalRequests,
      reviews_received: reviewsReceived,
      conversion_rate: Math.round(conversionRate),
      average_rating_from_requests: 0, // Would need to link to actual reviews
    };
  }

  /**
   * Sync reviews from Google My Business API
   * Should be run periodically (e.g., every hour)
   */
  async syncReviewsFromGoogle(clinicId: string): Promise<number> {
    try {
      // In production, this would call Google My Business API
      // const apiReviews = await googleMyBusinessAPI.getReviews(placeId);

      console.log('[GoogleBusinessService] Syncing reviews from Google for clinic:', clinicId);

      // For now, simulate successful sync
      return 0; // Number of new reviews synced
    } catch (error) {
      console.error('[GoogleBusinessService] Error syncing reviews:', error);
      return 0;
    }
  }
}

export const googleBusinessService = new GoogleBusinessService();
