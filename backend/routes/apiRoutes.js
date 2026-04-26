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

const router = express.Router()

router.get('/config', getConfig)
router.get('/election-data', getElectionData)
router.post('/gemini', handleGeminiText)
router.post('/gemini-vision', handleGeminiVision)
router.post('/chat', handleChat)
router.post('/tts', synthesizeAudio)
router.post('/bias-detect', analyzeBias)
router.post('/represent', getRepresentatives)
router.post('/constitution', getConstitutionAnswer)

module.exports = router
