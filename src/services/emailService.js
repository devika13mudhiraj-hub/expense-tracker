import emailjs from '@emailjs/browser';

// These should be configured in your EmailJS dashboard
// https://www.emailjs.com/
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_26s5iwk', // Replace with your Service ID
  TEMPLATE_ID: 'template_8ri0t7q', // Replace with your Template ID
  PUBLIC_KEY: '_3WCuT4kdZetbwRqK', // Replace with your Public Key
};

/**
 * Send an email notification using EmailJS
 * @param {Object} templateParams - The parameters for the email template
 * @returns {Promise} - The result of the email sending
 */
const sendEmail = async (templateParams) => {
  try {
    // If the public key is not set, we just log to console for development
    if (EMAILJS_CONFIG.PUBLIC_KEY === 'your_public_key' || !EMAILJS_CONFIG.PUBLIC_KEY) {
      console.log('--- MOCK EMAIL SENT ---');
      console.log('Template Params:', templateParams);
      console.log('Setup EmailJS keys in src/services/emailService.js to send real emails.');
      return { status: 200, text: 'OK' };
    }

    console.log('Attempting to send email via EmailJS...', templateParams.type);
    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );
    console.log('EmailJS Success:', response.status, response.text);
    return response;
  } catch (error) {
    console.error('EmailJS Send Error:', error);
    throw error;
  }
};

export const emailService = {
  /**
   * Notify user when a category budget is exceeded
   */
  notifyBudgetExceeded: (userEmail, userName, category, limit, spent) => {
    return sendEmail({
      to_email: userEmail,
      to_name: userName,
      name: userName,
      time: new Date().toLocaleString('en-IN'),
      subject: `🚨 Budget Alert: ${category} limit exceeded!`,
      message: `Your spending in "${category}" has reached ₹${spent.toLocaleString('en-IN')}, which exceeds your budget limit of ₹${limit.toLocaleString('en-IN')}.\n\nPlease review your expenses.`,
      type: 'budget_exceed',
      category,
      limit,
      spent
    });
  },

  /**
   * Notify user when total expenses reach monthly income
   */
  notifyIncomeReached: (userEmail, userName, income, spent) => {
    return sendEmail({
      to_email: userEmail,
      to_name: userName,
      name: userName,
      time: new Date().toLocaleString('en-IN'),
      subject: `⚠️ Warning: Expenses reached your income!`,
      message: `Your total monthly expenses have reached ₹${spent.toLocaleString('en-IN')}, which is equal to or exceeds your total monthly income of ₹${income.toLocaleString('en-IN')}.\n\nBe careful with further spending this month!`,
      type: 'income_reached',
      income,
      spent
    });
  },

  /**
   * Notify user about a due reminder
   */
  notifyReminderDue: (userEmail, userName, title, dueDate) => {
    return sendEmail({
      to_email: userEmail,
      to_name: userName,
      name: userName,
      time: new Date().toLocaleString('en-IN'),
      subject: `🔔 Reminder: ${title} is due!`,
      message: `This is a reminder that "${title}" is due on ${new Date(dueDate).toLocaleDateString('en-IN')}.\n\nDon't forget to take action!`,
      type: 'reminder',
      reminder_title: title,
      due_date: dueDate
    });
  }
};
