import axios from 'axios';
import crypto from 'crypto';

class ChapaService {
    constructor() {
        this.baseURL = 'https://api.chapa.co/v1';
        this.secretKey = process.env.CHAPA_SECRET_KEY;
        this.webhookSecret = process.env.CHAPA_WEBHOOK_SECRET;
    }

    // Generate unique transaction reference
    generateTxRef() {
        return `tx-${crypto.randomBytes(16).toString('hex')}`;
    }

    // Initialize payment
    async initializePayment({ amount, email, firstName, lastName, title, description, returnUrl }) {
        try {
            const txRef = this.generateTxRef();
            
            const response = await axios.post(
                `${this.baseURL}/transaction/initialize`,
                {
                    amount: amount.toString(),
                    currency: 'ETB',
                    email: email || 'customer@email.com',
                    first_name: firstName,
                    last_name: lastName,
                    tx_ref: txRef,
                    title: title,
                    description: description,
                    callback_url: returnUrl,
                    return_url: returnUrl,
                    customization: {
                        title: 'SplitBill Ethiopia',
                        description: 'Group Expense Payment'
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.secretKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                success: true,
                txRef,
                checkoutUrl: response.data.data.checkout_url,
                data: response.data
            };
        } catch (error) {
            console.error('❌ Chapa initialize error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Verify payment
    async verifyPayment(txRef) {
        try {
            const response = await axios.get(
                `${this.baseURL}/transaction/verify/${txRef}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.secretKey}`
                    }
                }
            );

            return {
                success: true,
                status: response.data.data.status,
                data: response.data.data
            };
        } catch (error) {
            console.error('❌ Chapa verify error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    // Verify webhook signature
    verifyWebhook(signature, payload) {
        const hash = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(JSON.stringify(payload))
            .digest('hex');
        
        return hash === signature;
    }
}

export default new ChapaService();