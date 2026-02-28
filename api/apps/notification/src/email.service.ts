import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromAddress: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || '');
    this.fromAddress =
      process.env.EMAIL_FROM || 'MarketHub <noreply@markethub.dev>';
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
      );
    }
  }
}
