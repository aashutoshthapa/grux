
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderEmailRequest {
  email: string;
  name: string;
  package: string;
  endDate: string;
  daysLeft: number;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, package: packageName, endDate, daysLeft }: ReminderEmailRequest = await req.json();

    let subject, message;

    if (daysLeft === 0) {
      // Expired membership email
      subject = "Your GymStriveHub Membership Has Expired";
      message = `
        Dear ${name},
        
        Your gym membership has expired today.
        
        Membership Details:
        - Package: ${packageName}
        - Expiry Date: ${formatDate(endDate)}
        
        To continue enjoying our facilities, please renew your membership at your earliest convenience.
        
        We value having you as part of our fitness community!
        
        Best regards,
        The GymStriveHub Team
      `;
    } else {
      // Reminder email
      subject = `Your GymStriveHub Membership Expires in ${daysLeft} ${daysLeft === 1 ? 'Day' : 'Days'}`;
      message = `
        Dear ${name},
        
        This is a friendly reminder that your gym membership will expire soon.
        
        Membership Details:
        - Package: ${packageName}
        - Expiry Date: ${formatDate(endDate)}
        - Days remaining: ${daysLeft}
        
        To ensure uninterrupted access to our facilities, please renew your membership before the expiry date.
        
        We look forward to continuing to support your fitness journey!
        
        Best regards,
        The GymStriveHub Team
      `;
    }

    // In a real application, you would use an email service like SendGrid or Resend
    // For now, we'll just log the email that would be sent
    console.log(`
      SENDING EMAIL TO: ${email}
      SUBJECT: ${subject}
      
      ${message}
    `);

    return new Response(JSON.stringify({ success: true, message: "Email would be sent in production" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reminder-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
