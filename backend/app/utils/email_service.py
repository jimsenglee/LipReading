"""
Email service utility for sending emails
Uses smtplib for Gmail SMTP
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
import os


class EmailService:
    """email service for sending emails via Gmail SMTP"""
    
    @staticmethod
    def _get_smtp_config():
        """get SMTP configuration from app config or environment"""
        return {
            'server': os.getenv('MAIL_SERVER', 'smtp.gmail.com'),
            'port': int(os.getenv('MAIL_PORT', '587')),
            'username': os.getenv('MAIL_USERNAME', 'chikiongboon@gmail.com'),
            'password': os.getenv('MAIL_PASSWORD', 'ehyizsqusmaqujvz'),
            'use_tls': os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
        }
    
    @staticmethod
    def _send_email(to_email: str, subject: str, html_body: str, text_body: str = None):
        """send email using SMTP"""
        try:
            config = EmailService._get_smtp_config()
            current_app.logger.info(f"[DEBUG] email service: preparing to send email to {to_email}")
            current_app.logger.debug(f"[DEBUG] email service: SMTP server: {config['server']}, port: {config['port']}, use_tls: {config['use_tls']}")
            current_app.logger.debug(f"[DEBUG] email service: from: {config['username']}")
            
            # create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = config['username']
            msg['To'] = to_email
            
            # add text and html parts
            if text_body:
                text_part = MIMEText(text_body, 'plain')
                msg.attach(text_part)
            
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
            
            current_app.logger.debug(f"[DEBUG] email service: connecting to SMTP server...")
            # connect to SMTP server and send
            with smtplib.SMTP(config['server'], config['port']) as server:
                if config['use_tls']:
                    current_app.logger.debug(f"[DEBUG] email service: starting TLS...")
                    server.starttls()
                
                current_app.logger.debug(f"[DEBUG] email service: logging in...")
                server.login(config['username'], config['password'])
                
                current_app.logger.debug(f"[DEBUG] email service: sending message...")
                server.send_message(msg)
            
            current_app.logger.info(f"[DEBUG] email service: email sent successfully to {to_email}")
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            current_app.logger.error(f"[DEBUG] email service: SMTP authentication failed: {str(e)}")
            return False
        except smtplib.SMTPException as e:
            current_app.logger.error(f"[DEBUG] email service: SMTP error: {str(e)}")
            return False
        except Exception as e:
            current_app.logger.error(f"[DEBUG] email service: failed to send email to {to_email}: {str(e)}", exc_info=True)
            return False
    
    @staticmethod
    def send_password_reset_email(email: str, reset_link: str):
        """send password reset email with reset link"""
        subject = "Password Reset Request - LipReading"
        
        text_body = f"""
        You have requested to reset your password for your LipReading account.
        
        Please click the following link to reset your password:
        {reset_link}
        
        This link will expire in 1 hour.
        
        If you did not request this password reset, please ignore this email.
        """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #7E57C2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Password Reset Request</h2>
                <p>You have requested to reset your password for your LipReading account.</p>
                <p>Please click the button below to reset your password:</p>
                <a href="{reset_link}" class="button">Reset Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #7E57C2;">{reset_link}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you did not request this password reset, please ignore this email.</p>
                <div class="footer">
                    <p>This is an automated email from LipReading. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return EmailService._send_email(email, subject, html_body, text_body)
    
    @staticmethod
    def send_2fa_code_email(email: str, code: str):
        """send 2FA verification code email"""
        subject = "Your 2FA Verification Code - LipReading"
        
        text_body = f"""
        Your two-factor authentication code is: {code}
        
        This code will expire in 5 minutes.
        
        If you did not request this code, please ignore this email.
        """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .code {{ font-size: 32px; font-weight: bold; color: #7E57C2; text-align: center; padding: 20px; background-color: #f5f5f5; border-radius: 5px; margin: 20px 0; }}
                .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Two-Factor Authentication Code</h2>
                <p>Your verification code is:</p>
                <div class="code">{code}</div>
                <p><strong>This code will expire in 5 minutes.</strong></p>
                <p>If you did not request this code, please ignore this email.</p>
                <div class="footer">
                    <p>This is an automated email from LipReading. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return EmailService._send_email(email, subject, html_body, text_body)

