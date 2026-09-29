import express from 'express'
import { optimizeLinkedIn } from '../controllers/linkedinOptimizationController.js'

const linkedinOptimizationRouter = express.Router()
linkedinOptimizationRouter.post('/linkedin-optimization', optimizeLinkedIn)

export default linkedinOptimizationRouter
