const axios = require('axios');

class ExchangeRateService {
  constructor() {
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY;
    this.baseURL = 'https://v6.exchangerate-api.com/v6';
  }

  async convertUSDToEGP(amount) {
    try {
      if (!this.apiKey) {
        throw new Error('Exchange Rate API key not found in environment variables');
      }

      const response = await axios.get(
        `${this.baseURL}/${this.apiKey}/pair/USD/EGP/${amount}`,
        {
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data.result === 'success') {
        return {
          success: true,
          data: {
            usdAmount: amount,
            egpAmount: response.data.conversion_result,
            exchangeRate: response.data.conversion_rate,
            lastUpdated: response.data.time_last_update_utc
          }
        };
      } else {
        throw new Error('API returned an error: ' + response.data['error-type']);
      }
    } catch (error) {
      console.error('Exchange Rate API Error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch exchange rate'
      };
    }
  }

  async getExchangeRate() {
    try {
      if (!this.apiKey) {
        throw new Error('Exchange Rate API key not found in environment variables');
      }

      const response = await axios.get(
        `${this.baseURL}/${this.apiKey}/latest/USD`,
        {
          timeout: 10000
        }
      );

      if (response.data.result === 'success') {
        return {
          success: true,
          data: {
            rate: response.data.conversion_rates.EGP,
            lastUpdated: response.data.time_last_update_utc
          }
        };
      } else {
        throw new Error('API returned an error: ' + response.data['error-type']);
      }
    } catch (error) {
      console.error('Exchange Rate API Error:', error.message);
      return {
        success: false,
        error: error.message || 'Failed to fetch exchange rate'
      };
    }
  }
}

module.exports = new ExchangeRateService(); 