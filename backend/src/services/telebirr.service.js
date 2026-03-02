import axios from 'axios';
import crypto from 'crypto';

class TeleBirrService {
    constructor() {
        this.baseURL = process.env.TELEBIRR_API_URL || 'https://api.telebirr.et';
        this.appId = process.env.TELEBIRR_APP_ID;
        this.appKey = process.env.TELEBIRR_APP_KEY;
        this.shortCode = process.env.TELEBIRR_SHORT_CODE;
    }

    // Generate unique transaction ID
    generateTransactionId() {
        return `TB${Date.now()}${crypto.randomBytes(4).toString('hex')}`;
    }

    // Initialize TeleBirr payment
    async initializePayment({ amount, phoneNumber, description, returnUrl }) {
        try {
            const transactionId = this.generateTransactionId();
            
            // Note: This is a simplified version. Actual TeleBirr API may differ
            const response = await axios.post(
                `${this.baseURL}/payment/initiate`,
                {
                    appId: this.appId,
                    transactionId: transactionId,
                    amount: amount.toString(),
                    currency: 'ETB',
                    phoneNumber: phoneNumber,
                    description: description,
                    returnUrl: returnUrl,
                    shortCode: this.shortCode,
                    timestamp: new Date().toISOString()
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.generateSignature(transactionId)}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                transactionId,
                checkoutUrl: response.data.checkoutUrl || null,
                data: response.data
            };
        } catch (error) {
            console.error('❌ TeleBirr initialize error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Generate signature for TeleBirr request
    generateSignature(transactionId) {
        const data = `${this.appId}${transactionId}${this.appKey}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // Check payment status
    async checkPaymentStatus(transactionId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/payment/status/${transactionId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.appKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                status: response.data.status,
                data: response.data
            };
        } catch (error) {
            console.error('❌ TeleBirr status error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }
}

export default new TeleBirrService();