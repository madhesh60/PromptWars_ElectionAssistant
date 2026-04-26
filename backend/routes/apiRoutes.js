const express = require('express')

const { getConfig } = require('../controllers/configController')
const { getElectionData } = require('../controllers/electionController')
const {
  handleGeminiText,
  handleGeminiVision,
} = require('../controllers/geminiController')
const { handleChat } = require('../controllers/chatController')
const { synthesizeAudio } = require('../controllers/ttsController')
const { analyzeBias } = require('../controllers/biasController')
const { getRepresentatives } = require('../controllers/representController')
const { getConstitutionAnswer } = require('../controllers/constitutionController')
const { validateInput } = require('../middleware/validation')

const router = express.Router()

router.get('/config', getConfig)
router.get('/election-data', getElectionData)
router.post('/gemini', validateInput, handleGeminiText)
router.post('/gemini-vision', validateInput, handleGeminiVision)
router.post('/chat', validateInput, handleChat)
router.post('/tts', synthesizeAudio)
router.post('/bias-detect', validateInput, analyzeBias)
router.post('/represent', validateInput, getRepresentatives)
router.post('/constitution', validateInput, getConstitutionAnswer)

module.exports = router
