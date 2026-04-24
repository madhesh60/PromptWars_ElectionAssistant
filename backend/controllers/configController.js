/**
 * Returns configuration status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
const getConfig = (req, res) => {
  res.json({
    status: 'secure',
    message: 'API keys are secured on the backend.',
  })
}

module.exports = { getConfig }
