
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RenewalEmailRequest {
  email: string;
  name: string;
  package: string;
  amount: number;
  discount: number;
  startDate: string;
  endDate: string;
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
    const { email, name, package: packageName, amount, discount, startDate, endDate }: RenewalEmailRequest = await req.json();

    // In a real application, you would use an email service like SendGrid or Resend
    // For now, we'll just log the email that would be sent
    
    console.log(`
      SENDING EMAIL TO: ${email}
      SUBJECT: Your GymStriveHub Membership Has Been Renewed
      
      Dear ${name},
      
      Great news! Your gym membership has been successfully renewed.
      
      Membership Details:
      - Package: ${packageName}
      - Amount Paid: Rs. ${amount}
      ${discount > 0 ? `- Discount Applied: Rs. ${discount}` : ''}
      - Start Date: ${formatDate(startDate)}
      - Expiry Date: ${formatDate(endDate)}
      
      Your next renewal will be due on ${formatDate(endDate)}.
      
      Thank you for being a valued member of our gym!
      
      Best regards,
      The GymStriveHub Team
    `);

    return new Response(JSON.stringify({ success: true, message: "Email would be sent in production" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-renewal-email function:", error);
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
