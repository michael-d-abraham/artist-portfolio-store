const { submitContactForm } = require('../services/contactFormService');

const postContactFormHandler = async (req, res) => {
    try {
        const result = await submitContactForm(req.body);
        if (!result.ok) {
            return res.status(result.status || 500).json({
                success: false,
                message: result.message || 'Unable to send message.'
            });
        }
        return res.json({
            success: true,
            message: result.message
        });
    } catch (err) {
        console.error('postContactForm', err);
        return res.status(500).json({
            success: false,
            message: 'Unable to send message.'
        });
    }
};

module.exports = { postContactFormHandler };
